const fs = require('fs')

function chunkString(str, size) {
    const numChunks = Math.ceil(str.length / size)
    const chunks = new Array(numChunks)
  
    for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
      chunks[i] = str.substr(o, size)
    }
  
    return chunks
  }

function replaceBegining(str, search) {
    if (str.startsWith(search)) {
        const slices = chunkString(str, search.length)
        let counts = 0
        for (let i = 0; i < str.length; i++) {
            if (slices[i] === search) {
                counts += search.length
            } else {
                break
            }
        }

        return str.substr(counts)
    }
    return str
}


function parseArgs(args) {
    const configs = {}
    const namelessArgs = []
    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith("--") || args[i].startsWith("-")) {
            const value = args[i + 1]
            if (!value || value.startsWith("--") || value.startsWith("-")) {
                configs[replaceBegining(args[i], "-")] = true
            } else {
                configs[replaceBegining(args[i], "-")] = args[++i]
            }
        } else {
            namelessArgs.push(args[i])
        }
    }

    return { configs, namelessArgs, get: function(name, full) {
        const val = this.configs[name] ?? this.configs[full]
        return typeof val === 'boolean' ? null : val
    }, option: function(name, full) {
        return this.configs[name] ?? this.configs[full] ?? false
    }, nameless: function(index) {
        return this.namelessArgs[index]
    } }
}

function readFile(file, errorMessage) { 
    if (!fs.existsSync(file)) {
        console.log(errorMessage)
        process.exit(1)
    }

    return fs.readFileSync(file).toString('utf8')
}

module.exports = { parseArgs, readFile }