const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const OUT = 'C:/Users/chi2t/AppData/Local/Temp/opencode/clone-shots/qa2';
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickText(page, text, nth = -1) {
  const ok = await page.evaluate(
    (text, nth) => {
      const all = [...document.querySelectorAll('button,a,label,div,span')];
      const els = all.filter((e) => e.textContent.trim() === text && e.getClientRects().length);
      if (!els.length) return false;
      const el = nth >= 0 ? els[Math.min(nth, els.length - 1)] : els[els.length - 1];
      const target = el.closest('button') || el.closest('a') || el;
      target.scrollIntoView({ block: 'center' });
      target.click();
      return true;
    },
    text,
    nth,
  );
  await sleep(420);
  return ok;
}

async function clickIn(page, predicateSource, ...args) {
  const ok = await page.evaluate(
    (src, args) => {
      const fn = new Function('el', 'args', `return (${src})(el, args)`);
      const el = [...document.querySelectorAll('button,a,label')].find(
        (e) => e.getClientRects().length && fn(e, args),
      );
      if (!el) return false;
      el.scrollIntoView({ block: 'center' });
      el.click();
      return true;
    },
    predicateSource,
    args,
  );
  await sleep(420);
  return ok;
}

async function shot(page, name) {
  if (process.env.NO_SHOT) return;
  try {
    await page.screenshot({ path: path.join(OUT, name + '.png') });
  } catch (e) {
    console.log('SHOT FAIL ' + name + ': ' + e.message);
  }
}

const bodyText = (page) => page.evaluate(() => document.body.innerText);

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--lang=zh-CN'],
    defaultViewport: { width: 1440, height: 900 },
    protocolTimeout: 120000,
  });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console: ' + m.text());
  });

  const log = [];
  const check = (label, ok) => log.push(`${ok ? 'PASS' : 'FAIL'}  ${label}`);

  await page.goto('http://localhost:5183/#/projects', { waitUntil: 'networkidle0' });
  await sleep(600);
  check('no login: lands on projects', (await bodyText(page)).includes('我的项目'));
  check(
    'seed user present',
    await page.evaluate(() => JSON.parse(localStorage.getItem('mediastory-clone-v1') || '{}').user?.name === '创作者'),
  );
  await shot(page, '01-projects');

  // open demo project
  await clickText(page, '城市之光 · 宣传片');
  await sleep(500);
  let text = await bodyText(page);
  check('opens make page', text.includes('制作分镜') && text.includes('镜头总数'));
  check('help dot present', text.includes('拖动左侧手柄'));
  await shot(page, '02-make');

  // add shot
  const before = Number(await page.evaluate(() => document.body.innerText.match(/镜头总数\s*(\d+)/)?.[1]));
  await clickText(page, '新建');
  const after = Number(await page.evaluate(() => document.body.innerText.match(/镜头总数\s*(\d+)/)?.[1]));
  check(`add shot (${before} -> ${after})`, after === before + 1);

  // edit content cell (last row, first textarea) via native setter
  const typed = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('tbody tr')];
    const el = rows[rows.length - 1]?.querySelector('textarea');
    if (!el) return -1;
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
    setter.call(el, '自动化测试：新镜头内容');
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return el.value;
  });
  await sleep(400);
  const contentValues = await page.evaluate(() => [...document.querySelectorAll('tbody textarea')].map((t) => t.value));
  check('edit content cell persists', typed === '自动化测试：新镜头内容' && contentValues.includes('自动化测试：新镜头内容'));
  check('duplicate edit not applied to other rows', contentValues.filter((v) => v === '自动化测试：新镜头内容').length === 1);

  // drag first row to third position (React state needs a tick between drag events)
  const orderBefore = await page.evaluate(() =>
    [...document.querySelectorAll('tbody tr')].map((r) => r.querySelector('textarea')?.value || ''),
  );
  const dragStart = await page.evaluate(() => {
    const handles = [...document.querySelectorAll('button[title*="拖拽排序"]')];
    if (!handles.length) return false;
    const dt = new DataTransfer();
    handles[0].dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
    return true;
  });
  await sleep(300);
  const dragDrop = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('tbody tr')];
    if (rows.length < 3) return false;
    const dt = new DataTransfer();
    rows[2].dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }));
    rows[2].dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
    return true;
  });
  await sleep(500);
  const orderAfter = await page.evaluate(() =>
    [...document.querySelectorAll('tbody tr')].map((r) => r.querySelector('textarea')?.value || ''),
  );
  check(
    'drag reorder moves first shot to row 3',
    dragStart && dragDrop && orderAfter[2] === orderBefore[0] && orderAfter[0] === orderBefore[1] && orderAfter[1] === orderBefore[2],
  );
  check('drag reorder keeps shot count', orderAfter.length === orderBefore.length);

  // shot size menu
  const menu = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('td button')].find((b) => b.textContent.trim() === '大远景');
    if (!btn) return false;
    btn.click();
    return true;
  });
  await sleep(300);
  check('shot-size menu opens', menu && (await bodyText(page)).includes('大特写'));
  await shot(page, '03-make-sizemenu');
  await page.keyboard.press('Escape');
  await sleep(250);

  // column drawer
  check('open column settings', await clickText(page, '列设置'));
  await sleep(350);
  const colText = await bodyText(page);
  check('column drawer lists columns', colText.includes('镜头焦段') && colText.includes('存储模板'));
  await shot(page, '04-columns');
  await page.keyboard.press('Escape');
  await sleep(350);
  check('escape closes column drawer', !(await bodyText(page)).includes('存储模板'));

  // settings modal
  check('open shot settings', await clickText(page, '分镜设置'));
  await sleep(300);
  check('settings has aspect ratios', (await bodyText(page)).includes('2.35:1'));
  await shot(page, '05-settings');
  await clickText(page, '完成');

  // batch mode select all / cancel
  check('enable batch mode', await clickText(page, '批量模式'));
  await sleep(250);
  await clickIn(page, `(el) => el.textContent.trim() === '选择'`);
  await sleep(250);
  check('select-all action available', (await bodyText(page)).includes('全选'));
  await clickText(page, '全选');
  await sleep(350);
  check('select all shows count', (await bodyText(page)).includes('已选 ' + after));
  await shot(page, '06-batch');
  await clickIn(page, `(el) => el.textContent.trim() === '选择'`);
  await clickText(page, '取消选择');
  await sleep(250);
  await clickText(page, '批量模式');
  await sleep(250);

  // board
  check('navigate board', await clickText(page, '故事板'));
  await sleep(400);
  text = await bodyText(page);
  check('board renders cards', text.includes('预览故事板') && text.includes('镜头 1'));
  await shot(page, '07-board');
  check('open board preview', await clickText(page, '预览故事板'));
  await sleep(350);
  await shot(page, '08-board-preview');
  await page.keyboard.press('Escape');
  await sleep(350);
  check('escape closes board preview only', !(await bodyText(page)).includes('故事板预览') && (await bodyText(page)).includes('预览故事板'));

  // plans
  check('navigate plans', await clickText(page, '拍摄计划'));
  await sleep(400);
  text = await bodyText(page);
  check('plans render', text.includes('制定拍摄计划') && text.includes('未规划镜头'));
  const unplannedBefore = Number(text.match(/未规划镜头\s*(\d+)/)?.[1] || 0);
  await shot(page, '09-plans');
  // select first unplanned card checkbox and add to first plan
  const selected = await page.evaluate(() => {
    const box = [...document.querySelectorAll('button')].find((b) => b.className.includes('h-[16px]') && b.className.includes('rounded'));
    if (!box) return false;
    box.click();
    return true;
  });
  await sleep(300);
  check('select unplanned shot', selected && (await bodyText(page)).includes('加入计划'));
  await clickIn(page, `(el) => el.textContent.includes('加入计划')`);
  await sleep(300);
  const planMenu = await page.evaluate(() => {
    const items = [...document.querySelectorAll('button')].filter((x) => x.textContent.trim().startsWith('Day '));
    if (!items.length) return 'no day items';
    items[0].click();
    return items[0].textContent.trim();
  });
  await sleep(500);
  text = await bodyText(page);
  const unplannedAfter = Number(text.match(/未规划镜头\s*(\d+)/)?.[1] || 0);
  check(`assign shot to plan (${unplannedBefore} -> ${unplannedAfter})`, planMenu !== 'no day items' && unplannedAfter === Math.max(0, unplannedBefore - 1));
  await shot(page, '10-plans-assigned');

  // call sheets
  check('navigate callsheet', await clickText(page, '拍摄通告'));
  await sleep(400);
  check('callsheets list', (await bodyText(page)).includes('发布拍摄通告'));
  await shot(page, '11-callsheet');
  check('open callsheet editor', await clickText(page, '编辑'));
  await sleep(400);
  check('existing sheet opens on crew step', (await bodyText(page)).includes('人员信息'));
  await shot(page, '12-callsheet-editor');
  check('go back to step 1', await clickText(page, '上一步'));
  await sleep(300);
  check('step 1 basic fields', (await bodyText(page)).includes('基本属性'));
  await shot(page, '13-callsheet-step1');
  await clickText(page, '下一步');
  await sleep(300);
  check('step 2 crew', (await bodyText(page)).includes('人员信息'));
  await clickText(page, '下一步');
  await sleep(300);
  check('step 3 schedule', (await bodyText(page)).includes('计划与日程'));
  await shot(page, '14-callsheet-step3');
  await clickText(page, '预览通告');
  await sleep(400);
  check('callsheet preview opens', (await bodyText(page)).includes('镜头数 / 时长'));
  await shot(page, '15-callsheet-preview');
  await page.keyboard.press('Escape');
  await sleep(350);
  const afterEsc = await bodyText(page);
  check('escape closes preview but keeps editor', !afterEsc.includes('镜头数 / 时长') && afterEsc.includes('保存通告'));
  await page.keyboard.press('Escape');
  await sleep(350);
  check('second escape closes editor', !(await bodyText(page)).includes('保存通告'));

  // collab
  await clickText(page, '协作');
  await sleep(400);
  text = await bodyText(page);
  check('collab page', text.includes('分享链接') && text.includes('成员'));
  check('no duplicated owner badge', !text.includes('我 我'));
  await shot(page, '16-collab');

  // export
  await clickText(page, '导出');
  await sleep(500);
  text = await bodyText(page);
  check('export page', text.includes('导出预览') && text.includes('内容选择'));
  await shot(page, '17-export');
  check('export storyboard option', await clickIn(page, `(el) => el.tagName === 'LABEL' && el.textContent.trim() === '故事板'`));
  await sleep(400);
  check('storyboard preview grid', (await bodyText(page)).includes('1 大远景') || (await page.$eval('body', () => document.querySelectorAll('img').length)) >= 0);
  await shot(page, '18-export-board');
  await page.emulateMediaType('print');
  await page.pdf({ path: path.join(OUT, 'preview.pdf'), format: 'A4', landscape: true, printBackground: true });
  await page.emulateMediaType('screen');

  // create professional project
  await page.goto('http://localhost:5183/#/projects', { waitUntil: 'networkidle0' });
  await sleep(500);
  await clickText(page, '创建新项目 / 组');
  await sleep(400);
  check('create modal', (await bodyText(page)).includes('创建项目'));
  await shot(page, '19-create-modal');
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('input')].find((i) => i.placeholder.includes('必填'));
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(el, '新项目 · 自动化');
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await sleep(200);
  await clickIn(page, `(el) => el.textContent.includes('专业 · 14 个制作字段')`);
  await sleep(200);
  await clickText(page, '创建');
  await sleep(700);
  check('project created & opened', (await bodyText(page)).includes('镜头为空'));
  check('empty hint corrected', (await bodyText(page)).includes('右上角'));
  await shot(page, '20-empty-project');

  // add 3 shots, batch select all + delete
  await clickText(page, '新建');
  await clickText(page, '新建');
  await clickText(page, '新建');
  await sleep(400);
  check('added 3 shots', Number(await page.evaluate(() => document.body.innerText.match(/镜头总数\s*(\d+)/)?.[1])) === 3);
  await clickText(page, '批量模式');
  await sleep(300);
  await clickIn(page, `(el) => el.textContent.trim() === '选择'`);
  await clickText(page, '全选');
  await sleep(300);
  check('batch select 3', (await bodyText(page)).includes('已选 3'));
  // click the delete action in the floating batch bar
  const batchDelete = await page.evaluate(() => {
    const bar = document.querySelector('.pointer-events-auto');
    const b = bar && [...bar.querySelectorAll('button')].find((x) => x.textContent.trim() === '删除');
    if (!b) return false;
    b.click();
    return true;
  });
  await sleep(400);
  const confirmText = await bodyText(page);
  check('delete confirm modal', batchDelete && confirmText.includes('确认删除 3 个镜头'));
  await shot(page, '21-batch-confirm');
  const confirmed = await page.evaluate(() => {
    const overlay = document.querySelector('.fixed.inset-0');
    const b = overlay && [...overlay.querySelectorAll('button')].find((x) => x.textContent.trim() === '删除');
    if (!b) return false;
    b.click();
    return true;
  });
  await sleep(600);
  check('batch delete empties table', confirmed && (await bodyText(page)).includes('镜头为空'));
  await shot(page, '22-batch-delete');

  // templates
  await page.goto('http://localhost:5183/#/templates', { waitUntil: 'networkidle0' });
  await sleep(500);
  check('templates page', (await bodyText(page)).includes('模板库'));
  await clickIn(page, `(el) => el.tagName === 'BUTTON' && el.textContent.includes('专业分镜')`);    await sleep(400);
  check('template modal', (await bodyText(page)).includes('使用「专业分镜」'));
  await shot(page, '22-template-modal');
  await clickText(page, '创建项目');
  await sleep(700);
  text = await bodyText(page);
  check('template project created with 3 shots', text.includes('镜头总数') && text.includes('3'));
  await shot(page, '23-template-project');

  // contacts
  await page.goto('http://localhost:5183/#/contacts', { waitUntil: 'networkidle0' });
  await sleep(400);
  check('contacts page', (await bodyText(page)).includes('新建联系人'));
  await clickText(page, '新建联系人');
  await sleep(350);
  await page.evaluate(() => {
    const modal = document.querySelector('.fixed.inset-0');
    const el = modal?.querySelector('input');
    if (!el) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(el, '测试联系人');
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  });
  await sleep(200);
  await shot(page, '24-contact-modal');
  await clickText(page, '保存');
  await sleep(500);
  check('contact saved', (await bodyText(page)).includes('测试联系人'));
  await shot(page, '25-contacts');

  // persistence
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(600);
  check('contacts persist after reload', (await bodyText(page)).includes('测试联系人'));
  check('projects persist after reload', (await page.evaluate(() => JSON.parse(localStorage.getItem('mediastory-clone-v1') || '{}').projects?.length)) >= 4);
  await shot(page, '26-reload-contacts');

  console.log(log.join('\n'));
  console.log(`\n${log.filter((l) => l.startsWith('PASS')).length}/${log.length} checks passed`);
  console.log('JS errors:', errors.length ? errors.join('\n') : 'none');
  const pdfPath = path.join(OUT, 'preview.pdf');
  console.log('PDF bytes:', fs.existsSync(pdfPath) ? fs.statSync(pdfPath).size : 'missing');
  await browser.close();
})().catch((e) => {
  console.error('QA SCRIPT ERROR', e);
  process.exit(1);
});
