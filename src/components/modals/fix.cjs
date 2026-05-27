const fs = require('fs');

const lines = fs.readFileSync('src/App.tsx', 'utf-8').split('\n');

const handoverIdx = lines.findIndex(line => line.includes('{/* Handover Ticket Modal */}'));
const detailModalEndIdx = handoverIdx - 1;

let appModalIdx = lines.findIndex(line => line.includes('<ApplicationDetailModal'));
let closeTagIdx = -1;

for (let i = appModalIdx; i < lines.length; i++) {
   if (lines[i].includes('/>')) {
      closeTagIdx = i;
      break;
   }
}

console.log('close tag around:', closeTagIdx);
console.log('handoverIdx around:', handoverIdx);

if (closeTagIdx !== -1 && handoverIdx !== -1) {
   lines.splice(closeTagIdx + 1, handoverIdx - closeTagIdx - 1);
   fs.writeFileSync('src/App.tsx', lines.join('\n'));
   console.log('Fixed app.tsx');
}
