const fs = require("node:fs");

function parseJSONFile(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, "utf8");
        return JSON.parse(fileContent);
    } catch (err) {
        console.error(`Error reading ${filePath}: ${err.message}`);
        process.exit(1);
    }
}

function compareURLLists(file1Data, file2Data) {
    const urlMap1 = {};
    const urlMap2 = {};

    for (const url of file1Data) {
        urlMap1[url] = true;
    }

    for (const url of file2Data) {
        urlMap2[url] = true;
    }

    const uniqueTo1 = Object.keys(urlMap1).filter((url) => !urlMap2[url]);
    const uniqueTo2 = Object.keys(urlMap2).filter((url) => !urlMap1[url]);

    return {
        uniqueTo1,
        uniqueTo2,
    };
}

if (process.argv.length !== 4) {
    console.error("Usage: node compare_two_url_lists.js file1.json file2.json");
    process.exit(1);
}

const file1Path = process.argv[2];
const file2Path = process.argv[3];

const file1Data = parseJSONFile(file1Path);
const file2Data = parseJSONFile(file2Path);

const { uniqueTo1, uniqueTo2 } = compareURLLists(file1Data, file2Data);

console.log("URLs unique to file1.json:", uniqueTo1);
console.log("URLs unique to file2.json:", uniqueTo2);
