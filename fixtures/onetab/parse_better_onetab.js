const fs = require("node:fs");

// Check if the user provided a file argument
if (process.argv.length !== 3) {
    console.error("Usage: node parse_better_onetab.js <file-path>");
    process.exit(1);
}

// Get the file path from the command line arguments
const filePath = process.argv[2];

// Read the file asynchronously
fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
        console.error(`Error reading the file: ${err}`);
        process.exit(1);
    }

    try {
        // Parse the JSON data from the file
        const jsonData = JSON.parse(data);

        // Check if the JSON data contains an array of objects with a "tabs" property
        if (
            Array.isArray(jsonData) &&
            jsonData.every((item) => item.tabs && Array.isArray(item.tabs))
        ) {
            // Initialize an array to store the converted URLs
            const convertedUrls = [];

            // Iterate through each object in the array
            for (const item of jsonData) {
                // Extract the URLs from the 'tabs' array of each object
                const urls = item.tabs.map((tab) => tab.url);

                // Add the extracted URLs to the convertedUrls array
                convertedUrls.push(...urls);
            }

            // Convert the URLs to JSON format
            const jsonOutput = JSON.stringify(convertedUrls);

            // Log the converted JSON data
            console.log(jsonOutput);
        } else {
            console.error(
                'Invalid JSON data format. Expected an array of objects with a "tabs" property.',
            );
        }
    } catch (error) {
        console.error("Error parsing JSON data:", error);
        process.exit(1);
    }
});
