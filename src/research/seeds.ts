export function drawSeeds(count:number,excluded:number[]=[]):number[]{
 if(!Number.isInteger(count)||count<1||count>50||!Array.isArray(excluded)||excluded.length>100)throw new Error('Invalid seed sample size.')
 const blocked=new Set(excluded),selected=new Set<number>()
 while(selected.size<count){const values=crypto.getRandomValues(new Uint32Array(count-selected.size));for(const value of values)if(value!==0&&!blocked.has(value))selected.add(value)}
 return [...selected]
}
