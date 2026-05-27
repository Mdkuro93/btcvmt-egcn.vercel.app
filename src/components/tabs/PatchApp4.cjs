const fs = require('fs');

const lines = fs.readFileSync('src/App.tsx', 'utf-8').split('\n');
const start = lines.findIndex(l => l.includes('<ResourcesTab'));
const end = lines.findIndex((l, i) => i > start && l.includes('</AnimatePresence>'));

if (start !== -1 && end !== -1) {
  // We need to keep <ResourcesTab /> and remove everything down to just before </AnimatePresence>
  // Wait, the correct lines to remove are from start + 8 to end - 1
  lines.splice(start + 8, end - (start + 8));
  fs.writeFileSync('src/App.tsx', lines.join('\n'));
  console.log('App.tsx patched properly');
} else {
  console.log('Not found');
}
