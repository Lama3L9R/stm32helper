const { regexStartsWith } = require("./strings")

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

module.exports = { findMakefileVar, makefileVarParse }