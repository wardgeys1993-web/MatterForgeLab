import {chromium} from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'

// Uses the existing QA launch entry and an isolated browser profile.
const out=path.resolve('.Codex/visuals-20261103')
fs.mkdirSync(out,{recursive:true})
const browser=await chromium.launch({channel:'chrome',headless:true})
const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1})
const page=await context.newPage()
const errors=[]
page.on('pageerror',e=>errors.push(String(e)))
page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)})
const routes=[['Discovery','discovery'],['Simulation lab','lab'],['Research lab','research'],['Learning library','library'],['Manufacturing ladder','ladder']]
const report={date:'2026-11-03',browser:browser.version(),deviceScaleFactor:1,zoom:'100%',screens:[],layout:[],checks:[],errors}
const go=async(name)=>{await page.getByRole('button',{name,exact:true}).click();await page.waitForTimeout(600)}
try {
 await page.goto('http://127.0.0.1:5174');await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1200)
 for(const width of [1440,390]) {
  await page.setViewportSize({width,height:width===1440?1000:844})
  for(const [name,id]of routes){
   await go(name);if(id==='discovery')await page.waitForTimeout(600)
   const image=`${id}-${width}.png`;await page.screenshot({path:path.join(out,image),fullPage:id==='discovery'})
   report.screens.push({image,route:name,viewport:{width,height:width===1440?1000:844}})
   const fits=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)
   report.layout.push({route:id,width,fits});assert(fits,`${name} overflows at ${width}`)
   if(id==='lab')await page.locator('.viewport-panel').screenshot({path:path.join(out,`chamber-${width}.png`)})
  }
 }
 for(const width of [320,760,761,900,1024,1280]) {
  await page.setViewportSize({width,height:900})
  for(const [name,id]of routes){await go(name);const fits=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);report.layout.push({route:id,width,fits});assert(fits,`${name} overflows at ${width}`)}
 }
 report.checks.push('Five pages fit eight sampled widths from 320 to 1440 CSS pixels.')
 await page.setViewportSize({width:1280,height:900});await go('Discovery')
 await page.getByRole('button',{name:'START MY FIRST EXPERIMENT'}).click();await page.waitForTimeout(700)
 await page.getByRole('button',{name:'Pause',exact:true}).click();await page.waitForTimeout(180)
 await page.getByRole('button',{name:'SAVE AS A'}).click()
 const saved=await page.evaluate(()=>localStorage.getItem('matterforge-saved'))
 const time=await page.locator('.time').innerText()
 await go('Learning library');await go('Simulation lab')
 assert.equal(await page.locator('.time').innerText(),time)
 assert.equal(await page.evaluate(()=>localStorage.getItem('matterforge-saved')),saved)
 report.checks.push('Page transitions preserve the paused chamber and saved experiment A.')
 await page.getByRole('button',{name:'GLOSSARY',exact:true}).click();await page.getByLabel('Search glossary').fill('assembly');await page.screenshot({path:path.join(out,'glossary-1280.png')});await page.keyboard.press('Escape')
 assert.equal(await page.getByRole('dialog').count(),0)
 report.checks.push('Glossary opens, filters and closes with Escape.')
 await go('Discovery');await page.getByRole('button',{name:'Cinematic motion',exact:true}).click()
 assert.equal(await page.locator('html').getAttribute('data-motion'),'reduced')
 assert.equal(await page.locator('.assembly-artwork picture').evaluate(e=>getComputedStyle(e).animationName),'none')
 await page.reload();assert.equal(await page.getByRole('button',{name:'Cinematic motion',exact:true}).getAttribute('aria-pressed'),'false')
 report.checks.push('Motion off stops decorative animation and persists across reload.')
 await page.getByRole('button',{name:'Cinematic motion',exact:true}).click()
 await page.emulateMedia({reducedMotion:'reduce'})
 assert(await page.getByRole('button',{name:'Cinematic motion disabled by system preference'}).isDisabled())
 assert.equal(await page.locator('html').getAttribute('data-motion'),'reduced')
 await go('Simulation lab');assert.equal(await page.evaluate(()=>window.scrollY),0)
 await page.emulateMedia({reducedMotion:'no-preference'})
 report.checks.push('Live system reduced-motion changes disable animation and keep navigation usable.')
 await go('Discovery')
 await page.evaluate(()=>{
  window.__visualFrames=[];window.__visualSample=true;let prev=performance.now()
  const sample=now=>{window.__visualFrames.push(now-prev);prev=now;if(window.__visualSample)requestAnimationFrame(sample)};requestAnimationFrame(sample)
 })
 for(const name of ['Simulation lab','Learning library','Manufacturing ladder','Discovery'])await go(name)
 const deltas=await page.evaluate(()=>{window.__visualSample=false;return window.__visualFrames.slice(1)})
 const ordered=[...deltas].sort((a,b)=>a-b)
 report.frameSample={scope:'Warm navigation across four pages in headless Chrome on this Windows machine, no screenshot capture during sample',frames:deltas.length,medianMs:ordered[Math.floor(ordered.length*.5)],p95Ms:ordered[Math.floor(ordered.length*.95)],maxMs:Math.max(...deltas),over33ms:deltas.filter(x=>x>33.4).length}
 const reduced=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'})
 const rp=await reduced.newPage();await rp.goto('http://127.0.0.1:5174');assert.equal(await rp.locator('html').getAttribute('data-motion'),'reduced')
 const asset=await rp.locator('.assembly-artwork img').evaluate(e=>({src:e.currentSrc,complete:e.complete,width:e.naturalWidth}))
 assert(asset.complete&&asset.width>0);report.mobileAsset=asset
 await reduced.close()
 assert.equal(errors.length,0,errors.join('\n'))
 report.checks.push('No page errors or failed local resource responses in the inspected flows.')
 fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2),'utf8')
 console.log(JSON.stringify(report,null,2))
} finally {await browser.close()}
