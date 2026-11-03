export type LocalAIRequest={endpoint:string;model:string;mode:'explain'|'hypotheses';evidence:string}
export interface LocalResearchExplainer{run(request:LocalAIRequest):Promise<string>}

/** Optional loopback-only, OpenAI-compatible text adapter. It cannot schedule experiments. */
export class LocalChatExplainer implements LocalResearchExplainer{
 async run(request:LocalAIRequest):Promise<string>{
  let url:URL;try{url=new URL(request.endpoint)}catch{throw new Error('Enter a valid local server URL.')}
  if(url.protocol!=='http:'||!['localhost','127.0.0.1','[::1]'].includes(url.hostname)||url.username||url.password||url.search||url.hash||url.pathname!=='/v1/chat/completions')throw new Error('Use a loopback HTTP URL ending in /v1/chat/completions.')
  if(!/^[a-zA-Z0-9._:/-]{1,128}$/.test(request.model)||!['explain','hypotheses'].includes(request.mode))throw new Error('Enter a valid local model name.')
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000)
  try{
   const instruction=request.mode==='hypotheses'?'Suggest a few clearly labelled follow-up hypotheses. Do not claim they have been tested.':'Explain the recorded study in simple language. Separate observations from uncertainty.'
   const response=await fetch(url.toString(),{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',redirect:'error',signal:controller.signal,body:JSON.stringify({model:request.model,stream:false,max_tokens:500,messages:[{role:'system',content:'You are an optional research assistant. Use only the supplied evidence for factual results. Never invent numbers. This is a simplified teaching model, not real-world chemistry. Do not output commands or code.'},{role:'user',content:`${instruction}\n\nRecorded research evidence:\n${request.evidence.slice(0,16000)}`}]})})
   if(!response.ok)throw new Error(`Local server returned HTTP ${response.status}.`)
   const reader=response.body?.getReader();if(!reader)throw new Error('The local server returned an empty response.');let size=0;const chunks:Uint8Array[]=[]
   for(;;){const item=await reader.read();if(item.done)break;size+=item.value.length;if(size>65536){await reader.cancel();throw new Error('The local server response was too large.')}chunks.push(item.value)}
   const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}
   let data:{choices?:{message?:{content?:unknown}}[]};try{data=JSON.parse(new TextDecoder().decode(bytes))}catch{throw new Error('The local server returned invalid JSON.')}
   const text=data.choices?.[0]?.message?.content;if(typeof text!=='string'||!text.trim())throw new Error('The local model returned no text.');return text.slice(0,8000)
  }catch(error){if(error instanceof Error&&error.name==='AbortError')throw new Error('The local AI request timed out.');if(error instanceof TypeError)throw new Error('The local server is unavailable or blocked by browser CORS. The algorithmic researcher still works offline.');throw error}finally{clearTimeout(timer)}
 }
}
