function parseArgs(args) {
    const configs = {}
    const namelessArgs = []
    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith("--") || args[i].startsWith("-")) {
            const value = args[i + 1]
            if (!value || value.startsWith("--") || value.startsWith("-")) {
                configs[args[i].replace(/-/g, "")] = true
            } else {
                configs[args[i].replace(/-/g, "")] = args[++i]
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
    } }
}

module.exports = { parseArgs }