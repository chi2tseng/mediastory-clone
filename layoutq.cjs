const puppeteer = require('puppeteer-core')
const fs = require('fs')
const path = require('path')
const OUT = 'C:/Users/chi2t/AppData/Local/Temp/opencode/clone-shots/layout'
fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
;(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
    defaultViewport: { width: 1440, height: 950 },
  })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('http://localhost:5183/#/project/poj-demo-city/make', { waitUntil: 'networkidle0' })
  await sleep(700)
  await page.screenshot({ path: path.join(OUT, 'desktop-make.png') })
  const desktop = await page.evaluate(() => {
    const pageRoot = document.querySelector('.h-full.bg-white')
    const nav = document.querySelector('nav.fixed')
    return {
      scrollH: document.documentElement.scrollHeight,
      innerH: innerHeight,
      root: pageRoot?.getBoundingClientRect(),
      bottomNavVisible: !!nav && getComputedStyle(nav).display !== 'none',
    }
  })
  console.log('desktop', JSON.stringify(desktop))

  await page.setViewport({ width: 390, height: 844, isMobile: true })
  await page.goto('http://localhost:5183/#/project/poj-demo-city/make', { waitUntil: 'networkidle0' })
  await sleep(600)
  await page.screenshot({ path: path.join(OUT, 'mobile-make.png') })
  const mobile = await page.evaluate(() => {
    const nav = document.querySelector('nav.fixed')
    return {
      scrollW: document.documentElement.scrollWidth,
      innerW: innerWidth,
      navText: nav?.innerText,
      navRect: nav?.getBoundingClientRect(),
      tableScroll: (() => {
        const t = document.querySelector('table')
        const w = t?.parentElement?.parentElement
        return w ? { scrollW: w.scrollWidth, clientW: w.clientWidth } : null
      })(),
    }
  })
  console.log('mobile', JSON.stringify(mobile))
  const clicked = await page.evaluate(() => {
    const nav = document.querySelector('nav.fixed')
    const b = [...nav.querySelectorAll('button')].find((x) => x.textContent.trim() === '故事板')
    b?.click()
    return !!b
  })
  await sleep(700)
  console.log('clicked board', clicked, page.url())
  await page.screenshot({ path: path.join(OUT, 'mobile-board.png') })
  const boardNav = await page.evaluate(() => document.querySelector('nav.fixed')?.innerText)
  console.log('board nav', boardNav)
  await page.goto('http://localhost:5183/#/project/poj-demo-city/callsheet', { waitUntil: 'networkidle0' })
  await sleep(600)
  await page.screenshot({ path: path.join(OUT, 'mobile-callsheet.png') })
  await page.goto('http://localhost:5183/#/project/poj-demo-city/plans', { waitUntil: 'networkidle0' })
  await sleep(600)
  await page.screenshot({ path: path.join(OUT, 'mobile-plans.png') })
  await page.setViewport({ width: 1440, height: 950 })
  await page.goto('http://localhost:5183/#/project/poj-demo-city/board', { waitUntil: 'networkidle0' })
  await sleep(600)
  await page.screenshot({ path: path.join(OUT, 'desktop-board.png') })
  console.log('errors', errors)
  await browser.close()
})()
