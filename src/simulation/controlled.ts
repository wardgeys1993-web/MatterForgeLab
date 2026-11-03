import {createState,defaults,deserialize,DT,metrics,serialize,step,type Params,type State} from './engine'

export const studyVariables={
 temperature:{label:'Thermal agitation',min:0,max:2,step:.05},
 attraction:{label:'Attraction strength',min:.1,max:3,step:.1},
 repulsion:{label:'Repulsion strength',min:.5,max:2,step:.1},
 selectivity:{label:'Binding selectivity',min:0,max:1,step:.05},
 range:{label:'Interaction range',min:.3,max:3,step:.1},
 concentration:{label:'Particle concentration',min:.5,max:2,step:.1},
 count:{label:'Particle count',min:6,max:30,step:1},
 bindingChance:{label:'Bond formation chance',min:0,max:.4,step:.01},
 siteSpread:{label:'Custom site angle',min:30,max:180,step:5},
 siteType0:{label:'First site type',min:0,max:1,step:1},
 siteType1:{label:'Second site type',min:0,max:1,step:1},
 siteMask:{label:'Allowed site pairs',min:0,max:7,step:1}
} as const
export type StudyVariable=keyof typeof studyVariables
export type ControlledConfig={base:Params;variable:StudyVariable;valueA:number;valueB:number;count:number;duration:number;firstSeed:number;arrangement:'fixed'|'per-seed';initialSeed:number;seedSelection?:'random'|'consecutive';seeds?:number[]}
export type ControlledResult={variant:'A'|'B';seed:number;initialSeed:number;firstSuccess:number|null;stableAtEnd:boolean;finalIncorrect:number}
export type ControlledJob={config:ControlledConfig;parameters:[Params,Params];index:number;stepIndex:number;stepsPerRun:number;completedSteps:number;totalSteps:number;state:State|null;results:ControlledResult[]}

// A reversible 32-bit mixing function maps nonzero seeds to distinct nonzero states.
export function motionSeed(seed:number){let x=seed>>>0;x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);x^=x>>>16;return x>>>0}
export function initializeControlled(config:ControlledConfig,params:Params,seed:number):State {const initialSeed=config.arrangement==='fixed'?config.initialSeed:seed;const referenceConcentration=config.base.concentration;const state=createState({...params,concentration:referenceConcentration,seed:initialSeed});const scale=Math.sqrt(referenceConcentration/params.concentration);if(scale!==1)for(const p of state.particles){p.x*=scale;p.y*=scale}state.params={...params,seed:initialSeed};state.rng=motionSeed(seed);return state}
export function createControlled(input:ControlledConfig):ControlledJob {
 const config=structuredClone(input)
 if(!Object.hasOwn(studyVariables,config.variable))throw new Error('Choose a supported setting.')
 const definition=studyVariables[config.variable]
 if(!definition||!Number.isFinite(config.valueA)||!Number.isFinite(config.valueB)||config.valueA<definition.min||config.valueA>definition.max||config.valueB<definition.min||config.valueB>definition.max||config.valueA===config.valueB)throw new Error('Choose two different values within the allowed range.')
 if(['count','siteType0','siteType1','siteMask'].includes(config.variable)&&(!Number.isInteger(config.valueA)||!Number.isInteger(config.valueB)))throw new Error('Choose valid whole-number values for this setting.')
 if(!Number.isInteger(config.count)||config.count<1||config.count>100||!Number.isInteger(config.firstSeed)||config.firstSeed<1||config.firstSeed+config.count-1>4294967295||!Number.isInteger(config.initialSeed)||config.initialSeed<1||config.initialSeed>4294967295||!['fixed','per-seed'].includes(config.arrangement)||!Number.isFinite(config.duration)||config.duration<1||config.duration>200||Math.abs(config.duration/DT-Math.round(config.duration/DT))>1e-8)throw new Error('Check the seed range and choose 1 to 100 runs with a duration of 1 to 200 simulated units.')
 if(config.seedSelection!==undefined&&!['random','consecutive'].includes(config.seedSelection))throw new Error('Invalid seed selection.')
 if(config.seeds!==undefined&&(!Array.isArray(config.seeds)||config.seeds.length!==config.count||config.seeds.some(seed=>!Number.isInteger(seed)||seed<1||seed>4294967295)||new Set(config.seeds).size!==config.seeds.length))throw new Error('The study needs a distinct valid seed for each pair.')
 if(config.seedSelection==='random'&&!config.seeds)throw new Error('A random study needs its sampled seeds.')
 if(!config.base||!Number.isInteger(config.base.count)||config.base.count<6||config.base.count>30||!Object.keys(defaults).every(key=>typeof config.base[key as keyof Params]==='number'&&Number.isFinite(config.base[key as keyof Params])))throw new Error('The fixed experiment settings are invalid.')
 try{deserialize(serialize(createState({...config.base,seed:config.initialSeed})))}catch{throw new Error('The fixed experiment settings are invalid.')}
 if(['siteType0','siteType1','siteMask'].includes(config.variable)&&config.base.siteMode===0)throw new Error('Choose directional sites before studying site types or pair rules.')
 if(config.variable==='siteSpread'&&config.base.siteMode!==3)throw new Error('Choose Custom site angle in the chamber before studying that setting.')
 const parameters:[Params,Params]=[{...config.base,[config.variable]:config.valueA},{...config.base,[config.variable]:config.valueB}]
 for(const p of parameters)deserialize(serialize(createState({...p,seed:config.initialSeed})))
 const stepsPerRun=Math.round(config.duration/DT)
 return {config,parameters,index:0,stepIndex:0,stepsPerRun,completedSteps:0,totalSteps:2*config.count*stepsPerRun,state:null,results:[]}
}
export function advanceControlled(job:ControlledJob,budget:number){
 if(!Number.isInteger(budget)||budget<1||budget>10000)throw new Error('Invalid work budget.')
 while(budget>0&&job.index<2*job.config.count){const pairIndex=Math.floor(job.index/2),seed=job.config.seeds?.[pairIndex]??job.config.firstSeed+pairIndex,variant=job.index%2,initialSeed=job.config.arrangement==='fixed'?job.config.initialSeed:seed
  if(!job.state)job.state=initializeControlled(job.config,job.parameters[variant],seed)
  step(job.state);job.stepIndex++;job.completedSteps++;budget--
  if(job.stepIndex===job.stepsPerRun){const m=metrics(job.state);job.results.push({variant:variant?'B':'A',seed,initialSeed,firstSuccess:job.state.firstSuccess,stableAtEnd:job.state.success,finalIncorrect:m.incorrect});job.state=null;job.stepIndex=0;job.index++}
 }
 return job.index===2*job.config.count
}
export function summarizeControlled(results:ControlledResult[]){
 const groups={both:0,aOnly:0,bOnly:0,neither:0},pairs=new Map<number,{a?:boolean;b?:boolean}>()
 for(const r of results){const pair=pairs.get(r.seed)||{};if(r.variant==='A')pair.a=r.firstSuccess!==null;else pair.b=r.firstSuccess!==null;pairs.set(r.seed,pair)}
 for(const pair of pairs.values()){if(pair.a===undefined||pair.b===undefined)throw new Error('An experiment pair is incomplete.');if(pair.a&&pair.b)groups.both++;else if(pair.a)groups.aOnly++;else if(pair.b)groups.bOnly++;else groups.neither++}
 return {pairs:pairs.size,successA:groups.both+groups.aOnly,successB:groups.both+groups.bOnly,...groups}
}

// Approximate score interval for a single proportion (NIST Wilson method).
export function wilsonInterval(successes:number,n:number){
 if(!Number.isInteger(n)||n<1||!Number.isInteger(successes)||successes<0||successes>n)throw new Error('Invalid success count.')
 const z=1.959963984540054,p=successes/n,z2=z*z,denominator=1+z2/n,center=(p+z2/(2*n))/denominator,half=z*Math.sqrt(p*(1-p)/n+z2/(4*n*n))/denominator
 return {low:Math.max(0,center-half),high:Math.min(1,center+half)}
}
// Hoeffding bound for paired outcomes in [-1,1], conservative for uniform sampling without replacement.
export function pairedDifferenceBound(aOnly:number,bOnly:number,n:number){
 if(!Number.isInteger(n)||n<1||!Number.isInteger(aOnly)||!Number.isInteger(bOnly)||aOnly<0||bOnly<0||aOnly+bOnly>n)throw new Error('Invalid paired counts.')
 const difference=(bOnly-aOnly)/n,margin=Math.sqrt(2*Math.log(40)/n)
 return {difference,low:Math.max(-1,difference-margin),high:Math.min(1,difference+margin)}
}
