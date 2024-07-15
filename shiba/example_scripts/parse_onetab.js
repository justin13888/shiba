const fs = require("node:fs");

if (process.argv.length !== 3) {
    console.error("Usage: node parse_onetab.js <input_file>");
    process.exit(1);
}

const inputFile = process.argv[2];
const outputData = [];

const readline = require("node:readline");
const rl = readline.createInterface({
    input: fs.createReadStream(inputFile),
    output: process.stdout,
    terminal: false,
});

rl.on("line", (line) => {
    // Skip empty lines
    if (line.trim() === "") {
        return;
    }

    // Find the index of the first "|" symbol
    const firstPipeIndex = line.indexOf("|");

    if (firstPipeIndex === -1) {
        console.error("Invalid line format (no | symbol):", line);
        process.exit(1);
    }

    // Split the line into URL and title
    const url = line.slice(0, firstPipeIndex).trim();
    const title = line.slice(firstPipeIndex + 1).trim();

    if (url.length === 0 || title.length === 0) {
        console.error("URL and title must not be empty:", line);
        process.exit(1);
    }

    outputData.push(url);
});

rl.on("close", () => {
    // Output the result as JSON
    console.log(JSON.stringify(outputData));
});
