// Isolated headless Chrome sampling, not a physical display or GPU benchmark.
import {chromium} from '@playwright/test'
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-precise-memory-info']})
try{
 const context=await browser.newContext({viewport:{width:1280,height:720}})
 const page=await context.newPage()
 await page.goto('http://127.0.0.1:5174/')
 await page.getByRole('button',{name:'START MY FIRST EXPERIMENT'}).click()
 await page.locator('#count').fill('30')
 await page.locator('#site-layout').selectOption('2')
 await page.getByRole('button',{name:'Play',exact:true}).click()
 await page.getByRole('button',{name:'HIDE GUIDE'}).click()
 await page.waitForTimeout(1000)
 const result=await page.evaluate(()=>new Promise(resolve=>{
  const memory=()=>performance.memory?.usedJSHeapSize??null
  const before=memory(),intervals=[];let previous=performance.now(),start=previous
  function frame(now){intervals.push(now-previous);previous=now;if(now-start<5000){requestAnimationFrame(frame);return}intervals.shift();intervals.sort((a,b)=>a-b);resolve({frames:intervals.length,medianFrameMs:intervals[Math.floor(intervals.length*.5)],p95FrameMs:intervals[Math.floor(intervals.length*.95)],framesOver50ms:intervals.filter(x=>x>50).length,heapBeforeBytes:before,heapAfterBytes:memory(),viewport:{width:innerWidth,height:innerHeight},devicePixelRatio})}
  requestAnimationFrame(frame)
 }))
 console.log(JSON.stringify({browser:browser.version(),scenario:'30 particles, corner sites, default speed, headless',durationSeconds:5,...result}))
 await context.close()
}finally{await browser.close()}
