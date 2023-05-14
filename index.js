const functions = {
    'vscode': require('./vscode')
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

if (command in functions) {
    functions[command](remaining)
} else {
    console.log("No such subcommand")
}