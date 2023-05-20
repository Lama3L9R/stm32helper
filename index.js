require("./split")

const functions = {
    'vscode': require('./vscode'),
    'svd': require('./svd')
}

const command = process.argv[2]
const remaining = process.argv.slice(3)

if (!command) {
    console.log("avaible subcommands: ")
    for (const i in functions) {
        console.log(`${i}`)
    }
    process.exit(0)
}

if (!(command in functions)) {
    console.log("No such subcommand")
    process.exit(1)
}

(async()=>await functions[command](remaining))()