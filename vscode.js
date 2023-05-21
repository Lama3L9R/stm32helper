const fs = require('fs')
const path = require('path')
const exec = require("shelljs.exec")
const { parseArgs, readFile } = require("./utils/cli")
const downloadSVD = require("./svd")
const ioc = require("./utils/ioc")
const { findMakefileVar } = require('./utils/make')

function createCortexDebugTemplate(mode, cpuFreq, device, execPath, server) {
    return {
        "name": "JLink " + mode === 'attach' ? "Attach" : "Debug",
        "cwd": "${workspaceFolder}",
        "executable": execPath,
        "request": mode === 'attach'? mode : "launch",
        "type": "cortex-debug",
        "runToEntryPoint": "main",
        "servertype": server,
        "device": device,
        "interface": "swd",
        "showDevDebugOutput": "raw",
        "svdFile": `${"${workspaceFolder}"}/${device}.svd`,
        "preLaunchTask": "Build",
        "runToMain": mode === 'attach' ? undefined : true,
        "swoConfig":
        {
            "enabled": true,
            "cpuFrequency": cpuFreq,
            "swoFrequency": 4000000,
            "source": "probe",
            "decoders":
            [
                {
                    "label": "ITM port 0 output",
                    "type": "console",
                    "port": 0,
                    "showOnStartup": true,
                    "encoding": "ascii"
                }
            ]
        }
    }
}

const main = (argsRaw) => {
    const args = parseArgs(argsRaw)

    const projectRoot = args.nameless(0)

    if (!fs.existsSync(projectRoot)) {
        return console.log("Project root does not exist! Abort!")
    }

    if (!fs.existsSync(path.resolve(projectRoot, ".vscode"))) {
        fs.mkdirSync(path.resolve(projectRoot, ".vscode"))
    }

    const generates = [genCProfile]

    if (args.option("c", "no-cprofile")) {
        generates.pop()
    }

    if (args.option("j", "jlink-cortex-debug")) {
        generates.push(genJLinkCortexDebugProfile)
    }

    if (args.option("l", "launch-profile")) {
        generates.push(genBuildProfile)
    }

    if (args.option("d", "download-svd")) {
        generates.push(downloadProjectSVD)
    }

    if (args.option(null, "jlink-all")) {
        generates.push(genBuildProfile)
        generates.push(genJLinkCortexDebugProfile)
        generates.push(downloadProjectSVD)
    }

    generates.forEach(it => it(args, projectRoot))
}

const genCProfile = (args, projectRoot) => {
    if (!projectRoot) {
        console.log("Create a C/C++ profile for vscode")
        console.log(`Usage: node ${process.argv[1]} <project root dir>`)
        process.exit(0)
    }
    
    if (!fs.existsSync(projectRoot)) {
        console.log(`Folder ${projectRoot} does not exists`)
        process.exit(1)
    }
    
    // load makefile

    const make = readFile(path.resolve(projectRoot, "Makefile"), "No 'Makefile' is detected! Abort!")
    const makelines = make.split("\n")

    // find defines

    const cpu = findMakefileVar(makelines, "CPU")
    const fpu = findMakefileVar(makelines, "FPU")
    const floatABI = findMakefileVar(makelines, "FLOAT-ABI")
    
    const defines = (exec(`arm-none-eabi-gcc ${cpu} -mthumb ${fpu ?? ""} ${floatABI ?? ""} -E -dM - < /dev/null | sort`, { async: false }).stdout + "")
        .split("\n")
        .map(it => {
            const [,key, value] = it.split(" ", 3)
            if (value.trim()) {
                return `${key}=${value}`
            } else {
                return key
            }
        })

    defines.push(...findMakefileVar(makelines, "C_DEFS").map(it => it.replace("-D", "")))
    
    // find gcc headers

    const defaultPath = args.get("g", "gcc") ?? "/usr/lib/gcc/arm-none-eabi"
    if (!fs.existsSync(defaultPath)) {
        console.log("default path for arm-none-eabi not found! please specifiy with --gcc <path/to/gcc/arm-none-eabi>")
        process.exit(1)
    }
    let gccHome = defaultPath
    if (!fs.readdirSync(gccHome).some(it => it === "include")) {
        gccHome = fs
            .readdirSync(gccHome)
            .filter(it => fs.readdirSync(path.join(defaultPath, it)).some(it => it === "include"))[0]
        if (!gccHome) {
            console.log("No gcc installation was found! Please check your installation")
            process.exit(1)
        }
        gccHome = path.join(defaultPath, gccHome)
    }

    // find project headers

    const cIncludes = findMakefileVar(makelines, "C_INCLUDES").map(it => it.replace("-I", ""))

    const vscodeConfig = {
        configurations: [
            {
                name: "STM32Helper",
                includePath: [...cIncludes, path.resolve(gccHome, "include"), path.resolve(gccHome, "include-fixed")],
                browse: {
                    path: [...cIncludes, path.resolve(gccHome, "include"), path.resolve(gccHome, "include-fixed")],
                    limitSymbolsToIncludedHeaders: true,
                    "databaseFilename": ""
                },
                defines,
                intelliSenseMode: "clang-x64",
                compilerPath: `/usr/bin/arm-none-eabi-gcc ${cpu} -mthumb ${fpu ?? ""} ${floatABI ?? ""}`,
                cStandard: "c17",
            }
        ]
    }
    
    if (args.option("p", "print")) {
        console.log(JSON.stringify(vscodeConfig, null, 4))
    } else {
        fs.writeFileSync(args.get("o", "output") ?? path.resolve(projectRoot, ".vscode/c_cpp_properties.json"), JSON.stringify(vscodeConfig, null, 4))
    }
}

const genJLinkCortexDebugProfile = (args, projectRoot) => {
    const iocFile = new ioc(readFile(path.resolve(projectRoot, fs.readdirSync(projectRoot).find(it => it.endsWith(".ioc"))), "No ioc file was found! Abort! Make sure you have a STM32CubeMX generated project at project root!"))
    const make = readFile(path.resolve(projectRoot, "Makefile"), "No 'Makefile' is detected! Abort!").split("\n")
    
    const print = args.option("p", "print")

    const deviceName = iocFile.get("Mcu.CPN").trim().slice(0, -2)
    const cpuFreq = parseInt(iocFile.get("RCC.SYSCLKFreq_VALUE").trim())

    const target = findMakefileVar(make, "TARGET").trim()
    const buildDir = findMakefileVar(make, "BUILD_DIR").trim()

    const debugProfile = createCortexDebugTemplate('debug', cpuFreq, deviceName, `./${buildDir}/${target}.elf`, 'jlink')
    const attachProfile = createCortexDebugTemplate('attach', cpuFreq, deviceName, `./${buildDir}/${target}.elf`, 'jlink')

    if (print) {
        console.log(JSON.stringify({
            version: "0.2.0",
            configurations: [debugProfile, attachProfile]
        }, null, 4))
    } else {
        fs.writeFileSync(args.get("o", "output") ?? path.resolve(projectRoot, ".vscode", "launch.json"), JSON.stringify({
            version: "0.2.0",
            configurations: [debugProfile, attachProfile]
        }, null, 4))
    }
}

const downloadProjectSVD = (args, projectRoot) => {
    const iocFile = new ioc(readFile(path.resolve(projectRoot, fs.readdirSync(projectRoot).find(it => it.endsWith(".ioc"))), "No ioc file was found! Abort! Make sure you have a STM32CubeMX generated project at project root!"))
    const deviceName = iocFile.get("Mcu.CPN").trim().slice(0, -2)

    if (args.option("p", "print")) {
        downloadSVD(["-d", deviceName, "-o", path.resolve(projectRoot, deviceName + ".svd"), "-q", "-p"])
    } else {
        downloadSVD(["-d", deviceName, "-o", path.resolve(projectRoot, deviceName + ".svd")])
    }
}

const genBuildProfile = (args, projectRoot) => {
    const print = args.option("p", "print")

    const config = {
        "version": "2.0.0",
        "tasks": [
            {
                "label": "Build",
                "command": "make",
                "type": "shell",
                "args": ["all", "-j8"],
                "group": "build"
            },
            {
                "label": "Clean",
                "command": "make",
                "type": "shell",
                "args": ["clean", "-j8"],
                "group": "build"
            }
        ]
    }

    if (print) {
        console.log(JSON.stringify(config, null, 4))
    } else {
        fs.writeFileSync(path.resolve(projectRoot, ".vscode/tasks.json"), JSON.stringify(config, null, 4))
    }
}


module.exports = main