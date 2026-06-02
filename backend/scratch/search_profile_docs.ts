import fs from 'fs';
import path from 'path';

async function main() {
  const docPath = path.join(__dirname, '../../Digital Parent-School Communication.md');
  const content = fs.readFileSync(docPath, 'utf8');
  const lines = content.split('\n');

  console.log(`Searching for "profile" in: ${docPath}`);
  let matchCount = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes('profile')) {
      console.log(`Line ${i + 1}: ${lines[i].trim()}`);
      matchCount++;
    }
  }
  console.log(`\nFound ${matchCount} matches.`);
}

main();
