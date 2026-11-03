import {advanceControlled,createControlled,type ControlledConfig} from './controlled'

self.onmessage=(event:MessageEvent<ControlledConfig>)=>{
 try{const job=createControlled(event.data);let lastUpdate=0;const work=()=>{try{const done=advanceControlled(job,400),now=performance.now();if(done||now-lastUpdate>120){self.postMessage({type:done?'done':'progress',completed:job.completedSteps,total:job.totalSteps,results:done?job.results:undefined,config:done?job.config:undefined});lastUpdate=now}if(!done)setTimeout(work,0)}catch(error){self.postMessage({type:'error',message:error instanceof Error?error.message:'The study failed.'})}};work()}catch(error){self.postMessage({type:'error',message:error instanceof Error?error.message:'The study could not start.'})}
}
