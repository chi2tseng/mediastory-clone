const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const OUT = 'C:/Users/chi2t/AppData/Local/Temp/opencode/clone-shots/print';
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
    defaultViewport: { width: 1440, height: 1000 },
  });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  const clickText = async (t) => {
    const ok = await page.evaluate((t) => {
      const els = [...document.querySelectorAll('button,a,label,span')].filter(
        (e) => e.textContent.trim() === t && e.getClientRects().length,
      );
      if (!els.length) return false;
      (els[els.length - 1].closest('button') || els[els.length - 1]).click();
      return true;
    }, t);
    await sleep(400);
    return ok;
  };

  await page.goto('http://localhost:5183/#/project/poj-demo-city/export', { waitUntil: 'networkidle0' });
  await sleep(700);
  await page.screenshot({ path: path.join(OUT, 'export-screen.png') });

  // storyboard landscape
  await page.evaluate(() => {
    const label = [...document.querySelectorAll('label')].find((l) => l.textContent.trim() === '故事板');
    label?.click();
  });
  await sleep(500);
  await page.pdf({ path: path.join(OUT, 'export-board-landscape.pdf'), preferCSSPageSize: true, printBackground: true });
  await page.screenshot({ path: path.join(OUT, 'export-board-preview.png') });

  // switch to portrait using the orientation dropdown (first select-like button labeled 横)
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')].filter((b) => b.textContent.trim() === '横');
    btns[0]?.click();
  });
  await sleep(300);
  await clickText('竖');
  await sleep(500);
  await page.pdf({ path: path.join(OUT, 'export-board-portrait.pdf'), preferCSSPageSize: true, printBackground: true });

  // shot table landscape
  await page.evaluate(() => {
    const label = [...document.querySelectorAll('label')].find((l) => l.textContent.trim() === '分镜');
    label?.click();
  });
  await sleep(400);
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')].filter((b) => b.textContent.trim() === '竖');
    btns[0]?.click();
  });
  await sleep(300);
  await clickText('横');
  await sleep(400);
  await page.pdf({ path: path.join(OUT, 'export-shots-landscape.pdf'), preferCSSPageSize: true, printBackground: true });

  // call sheet print portal
  await page.goto('http://localhost:5183/#/project/poj-demo-city/callsheet', { waitUntil: 'networkidle0' });
  await sleep(600);
  await clickText('编辑');
  await sleep(400);
  await clickText('上一步');
  await clickText('下一步');
  await clickText('下一步');
  await clickText('预览通告');
  await sleep(500);
  await page.evaluate(() => {
    window.print = () => {};
  });
  await clickText('打印 / 另存为 PDF');
  await sleep(500);
  const portalInfo = await page.evaluate(() => ({
    mode: document.body.classList.contains('print-doc-mode'),
    portal: !!document.querySelector('.print-portal'),
    portalText: document.querySelector('.print-portal')?.innerText.slice(0, 80),
  }));
  await page.emulateMediaType('print');
  await page.screenshot({ path: path.join(OUT, 'callsheet-print-media.png'), fullPage: true });
  await page.pdf({ path: path.join(OUT, 'callsheet.pdf'), preferCSSPageSize: true, printBackground: true });
  await page.emulateMediaType('screen');

  console.log('portal:', portalInfo);
  console.log('errors:', errors.length ? errors : 'none');
  console.log(fs.readdirSync(OUT).join('\n'));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
