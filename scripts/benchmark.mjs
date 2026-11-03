// Bounded engine-only measurement. Does not measure Canvas, browser frames or startup.
import {performance} from 'node:perf_hooks'
import {createState,defaults,step} from '../src/simulation/engine.ts'

const repetitions=3,steps=4000
const warmup=createState()
for(let i=0;i<1000;i++)step(warmup)
for(const count of [6,12,30])for(const siteMode of [0,2]){
 const runs=[]
 for(let run=0;run<repetitions;run++){
  const state=createState({...defaults,count,siteMode})
  const start=performance.now()
  for(let i=0;i<steps;i++)step(state)
  runs.push(performance.now()-start)
 }
 runs.sort((a,b)=>a-b)
 const median=runs[1]
 console.log(JSON.stringify({count,siteMode,steps,repetitions,medianMilliseconds:+median.toFixed(2),stepsPerSecond:Math.round(steps/(median/1000)),simulatedTimePerSecond:+((steps*.025)/(median/1000)).toFixed(1)}))
}
