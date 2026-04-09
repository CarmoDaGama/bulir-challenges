import fs from 'node:fs';
import path from 'node:path';

const targetDir = process.argv[2];

if (!targetDir) {
  console.error('Usage: node fix-next-traces.mjs <next-output-dir>');
  process.exit(1);
}

function shiftTracePath(filePath) {
  let updatedPath = filePath;
  let shifts = 0;

  while (shifts < 2 && updatedPath.startsWith('../')) {
    updatedPath = updatedPath.slice(3);
    shifts += 1;
  }

  return updatedPath;
}

function walk(directoryPath) {
  for (const entry of fs.readdirSync(directoryPath, { withFileTypes: true })) {
    const entryPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      walk(entryPath);
      continue;
    }

    if (!entry.name.endsWith('.nft.json')) {
      continue;
    }

    const traceData = JSON.parse(fs.readFileSync(entryPath, 'utf8'));

    if (!Array.isArray(traceData.files)) {
      continue;
    }

    traceData.files = traceData.files.map(shiftTracePath);
    fs.writeFileSync(entryPath, `${JSON.stringify(traceData)}\n`);
  }
}

walk(path.resolve(targetDir));