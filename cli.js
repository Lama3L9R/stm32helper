function parseArgs(args) {
    const configs = {}
    const namelessArgs = []
    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith("--")) {
            const value = args[i + 1]
            if (value && value.startsWith("--")) {
                configs[args[i]] = null
            } else {
                configs[args[i]] = args[++i]
            }
        } else {
            namelessArgs.push(args[i])
        }
    }

    return { configs, namelessArgs }
}

module.exports = { parseArgs }