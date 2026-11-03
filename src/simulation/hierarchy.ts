// A discrete teaching model of encounters, not molecular dynamics.
export type Part={id:number;type:'A'|'B';module:number|null}
export type Module={id:number;parts:[number,number];correct:boolean}
export type Link={a:number;b:number}
export type HierarchyState={rng:number;tick:number;parts:Part[];modules:Module[];links:Link[];nextId:number;rejected:number;repaired:number;firstSuccess:number|null;event:string}
export type HierarchyRules={selectivity:number;repair:number}
export function createHierarchy(seed=42):HierarchyState{return {rng:(seed>>>0)||1,tick:0,parts:Array.from({length:12},(_,id)=>({id,type:id%2?'B':'A',module:null})),modules:[],links:[],nextId:0,rejected:0,repaired:0,firstSuccess:null,event:'Ready. Each tick proposes two part encounters and one module connection.'}}
function random(s:HierarchyState){let x=s.rng|0;x^=x<<13;x^=x>>>17;x^=x<<5;s.rng=x>>>0;return (s.rng+1)/4294967297}
function groups(s:HierarchyState){const seen=new Set<number>(),result:number[][]=[];for(const m of s.modules){if(seen.has(m.id))continue;const group=[m.id];seen.add(m.id);for(let i=0;i<group.length;i++)for(const link of s.links){const other=link.a===group[i]?link.b:link.b===group[i]?link.a:-1;if(other>=0&&!seen.has(other)){seen.add(other);group.push(other)}}result.push(group)}return result}
export function hierarchyMetrics(s:HierarchyState){const largest=Math.max(0,...groups(s).map(g=>g.length)),defects=s.modules.filter(m=>!m.correct).length;return {free:s.parts.filter(p=>p.module===null).length,modules:s.modules.length,defects,largest,complete:s.modules.length===6&&defects===0&&largest===6}}
export function hierarchyStep(previous:HierarchyState,rules:HierarchyRules):HierarchyState{
 if(![rules.selectivity,rules.repair].every(v=>Number.isFinite(v)&&v>=0&&v<=1))throw new Error('Hierarchy probabilities must be between zero and one.')
 const s=structuredClone(previous);s.tick++;const notes:string[]=[]
 const bad=s.modules.filter(m=>!m.correct)
 if(bad.length&&random(s)<rules.repair){const broken=bad[Math.floor(random(s)*bad.length)];for(const id of broken.parts)s.parts[id].module=null;s.modules=s.modules.filter(m=>m.id!==broken.id);s.links=s.links.filter(l=>l.a!==broken.id&&l.b!==broken.id);s.repaired++;notes.push('A faulty module was taken apart for another try.')}
 for(let attempt=0;attempt<2;attempt++){const free=s.parts.filter(p=>p.module===null);if(free.length<2)break;const a=free.splice(Math.floor(random(s)*free.length),1)[0],b=free[Math.floor(random(s)*free.length)],correct=a.type!==b.type;if(!correct&&random(s)<rules.selectivity){s.rejected++;notes.push('A mismatched pair was rejected.');continue}const id=s.nextId++;a.module=id;b.module=id;s.modules.push({id,parts:[a.id,b.id],correct});notes.push(correct?'Two compatible parts formed a module.':'A mismatched pair formed a faulty module.')}
 const componentGroups=groups(s),possible:[number,number][]=[];for(let i=0;i<s.modules.length;i++)for(let j=i+1;j<s.modules.length;j++){const a=s.modules[i].id,b=s.modules[j].id;if(s.links.filter(l=>l.a===a||l.b===a).length>=2||s.links.filter(l=>l.a===b||l.b===b).length>=2||componentGroups.some(g=>g.includes(a)&&g.includes(b)))continue;possible.push([a,b])}
 if(possible.length&&random(s)<.6){const [a,b]=possible[Math.floor(random(s)*possible.length)];s.links.push({a,b});notes.push('Two components joined a larger assembly.')}
 if(hierarchyMetrics(s).complete&&s.firstSuccess===null){s.firstSuccess=s.tick;notes.push('Six correct modules now form one connected assembly.')}
 s.event=notes.length?notes.join(' '):'No connection formed in this tick. Try another.';return s
}
