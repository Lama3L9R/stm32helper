const fs = require('fs')
const path = require('path')
const exec = require("shelljs.exec")
const { parseArgs } = require("./cli")

/*

Node.js String#split fix by Qumolama
Published at https://t.me/lamaradio/113
Opensource under Anti-996
Copyright 2022-Present Qumolama

*/
String.prototype._split = String.prototype.split
String.prototype.split = function(separator, limit) {
    if (separator === undefined && limit === 0) return []

    if(limit === undefined) {
        return String.prototype._split.call(this, separator, limit)
    }

    const arr = []
    let lastBegin = -1
    for(let i = 0; i < limit - 1; i++) {
        const end = String.prototype.indexOf.call(this, separator, ++lastBegin)
        if(end == -1) {
            arr.push(undefined)
            continue
        }
        arr.push(String.prototype.substring.call(this, lastBegin, end))
        lastBegin = end
    }
    arr.push(String.prototype.substring.call(this, ++lastBegin))

    return arr
}

function readFile(file, errorMessage) { 
    if (!fs.existsSync(file)) {
        console.log(errorMessage)
        process.exit(1)
    }

    return fs.readFileSync(file).toString('utf8')
}

function makefileVarParse(lines, lineBegin) {
    const varTable = {}
    const result = []
    let ml = false

    const [key, v] = lines[lineBegin].split("=", 2).map(it => it.trim())
    if (v.trim().endsWith("\\")) {
        const val = v.replace("\\", "").trim()
        if (val) {
            result.push(val)
        }
    } else {
        varTable[key] = v
        return varTable
    }

    for (let i = lineBegin + 1; i < lines.length; i ++) {
        let value = lines[i].replace("\\", "").trim()

        if (value) {
            result.push(value)
        }

        if (!lines[i].trim().endsWith("\\")) {
            break
        }
    }

    varTable[key] = result
    return varTable
} 

function findMakefileVar(lines, key) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        if (regexStartsWith(line.trim(), new RegExp(`${key}[ ]?=`, "g"))) {
            return makefileVarParse(lines, i)[key]
        }
    }
}

function regexStartsWith(str, regex) {
    return str.indexOf(str.match(regex)) === 0
}

const main = (args) => {
    const { configs, namelessArgs } = parseArgs(args)

    const projectRoot = namelessArgs[0]

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

    const defaultPath = configs["gcc"] ?? "/usr/lib/gcc/arm-none-eabi"
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

    console.log(JSON.stringify(vscodeConfig, null, 4))
}

module.exports = main