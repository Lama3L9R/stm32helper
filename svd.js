const axios = require('axios')
const fs = require('fs')
const { parseArgs } = require('./cli')

const SVD_INDEX = "https://raw.githubusercontent.com/posborne/cmsis-svd/master/data/STMicro/Contents.txt"
const SVD_SOURCE = "https://raw.githubusercontent.com/posborne/cmsis-svd/master/data/STMicro/"

const main = async (argsRaw) => {
    const args = parseArgs(argsRaw)
    const targetDevice = args.get("d", "--device")
    if (!targetDevice) {
        return console.log("ERROR! No device specified! Please specify your device with '-d <device>'")
    }

    const output = args.get("o", "--output")

    console.log("Fetching index from posborne/cmsis-svd...")

    const index = (await axios(args.get("-s", "--svd-index") ?? SVD_INDEX)).data.split("\n")
    for (const i of index) {
        const devices = i.split(",").map(it => it.trim())
        if (devices.some(it => it.startsWith(targetDevice))) {
            console.log(`Downloading ${devices[devices.length - 1]}...`);
            fs.writeFileSync(output ?? devices[devices.length - 1], (await axios(args.get("-u", "--svd-source") ?? SVD_SOURCE + devices[devices.length - 1])).data)
            return console.log(`Download Complete!`)
            
        }
    }
    console.log("No svd was found for device: " + targetDevice)

}

module.exports = main