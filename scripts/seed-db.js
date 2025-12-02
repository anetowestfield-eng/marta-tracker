// scripts/seed-db.js
const fs = require('fs');
const path = require('path');

console.log("🚀 STARTING ROUTE BUILDER...");

// 1. Find the file
const txtPath = path.join(process.cwd(), 'routes.txt');

if (!fs.existsSync(txtPath)) {
  console.error("❌ ERROR: I cannot find 'routes.txt'!");
  console.error("   Please drag 'routes.txt' into this folder:");
  console.error("   " + process.cwd());
  process.exit(1);
}

// 2. Read the file
console.log("📖 Reading routes.txt...");
const content = fs.readFileSync(txtPath, 'utf8');
const lines = content.split('\n');

const routeMap = {};
let count = 0;

// 3. Convert CSV lines to JSON
// We assume standard MARTA format: route_id,agency_id,route_short_name,route_long_name...
const headers = lines[0].split(',');
const idIndex = headers.indexOf('route_id');
const nameIndex = headers.indexOf('route_short_name');
const longNameIndex = headers.indexOf('route_long_name');

for (let i = 1; i < lines.length; i++) {
  // Simple split by comma (works for 99% of lines)
  const row = lines[i].split(',');
  
  if (row.length > 3) {
    // Remove quotes if they exist
    const id = row[idIndex]?.replace(/"/g, '').trim();
    const shortName = row[nameIndex]?.replace(/"/g, '').trim();
    const longName = row[longNameIndex]?.replace(/"/g, '').trim();

    if (id && shortName) {
      // Create the nice name: "110 - Peachtree St"
      routeMap[id] = `${shortName} - ${longName}`;
      count++;
    }
  }
}

// 4. Save the result
fs.writeFileSync('routes.json', JSON.stringify(routeMap, null, 2));

console.log(`✅ SUCCESS! I found ${count} routes.`);
console.log("📄 Saved to 'routes.json'");