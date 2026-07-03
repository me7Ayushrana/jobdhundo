const fs = require("fs");
const path = require("path");

// Resolve paths
const mockPath = path.join(__dirname, "../src/lib/jobs/mock-data.ts");
const dbPath = path.join(__dirname, "../src/lib/jobs/synced_database.json");

console.log("Seeding initial database...");

try {
  // Let's run a simple mock import since mock-data has JSON objects, 
  // or we can read the file, extract the array block, parse it, and write it!
  const content = fs.readFileSync(mockPath, "utf-8");
  
  // Extract content between [ and ];
  const startIndex = content.indexOf("[");
  const endIndex = content.lastIndexOf("]");
  
  if (startIndex === -1 || endIndex === -1) {
    throw new Error("Could not find array delimiters in mock-data.ts");
  }
  
  let arrayStr = content.substring(startIndex, endIndex + 1);
  
  // To make it JSON-parseable:
  // 1. Remove comments like // --- ... ---
  arrayStr = arrayStr.replace(/\/\/.*$/gm, "");
  // 2. Change object keys (id:, title:, company:) to double-quoted keys ("id":, "title":, etc.)
  arrayStr = arrayStr.replace(/([a-zA-Z0-9_]+):/g, '"$1":');
  // 3. Remove trailing commas before closing braces/brackets
  arrayStr = arrayStr.replace(/,\s*([\]}])/g, "$1");
  // 4. Replace single quotes around strings with double quotes (handling escaped quotes)
  // Since we wrote them in standard TS, double quotes are already in use or we can evaluate it safely using Function constructor!
  
  // A safe way to compile TS/JS code inside Node is using a simple Function evaluation or require!
  // Let's register a compiler wrapper or write it using dynamic evaluation since it's a simple export array:
  const wrapper = `
    const HIGH_FIDELITY_FALLBACK_JOBS = ${content.substring(startIndex, endIndex + 1)};
    module.exports = HIGH_FIDELITY_FALLBACK_JOBS;
  `;
  
  const tempFile = path.join(__dirname, "temp_eval.js");
  fs.writeFileSync(tempFile, wrapper, "utf-8");
  const jobs = require(tempFile);
  
  fs.writeFileSync(dbPath, JSON.stringify(jobs, null, 2), "utf-8");
  fs.unlinkSync(tempFile);
  
  console.log(`Successfully seeded ${jobs.length} initial jobs to ${dbPath}`);
} catch (err) {
  console.error("Seeding failed:", err);
}
