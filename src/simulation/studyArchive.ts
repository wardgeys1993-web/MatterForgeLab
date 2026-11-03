import {createControlled,type ControlledConfig,type ControlledResult} from './controlled'
import {defaults} from './engine'

export type StudyArchive={version:1|2;simulationStateVersion:3|4|5;engineModel:string;config:ControlledConfig;results:ControlledResult[]}
export type ReplayComparison={matches:number;total:number;changed:number}

/** Validate a complete, bounded study before any imported work is scheduled. */
export function readStudyArchive(raw:string):StudyArchive{
 const invalid=()=>{throw new Error('Choose a valid, complete MatterForge controlled-study JSON file.')}
 let value:unknown
 try{value=JSON.parse(raw)}catch{return invalid()}
 if(!value||typeof value!=='object'||Array.isArray(value))return invalid()
 const archive=value as Record<string,unknown>
 if(archive.format!=='matterforge-controlled-study'||(archive.version!==1&&archive.version!==2)||(archive.simulationStateVersion!==3&&archive.simulationStateVersion!==4&&archive.simulationStateVersion!==5)||archive.engineModel!==`coarse-grained-${archive.simulationStateVersion}`||!archive.config||typeof archive.config!=='object'||Array.isArray(archive.config))return invalid()
 let config:ControlledConfig
 try{const input=structuredClone(archive.config as ControlledConfig);if(archive.simulationStateVersion<5){if(!input.base||typeof input.base!=='object'||['siteType0','siteType1','siteMask'].includes(input.variable)||(archive.simulationStateVersion===3&&input.base.targetMode===2))return invalid();for(const key of ['siteType0','siteType1','siteMask'] as const){if(input.base[key]!==undefined&&input.base[key]!==defaults[key])return invalid();input.base[key]=defaults[key]}}config=createControlled(input).config}catch{return invalid()}
 // The old archive used consecutive seeds. Explicit seed arrays must be described as random.
 if((archive.version===1&&(config.seeds!==undefined||config.seedSelection==='random'))||(config.seeds!==undefined&&config.seedSelection!=='random'))return invalid()
 if(!Array.isArray(archive.results)||archive.results.length!==config.count*2)return invalid()
 const results:ControlledResult[]=[]
 for(let i=0;i<archive.results.length;i++){
  const row=archive.results[i] as ControlledResult,seed=config.seeds?.[Math.floor(i/2)]??config.firstSeed+Math.floor(i/2),initialSeed=config.arrangement==='fixed'?config.initialSeed:seed
  const maxBonds=config.variable==='count'?(i%2?config.valueB:config.valueA):config.base.count
  if(!row||typeof row!=='object'||row.variant!==(i%2?'B':'A')||row.seed!==seed||row.initialSeed!==initialSeed||typeof row.stableAtEnd!=='boolean'||!Number.isInteger(row.finalIncorrect)||row.finalIncorrect<0||row.finalIncorrect>maxBonds||!(row.firstSuccess===null||(typeof row.firstSuccess==='number'&&Number.isFinite(row.firstSuccess)&&row.firstSuccess>=0&&row.firstSuccess<=config.duration+1e-7))||(row.stableAtEnd&&row.firstSuccess===null))return invalid()
  results.push({variant:row.variant,seed:row.seed,initialSeed:row.initialSeed,firstSuccess:row.firstSuccess,stableAtEnd:row.stableAtEnd,finalIncorrect:row.finalIncorrect})
 }
 return {version:archive.version,simulationStateVersion:archive.simulationStateVersion,engineModel:archive.engineModel,config,results}
}

export function compareReplay(expected:ControlledResult[],actual:ControlledResult[]):ReplayComparison{
 if(expected.length!==actual.length)throw new Error('The replay is incomplete.')
 let matches=0
 for(let i=0;i<expected.length;i++){const a=expected[i],b=actual[i];if(a.variant===b.variant&&a.seed===b.seed&&a.initialSeed===b.initialSeed&&a.firstSuccess===b.firstSuccess&&a.stableAtEnd===b.stableAtEnd&&a.finalIncorrect===b.finalIncorrect)matches++}
 return {matches,total:expected.length,changed:expected.length-matches}
}
