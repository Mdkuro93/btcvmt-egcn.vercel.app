const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const logs = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      logs.push(msg.text());
      console.log('BROWSER ERROR:', msg.text());
    }
  });
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(3000);
  
  if (logs.length === 0) {
      console.log('No browser errors captured!');
  }
  await browser.close();
})();