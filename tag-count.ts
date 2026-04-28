import fs from 'fs';
const content = fs.readFileSync('src/App.tsx', 'utf-8');

function countTags(tagName) {
    const open = (content.match(new RegExp('<' + tagName + '[\\s/>]', 'g')) || []).length;
    const close = (content.match(new RegExp('</' + tagName + '>', 'g')) || []).length;
    return { open, close };
}

['main', 'div', 'section', 'AnimatePresence', 'motion.div'].forEach(tag => {
    const counts = countTags(tag);
    console.log(`${tag}: Open=${counts.open}, Close=${counts.close}, Diff=${counts.open - counts.close}`);
});
