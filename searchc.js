const { parseArgs, readFile } = require("./utils/cli") 
const { findMakefileVar } = require("./utils/make")
const ioc = require("./utils/ioc")
const fs = require('fs')
const { join, resolve } = require('path')

const resourcesRecursive = (path, accu) => {
    if (!accu) {
        return resourcesRecursive(path, [])
    }

    if (fs.lstatSync(path).isFile()) {
        accu.push(path)
    } else {
        fs.readdirSync(path).forEach(it => resourcesRecursive(join(path, it), accu))
    }

    return accu
}

const removeDiff = (a, b) => {
    const accu = []
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        if (a[i] && !b.includes(a[i])) {
            accu.push(a[i])
        }

        if (b[i] && !a.includes(b[i])) {
            accu.push(b[i])
        }
    }
    return accu
}

const main = (argsRaw) => {
    const args = parseArgs(argsRaw)
    const projectRoot = args.nameless(0)

    if (!fs.existsSync(projectRoot)) {
        return console.log("Project root does not exist! Abort!")
    }

    const iocFile = new ioc(readFile(resolve(projectRoot, fs.readdirSync(projectRoot).find(it => it.endsWith(".ioc"))), "No ioc file was found! Abort! Make sure you have a STM32CubeMX generated project at project root!"))
    const src = iocFile.get("ProjectManager.MainLocation").trim()
    const make = readFile(resolve(projectRoot, "Makefile"), "No 'Makefile' is detected! Abort!").split("\n")

    const excludeCSources = findMakefileVar(make, "C_SOURCES").filter(it => it.startsWith("Core/Src/")).map(it => resolve(projectRoot, it))
    removeDiff(resourcesRecursive(resolve(projectRoot, src)), excludeCSources).forEach(it => console.log(it))
}

module.exports = main