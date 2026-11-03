import {advanceBatch,createBatch,type BatchConfig} from './batch'

self.onmessage=(event:MessageEvent<BatchConfig>)=>{
 try{
  const job=createBatch(event.data)
  let lastUpdate=0
  const work=()=>{try{const done=advanceBatch(job,300);const now=performance.now();if(done||now-lastUpdate>120){self.postMessage({type:done?'done':'progress',completed:job.completedSteps,total:job.totalSteps,results:done?job.results:undefined,config:done?job.config:undefined});lastUpdate=now}if(!done)setTimeout(work,0)}catch(error){self.postMessage({type:'error',message:error instanceof Error?error.message:'The batch failed.'})}}
  work()
 }catch(error){self.postMessage({type:'error',message:error instanceof Error?error.message:'The batch could not start.'})}
}
