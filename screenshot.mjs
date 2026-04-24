import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  headless: true
});

const pages = [
  { url: 'http://localhost:3000/', file: '/tmp/sable_dashboard.png' },
  { url: 'http://localhost:3000/templates', file: '/tmp/sable_templates.png' },
  { url: 'http://localhost:3000/documents', file: '/tmp/sable_documents.png' },
  { url: 'http://localhost:3000/fill', file: '/tmp/sable_fill.png' },
];

for (const { url, file } of pages) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: file });
  await page.close();
  console.log('captured', file);
}

await browser.close();
