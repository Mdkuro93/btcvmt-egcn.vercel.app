const fs = require('fs');

const lines = fs.readFileSync('src/App.tsx', 'utf-8').split('\n');
const start = lines.findIndex(l => l.includes('{activeTab === \'resources\' && ('));
const end = lines.findIndex((l, i) => i > start && l.includes('</motion.div>')); // Wait, there is a nested motion.div.

const exactEnd = lines.findIndex((l, i) => i > start + 5 && l.includes('            )}'));

if (start !== -1 && exactEnd !== -1) {
  const content = `      <ResourcesTab
        activeTab={activeTab}
        theme={theme}
        userRole={userRole}
        handleDownloadTemplate={handleDownloadTemplate}
        DOC_CHECKLIST_ITEMS={DOC_CHECKLIST_ITEMS}
      />`;

  lines.splice(start, exactEnd - start + 1, content);
  fs.writeFileSync('src/App.tsx', lines.join('\n'));
  console.log('App.tsx patched 3');
} else {
  console.log('Not found');
}
