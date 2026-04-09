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

function resolveExistingTracePath(traceDir, filePath) {
  const asIs = path.resolve(traceDir, filePath);
  if (fs.existsSync(asIs)) {
    return filePath;
  }

  let candidate = filePath;

  for (let i = 0; i < 2; i += 1) {
    candidate = shiftTracePath(candidate);

    if (candidate === filePath) {
      break;
    }

    const candidatePath = path.resolve(traceDir, candidate);
    if (fs.existsSync(candidatePath)) {
      return candidate;
    }
  }

  return filePath;
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

    const traceDir = path.dirname(entryPath);
    traceData.files = traceData.files.map((filePath) =>
      resolveExistingTracePath(traceDir, filePath),
    );
    fs.writeFileSync(entryPath, `${JSON.stringify(traceData)}\n`);
  }
}

walk(path.resolve(targetDir));