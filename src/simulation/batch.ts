import {createState,defaults,deserialize,DT,metrics,serialize,step,type Params,type State} from './engine'

export type RunResult={label:string;seed:number;firstSuccess:number|null;stableAtEnd:boolean;finalBonds:number;finalIncorrect:number;largest:number}
export type BatchConfig={current:Params;saved:Params|null;baseSeed:number;count:number;duration:number}
export type BatchJob={config:BatchConfig;sets:{label:string;params:Params}[];index:number;stepIndex:number;stepsPerRun:number;completedSteps:number;totalSteps:number;state:State|null;results:RunResult[]}

export function createBatch(input:BatchConfig):BatchJob {
 const config=structuredClone(input)
 if(!Number.isInteger(config.count)||config.count<1||config.count>20||!Number.isInteger(config.baseSeed)||config.baseSeed<1||config.baseSeed+config.count-1>4294967295||!Number.isFinite(config.duration)||config.duration<1||config.duration>200||Math.abs(config.duration/DT-Math.round(config.duration/DT))>1e-8)throw new Error('Choose 1 to 20 seeds, a valid starting seed, and a duration from 1 to 200 simulation units.')
 const sets=config.saved?[{label:'A',params:config.saved},{label:'Current',params:config.current}]:[{label:'Current',params:config.current}]
 for(const set of sets){const p=set.params;if(!p||!Number.isInteger(p.count)||p.count<6||p.count>30||!Object.keys(defaults).every(key=>typeof p[key as keyof Params]==='number'&&Number.isFinite(p[key as keyof Params])))throw new Error('The experiment settings are invalid.');deserialize(serialize(createState({...p,seed:config.baseSeed}))) }
 const stepsPerRun=Math.round(config.duration/DT)
 return {config,sets,index:0,stepIndex:0,stepsPerRun,completedSteps:0,totalSteps:sets.length*config.count*stepsPerRun,state:null,results:[]}
}
export function advanceBatch(job:BatchJob,budget:number){
 if(!Number.isInteger(budget)||budget<1||budget>10000)throw new Error('Invalid work budget.')
 while(budget>0&&job.index<job.sets.length*job.config.count){
  const set=job.sets[Math.floor(job.index/job.config.count)],seed=job.config.baseSeed+job.index%job.config.count
  if(!job.state)job.state=createState({...set.params,seed})
  step(job.state);job.stepIndex++;job.completedSteps++;budget--
  if(job.stepIndex===job.stepsPerRun){const m=metrics(job.state);job.results.push({label:set.label,seed,firstSuccess:job.state.firstSuccess,stableAtEnd:job.state.success,finalBonds:m.bonds,finalIncorrect:m.incorrect,largest:m.largest});job.state=null;job.stepIndex=0;job.index++}
 }
 return job.index===job.sets.length*job.config.count
}
export function summarize(results:RunResult[]){
 if(results.length===0)return {runs:0,successes:0,stableAtEnd:0,medianFirst:null as number|null,meanIncorrect:null as number|null}
 const times=results.flatMap(r=>r.firstSuccess===null?[]:[r.firstSuccess]).sort((a,b)=>a-b),mid=Math.floor(times.length/2)
 return {runs:results.length,successes:times.length,stableAtEnd:results.filter(r=>r.stableAtEnd).length,medianFirst:times.length?(times.length%2?times[mid]:(times[mid-1]+times[mid])/2):null,meanIncorrect:results.reduce((sum,r)=>sum+r.finalIncorrect,0)/results.length}
}
