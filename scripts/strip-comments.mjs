import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import strip from "strip-comments";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to directory you want to process
const directoryPath = path.join(__dirname, "../src"); // Adjusted path

// Function to process a file
function processFile(filePath) {
	const fileExt = path.extname(filePath);
	// Only process TypeScript/JavaScript files
	if ([".ts", ".tsx", ".js", ".jsx"].includes(fileExt)) {
		const content = fs.readFileSync(filePath, "utf8");
		const strippedContent = strip(content);
		fs.writeFileSync(filePath, strippedContent);
	}
}

// Function to walk through directory
function processDirectory(directory) {
	const files = fs.readdirSync(directory);

	for (const file of files) {
		const fullPath = path.join(directory, file);
		const stats = fs.statSync(fullPath);

		if (stats.isDirectory()) {
			processDirectory(fullPath);
		} else if (stats.isFile() && file.endsWith(".ts")) {
			processFile(fullPath);
		}
	}
}

// Start processing
processDirectory(directoryPath); 