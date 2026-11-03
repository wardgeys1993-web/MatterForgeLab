import {describe,expect,it} from 'vitest'
import {advanceBatch,createBatch,summarize,type BatchConfig,type RunResult} from './batch'
import {defaults} from './engine'

const config:BatchConfig={current:{...defaults},saved:{...defaults},baseSeed:40,count:3,duration:4}
function finish(c:BatchConfig,budget:number){const job=createBatch(c);while(!advanceBatch(job,budget)){}return job}
describe('multi-seed experiments',()=>{
 it('uses fresh paired seeds and reproduces results independently of chunk size',()=>{const a=finish(config,37),b=finish(config,500);expect(a.results).toEqual(b.results);expect(a.completedSteps).toBe(a.totalSteps);expect(a.results.map(r=>r.seed)).toEqual([40,41,42,40,41,42]);expect(a.results.slice(0,3).map(r=>({...r,label:'Current'}))).toEqual(a.results.slice(3))})
 it('calculates success counts and a median only among observed successes',()=>{const results:RunResult[]=[{label:'A',seed:1,firstSuccess:null,stableAtEnd:false,finalBonds:2,finalIncorrect:1,largest:2},{label:'A',seed:2,firstSuccess:3,stableAtEnd:true,finalBonds:3,finalIncorrect:0,largest:4},{label:'A',seed:3,firstSuccess:7,stableAtEnd:false,finalBonds:2,finalIncorrect:2,largest:2}];expect(summarize(results)).toEqual({runs:3,successes:2,stableAtEnd:1,medianFirst:5,meanIncorrect:1});expect(summarize([results[0]]).medianFirst).toBeNull()})
 it('rejects out-of-range batches and snapshots settings at launch',()=>{expect(()=>createBatch({...config,count:21})).toThrow();expect(()=>createBatch({...config,baseSeed:4294967295,count:2})).toThrow();expect(()=>createBatch({...config,duration:0})).toThrow();const mutable=structuredClone(config),job=createBatch(mutable);mutable.current.temperature=2;expect(job.config.current.temperature).toBe(defaults.temperature)})
})
