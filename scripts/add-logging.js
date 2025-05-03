/**
 * Helper script to add logging to components
 * 
 * This script can be used to quickly add a logger to existing TypeScript files.
 * It inserts the logger import and declaration at the top of the file and
 * optionally adds logger method calls at key points.
 * 
 * Usage: node scripts/add-logging.js <file-path> [--insert-logs]
 * 
 * Examples:
 *   node scripts/add-logging.js src/components/card/Card.ts
 *   node scripts/add-logging.js src/core/state/index.ts --insert-logs
 */

const fs = require('fs');
const path = require('path');

// Get file path from command line arguments
const filePath = process.argv[2];
const insertLogs = process.argv.includes('--insert-logs');

if (!filePath) {
  console.error('Please provide a file path');
  console.log('Usage: node scripts/add-logging.js <file-path> [--insert-logs]');
  process.exit(1);
}

// Ensure the file exists
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

// Extract the component name from the file path
// e.g., src/components/card/Card.ts -> Card
let componentName = path.basename(filePath, path.extname(filePath));

// Special case for index files - use directory name instead
if (componentName.toLowerCase() === 'index') {
  const dirName = path.basename(path.dirname(filePath));
  componentName = dirName.charAt(0).toUpperCase() + dirName.slice(1);
}

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Check if logger is already imported
if (content.includes('import { createLogger }')) {
  console.log('Logger already imported in this file');
  process.exit(0);
}

// Add logger import and declaration
const loggerImport = `import { createLogger } from "../../utils/Logger.js";`;
const loggerDeclaration = `// Create a logger for this component\nconst logger = createLogger("${componentName}");`;

// Find the position after imports
const importRegex = /^import .+ from .+;$/gm;
let lastImportIndex = 0;
let match;

while ((match = importRegex.exec(content)) !== null) {
  lastImportIndex = match.index + match[0].length;
}

// Insert logger import and declaration
const beforeImport = content.substring(0, lastImportIndex);
const afterImport = content.substring(lastImportIndex);

content = beforeImport + 
  '\n' + loggerImport + 
  '\n\n' + loggerDeclaration + 
  '\n' + afterImport;

// Optionally insert log statements in key places
if (insertLogs) {
  // Find exported functions
  const functionRegex = /export function (\w+)/g;
  let functions = [];
  while ((match = functionRegex.exec(content)) !== null) {
    functions.push({
      name: match[1],
      index: match.index + match[0].length
    });
  }

  // Insert logging in each function
  let offset = 0;
  functions.forEach(func => {
    // Find the opening brace
    const funcStart = content.indexOf('{', func.index + offset) + 1;
    
    // Create log message
    const logMessage = `\n  logger.debug(\`${func.name} called\`);`;
    
    // Insert log at the beginning of the function
    content = 
      content.substring(0, funcStart + offset) + 
      logMessage + 
      content.substring(funcStart + offset);
    
    // Update offset for subsequent insertions
    offset += logMessage.length;
  });
}

// Write updated content back to file
fs.writeFileSync(filePath, content);

console.log(`Logger added to ${filePath}`);
if (insertLogs) {
  console.log(`Inserted log statements in ${filePath}`);
}