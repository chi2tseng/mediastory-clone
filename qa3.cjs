const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const OUT = 'C:/Users/chi2t/AppData/Local/Temp/opencode/clone-shots/qa3';
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const DL = path.join(OUT, 'downloads');
fs.mkdirSync(DL, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const bodyText = (page) => page.evaluate(() => document.body.innerText);

async function setValue(page, selector, value, kind = 'input') {
  await page.evaluate(
    (selector, value, kind) => {
      const el = document.querySelector(selector);
      if (!el) return false;
      const proto = kind === 'textarea' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
      setter.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    },
    selector,
    value,
    kind,
  );
  await sleep(250);
}

async function clickText(page, text) {
  const ok = await page.evaluate((text) => {
    const els = [...document.querySelectorAll('button,a,label,span,div')].filter(
      (e) => e.textContent.trim() === text && e.getClientRects().length,
    );
    if (!els.length) return false;
    const el = els[els.length - 1];
    (el.closest('button') || el.closest('a') || el).click();
    return true;
  }, text);
  await sleep(400);
  return ok;
}

async function clickModalButton(page, text) {
  const ok = await page.evaluate((text) => {
    const overlays = [...document.querySelectorAll('.fixed.inset-0')];
    for (const overlay of overlays) {
      const b = [...overlay.querySelectorAll('button')].find(
        (x) => x.textContent.trim() === text && x.getClientRects().length,
      );
      if (b) {
        b.click();
        return true;
      }
    }
    return false;
  }, text);
  await sleep(450);
  return ok;
}

async function clickMenuItem(page, text) {
  const ok = await page.evaluate((text) => {
    const items = [...document.querySelectorAll('.pop-in button')].filter(
      (b) => b.textContent.trim() === text && b.getClientRects().length,
    );
    if (!items.length) return false;
    items[items.length - 1].click();
    return true;
  }, text);
  await sleep(400);
  return ok;
}

async function openCardMenu(page, name) {
  const ok = await page.evaluate((name) => {
    const card = [...document.querySelectorAll('div.group')].find(
      (g) => g.textContent.includes(name) && g.querySelector('.absolute.top-2.right-2 button'),
    );
    const btn = card?.querySelector('.absolute.top-2.right-2 button');
    if (!btn) return false;
    btn.click();
    return true;
  }, name);
  await sleep(350);
  return ok;
}

async function trashOpen(page) {
  const ok = await page.evaluate(() => {
    const b = document.querySelector('button[title="回收站"]');
    if (!b) return false;
    b.click();
    return true;
  });
  await sleep(450);
  return ok;
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--lang=zh-CN'],
    defaultViewport: { width: 1440, height: 950 },
  });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));
  const client = await page.createCDPSession();
  await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: DL });

  const log = [];
  const check = (label, ok) => log.push(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  const projectCount = async () =>
    Number((await bodyText(page)).match(/共\s*(\d+)\s*个项目/)?.[1] ?? -1);

  await page.goto('http://localhost:5183/#/projects', { waitUntil: 'networkidle0' });
  await sleep(700);
  check('start with 2 projects', (await projectCount()) === 2);

  // search
  await setValue(page, 'input[placeholder="搜索项目名…"]', '城市');
  await sleep(350);
  check('search filters to 1', (await projectCount()) === 1);
  const searchText = await bodyText(page);
  check('search hides other project', searchText.includes('城市之光') && !searchText.includes('未命名短片'));
  await page.screenshot({ path: path.join(OUT, '01-search.png') });
  await setValue(page, 'input[placeholder="搜索项目名…"]', '');
  check('clearing search restores 2', (await projectCount()) === 2);

  // rename
  check('open project menu', await openCardMenu(page, '城市之光'));
  await page.screenshot({ path: path.join(OUT, '02-project-menu.png') });
  check('click rename', await clickMenuItem(page, '重命名'));
  await page.screenshot({ path: path.join(OUT, '03-rename-modal.png') });
  await setValue(page, '.fixed.inset-0 input', '城市之光 · 改名');
  check('save rename', await clickModalButton(page, '保存'));
  check('renamed card shown', (await bodyText(page)).includes('城市之光 · 改名'));
  await openCardMenu(page, '城市之光');
  await clickMenuItem(page, '重命名');
  await setValue(page, '.fixed.inset-0 input', '城市之光 · 宣传片');
  await clickModalButton(page, '保存');
  check('rename back', (await bodyText(page)).includes('城市之光 · 宣传片'));

  // duplicate
  await openCardMenu(page, '城市之光');
  check('duplicate menu item', await clickMenuItem(page, '复制项目'));
  check('duplicate raises count to 3', (await projectCount()) === 3);
  check('duplicate named 副本', (await bodyText(page)).includes('城市之光 · 宣传片 副本'));
  await page.screenshot({ path: path.join(OUT, '04-duplicated.png') });

  // soft delete + confirm
  await openCardMenu(page, '城市之光 · 宣传片 副本');
  check('soft delete asks confirmation', await clickMenuItem(page, '移入回收站'));
  check('trash confirm copy', (await bodyText(page)).includes('项目会保留在回收站中'));
  await page.screenshot({ path: path.join(OUT, '05-trash-confirm.png') });
  await clickModalButton(page, '移入回收站');
  check('soft delete lowers count to 2', (await projectCount()) === 2);

  // trash restore
  check('open trash', await trashOpen(page));
  check('trashed project listed', (await bodyText(page)).includes('城市之光 · 宣传片 副本'));
  await page.screenshot({ path: path.join(OUT, '06-trash-drawer.png') });
  const restored = await page.evaluate(() => {
    const b = document.querySelector('button[title="恢复"]');
    if (!b) return false;
    b.click();
    return true;
  });
  await sleep(500);
  check('restore project', restored && (await projectCount()) === 3);
  check('trash now empty', (await bodyText(page)).includes('回收站是空的'));
  await clickText(page, '回收站');
  await sleep(300);

  // delete + purge
  await openCardMenu(page, '城市之光 · 宣传片 副本');
  await clickMenuItem(page, '移入回收站');
  await clickModalButton(page, '移入回收站');
  await trashOpen(page);
  const purgeOpen = await page.evaluate(() => {
    const b = document.querySelector('button[title="永久删除"]');
    if (!b) return false;
    b.click();
    return true;
  });
  await sleep(400);
  check('purge asks confirmation', purgeOpen && (await bodyText(page)).includes('永久删除项目'));
  await page.screenshot({ path: path.join(OUT, '07-purge-confirm.png') });
  await clickModalButton(page, '永久删除');
  check('purge lowers count to 2', (await projectCount()) === 2);
  check('trash empty after purge', (await bodyText(page)).includes('回收站是空的'));
  await page.keyboard.press('Escape');
  await sleep(300);

  // board slideshow
  await page.goto('http://localhost:5183/#/project/poj-demo-city/board', { waitUntil: 'networkidle0' });
  await sleep(700);
  await page.screenshot({ path: path.join(OUT, '08-board-placeholder.png') });
  check('open slideshow', await clickText(page, '放映模式'));
  const slide = await bodyText(page);
  check('slideshow shows 1 / 6', slide.includes('1 / 6'));
  await page.screenshot({ path: path.join(OUT, '09-slideshow-1.png') });
  await page.keyboard.press('ArrowRight');
  await sleep(350);
  check('slideshow advances to 2 / 6', (await bodyText(page)).includes('2 / 6'));
  await page.keyboard.press('Escape');
  await sleep(400);
  check('escape exits slideshow', !(await bodyText(page)).includes('2 / 6'));

  // display settings: remarks + zoom
  check('open display settings', await clickText(page, '显示设置'));
  const toggleRemark = await page.evaluate(() => {
    const span = [...document.querySelectorAll('span')].find(
      (s) => s.textContent.trim() === '显示备注' && s.getClientRects().length,
    );
    const btn = span?.parentElement?.querySelector('button');
    if (!btn) return false;
    btn.click();
    return true;
  });
  await sleep(300);
  const rangeSet = await page.evaluate(() => {
    const input = document.querySelector('input[type="range"]');
    if (!input) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, '0.8');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  });
  await sleep(300);
  await page.screenshot({ path: path.join(OUT, '10-display-settings.png') });
  await page.keyboard.press('Escape');
  await sleep(400);
  check('remark field appears', toggleRemark && (await bodyText(page)).includes('需要航拍许可'));
  check(
    'zoom applies to grid',
    rangeSet &&
      (await page.evaluate(() =>
        [...document.querySelectorAll('div')].some((d) => (d.getAttribute('style') || '').includes('scale(0.8)')),
      )),
  );

  // image upload on a fresh shot
  await clickText(page, '新建镜头');
  await sleep(500);
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')].filter((b) => b.textContent.includes('上传画面'));
    btns[btns.length - 1]?.scrollIntoView({ block: 'center' });
  });
  await sleep(350);
  await page.screenshot({ path: path.join(OUT, '11a-empty-shot.png') });
  const uploadBtn = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')].filter((b) => b.textContent.includes('上传画面'));
    const b = btns[btns.length - 1];
    if (!b) return false;
    b.click();
    return true;
  });
  await sleep(300);
  const input = await page.$('input[type="file"]');
  const testPng = path.join(OUT, 'test-upload.png');
  fs.writeFileSync(
    testPng,
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    ),
  );
  if (input) await input.uploadFile(testPng);
  await sleep(900);
  const uploaded = await page.evaluate(() => {
    const raw = localStorage.getItem('mediastory-clone-v1');
    const p = JSON.parse(raw || '{}').projects?.find((p) => p.id === 'poj-demo-city');
    const last = p?.shots?.[p.shots.length - 1];
    return { hasImage: !!last?.image && last.image.startsWith('data:image'), count: p?.shots?.length };
  });
  check('image upload writes data URL', uploadBtn && uploaded.hasImage);
  check('new shot appended', uploaded.count === 7);
  await page.screenshot({ path: path.join(OUT, '11-image-upload.png') });

  // CSV export
  await page.goto('http://localhost:5183/#/project/poj-demo-city/export', { waitUntil: 'networkidle0' });
  await sleep(700);
  await clickText(page, 'pdf 文件');
  await clickMenuItem(page, 'Excel / CSV');
  await sleep(300);
  await clickText(page, '导出');
  await sleep(1200);
  const files = fs.readdirSync(DL).filter((f) => f.endsWith('.csv'));
  let csv = '';
  if (files.length) csv = fs.readFileSync(path.join(DL, files[0]), 'utf8');
  check('CSV downloaded', files.length === 1);
  check('CSV has BOM + header', csv.startsWith('\ufeff镜号,画面') || csv.startsWith('\ufeff\"镜号\"'));
  check('CSV has shot content', csv.includes('城市夜景航拍'));
  check('CSV has 7 shots + header', csv.trim().split('\r\n').length === 8);
  await page.screenshot({ path: path.join(OUT, '12-csv-toast.png') });

  // create plan
  await page.goto('http://localhost:5183/#/project/poj-demo-city/plans', { waitUntil: 'networkidle0' });
  await sleep(600);
  check('open create plan', await clickText(page, '新建拍摄计划'));
  await setValue(page, '.fixed.inset-0 input', 'Day 3 · 补拍');
  check('save new plan', await clickModalButton(page, '创建'));
  check('new plan appears', (await bodyText(page)).includes('Day 3 · 补拍'));

  // create call sheet
  await page.goto('http://localhost:5183/#/project/poj-demo-city/callsheet', { waitUntil: 'networkidle0' });
  await sleep(600);
  check('open new call sheet', await clickText(page, '新建拍摄通告'));
  check('new sheet starts at step 1', (await bodyText(page)).includes('基本属性'));
  await page.evaluate(() => {
    const input = document.querySelector('.fixed.inset-0 input');
    if (!input) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, '夜戏补拍通告');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const loc = [...document.querySelectorAll('.fixed.inset-0 input')].find((i) =>
      (i.getAttribute('placeholder') || '').includes('集合地点'),
    );
    if (loc) {
      setter.call(loc, '滨江大道 18 号');
      loc.dispatchEvent(new Event('input', { bubbles: true }));
    }
    return true;
  });
  await sleep(300);
  check('go to crew step', await clickText(page, '下一步'));
  check('crew step shown', (await bodyText(page)).includes('人员信息'));
  check('go to schedule step', await clickText(page, '下一步'));
  check('schedule step shown', (await bodyText(page)).includes('计划与日程'));
  await page.screenshot({ path: path.join(OUT, '13-callsheet-new.png') });
  await clickModalButton(page, '保存通告');
  check('new call sheet saved', (await bodyText(page)).includes('夜戏补拍通告'));

  // contacts edit + delete
  await page.goto('http://localhost:5183/#/contacts', { waitUntil: 'networkidle0' });
  await sleep(600);
  const firstRowMenu = await page.evaluate(() => {
    const row = document.querySelector('tbody tr');
    const b = row?.querySelector('button');
    if (!b) return false;
    b.click();
    return true;
  });
  await sleep(300);
  check('contact row menu', firstRowMenu);
  await clickMenuItem(page, '编辑');
  const oldName = await page.$eval('.fixed.inset-0 input', (el) => el.value);
  await setValue(page, '.fixed.inset-0 input', oldName + '·改');
  check('save contact edit', await clickModalButton(page, '保存'));
  check('contact edit shown', (await bodyText(page)).includes(oldName + '·改'));
  await page.evaluate(() => {
    const row = document.querySelector('tbody tr');
    row?.querySelector('button')?.click();
  });
  await sleep(300);
  await clickMenuItem(page, '删除');
  check('delete contact asks confirmation', (await bodyText(page)).includes('删除联系人'));
  await page.screenshot({ path: path.join(OUT, '14-delete-contact.png') });
  await clickModalButton(page, '删除');
  check('contact deleted', !(await bodyText(page)).includes(oldName + '·改'));
  check('contacts count drops to 2', (await bodyText(page)).includes('2 人'));

  // persistence
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(700);
  check('plans persist', (await page.evaluate(() => localStorage.getItem('mediastory-clone-v1'))).includes('Day 3 · 补拍'));
  check('call sheet persists', (await page.evaluate(() => localStorage.getItem('mediastory-clone-v1'))).includes('夜戏补拍通告'));

  // responsive checks
  await page.setViewport({ width: 1024, height: 768 });
  await page.goto('http://localhost:5183/#/projects', { waitUntil: 'networkidle0' });
  await sleep(500);
  await page.screenshot({ path: path.join(OUT, '15-projects-1024.png') });
  await page.goto('http://localhost:5183/#/project/poj-demo-city/make', { waitUntil: 'networkidle0' });
  await sleep(500);
  await page.screenshot({ path: path.join(OUT, '16-make-1024.png') });
  await page.setViewport({ width: 390, height: 844, isMobile: true });
  await page.goto('http://localhost:5183/#/projects', { waitUntil: 'networkidle0' });
  await sleep(500);
  await page.screenshot({ path: path.join(OUT, '17-projects-mobile.png') });
  const mobileOverflow = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    iw: window.innerWidth,
  }));
  await page.goto('http://localhost:5183/#/project/poj-demo-city/make', { waitUntil: 'networkidle0' });
  await sleep(500);
  await page.screenshot({ path: path.join(OUT, '18-make-mobile.png') });

  console.log(log.join('\n'));
  console.log(`\n${log.filter((l) => l.startsWith('PASS')).length}/${log.length} checks passed`);
  console.log('\nmobile overflow:', mobileOverflow);
  console.log('JS errors:', errors.length ? errors.join('\n') : 'none');
  console.log('downloads:', fs.readdirSync(DL));
  await browser.close();
})().catch((e) => {
  console.error('QA3 SCRIPT ERROR', e);
  process.exit(1);
});
