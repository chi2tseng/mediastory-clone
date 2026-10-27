const puppeteer = require('puppeteer-core');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
    defaultViewport: { width: 1440, height: 1000 },
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:5183/#/project/poj-demo-city/export', { waitUntil: 'networkidle0' });
  await sleep(600);
  const report = async (tag) => {
    const info = await page.evaluate(() => ({
      pageRules: [...document.querySelectorAll('style')].flatMap((s) =>
        [...(s.textContent || '').matchAll(/@page[^}]*}/g)].map((m) => m[0]),
      ),
      mini: [...document.querySelectorAll('button')]
        .filter((b) => ['横', '竖'].includes(b.textContent.trim()))
        .map((b) => ({ text: b.textContent.trim(), visible: !!b.getClientRects().length })),
      sheet: [...document.querySelectorAll('.print-sheet')].map((e) => ({
        w: e.getBoundingClientRect().width,
        style: e.getAttribute('style'),
      })),
    }));
    console.log(tag, JSON.stringify(info));
  };
  await report('initial');
  const opened = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === '横');
    b?.click();
    return !!b;
  });
  await sleep(300);
  await report('after-open');
  const clicked = await page.evaluate(() => {
    const els = [...document.querySelectorAll('button')].filter(
      (x) => x.textContent.trim() === '竖' && x.getClientRects().length,
    );
    els[els.length - 1]?.click();
    return els.length;
  });
  await sleep(500);
  console.log('opened', opened, 'clickedCount', clicked);
  await report('after-select');
  await page.pdf({ path: 'C:/Users/chi2t/AppData/Local/Temp/opencode/clone-shots/print/orient-test.pdf', preferCSSPageSize: true, printBackground: true });
  await browser.close();
})();
