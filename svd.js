const axios = require('axios')
const fs = require('fs')
const { parseArgs } = require('./utils/cli')

const SVD_INDEX = "https://raw.githubusercontent.com/posborne/cmsis-svd/master/data/STMicro/Contents.txt"
const SVD_SOURCE = "https://raw.githubusercontent.com/posborne/cmsis-svd/master/data/STMicro/"

const main = async (argsRaw) => {
    const args = parseArgs(argsRaw)

    if (args.option("l", "list")) {
        return console.log((await axios(args.get("s", "svd-index") ?? SVD_INDEX)).data)
    }

    const targetDevice = args.get("d", "device")
    if (!targetDevice) {
        return console.log("ERROR! No device specified! Please specify your device with '-d <device>'")
    }

    const output = args.get("o", "output")
    const print = !args.option("q", "quiet")

    if (print) {
        console.log("Fetching SVD index from posborne/cmsis-svd...")
    }
    const index = (await axios(args.get("s", "svd-index") ?? SVD_INDEX)).data.split("\n")
    for (const i of index) {
        const devices = i.split(",").map(it => it.trim())
        if (devices.some(it => it.startsWith(targetDevice))) {
            if (args.option("f", "find")) {
                return console.log(`${targetDevice} is supported!`)
            }

            if (print) {
                console.log(`Downloading ${devices[devices.length - 1]}...`);
            }
            
            if (args.option("p", "print")) {
                console.log((await axios(args.get("-u", "--svd-source") ?? SVD_SOURCE + devices[devices.length - 1])).data)
            } else {
                fs.writeFileSync(output ?? devices[devices.length - 1], (await axios(args.get("-u", "--svd-source") ?? SVD_SOURCE + devices[devices.length - 1])).data)
            }

            if (print) {
                console.log(`Download complete!`);
            }
            
            return
            
        }
    }
    console.log("No svd was found for device: " + targetDevice)

}

module.exports = main