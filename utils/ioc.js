
class IOC {
    constructor(data) {
        this.entries = {}

        for(const i of data.split("\n")) {
            if (i.startsWith("#")) {
                continue
            }

            const [key, value] = i.split("=", 2)
            this.entries[key] = value
        }
    }

    get(key) {
        return this.entries[key]
    }

    has(key) {
        return key in this.entries
    }
}

module.exports = IOC