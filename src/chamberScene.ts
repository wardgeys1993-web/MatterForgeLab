import {siteAngle,type State} from './simulation/engine'

export type Camera={zoom:number;x:number;y:number}
export type Point={x:number;y:number}
export type TrailPoint=Point&{time:number}
export type SceneOptions={selected:number|null;hovered:number|null;highlight:number[];view:Camera;forces:boolean;trails:boolean;labels:boolean}
export const TRAIL_DURATION=2.4
export function cameraFrame(width:number,height:number,view:Camera){return {scale:Math.min(width,height)/17*view.zoom,ox:width/2+view.x,oy:height/2+view.y}}
export function particleAt(state:State,x:number,y:number,width:number,height:number,view:Camera){
 const {scale,ox,oy}=cameraFrame(width,height,view)
 let result:number|null=null,nearest=Infinity
 for(const p of state.particles){const distance=Math.hypot(x-ox-p.x*scale,y-oy-p.y*scale);if(distance<Math.max(12,scale*.48)&&distance<nearest){result=p.id;nearest=distance}}
 return result
}
export function frameParticles(state:State,width:number,height:number,selected:number|null):Camera {
 const ids=new Set<number>(selected===null?state.particles.map(p=>p.id):[selected])
 if(selected!==null)for(let pass=0;pass<state.particles.length;pass++)for(const b of state.bonds){if(ids.has(b.a))ids.add(b.b);if(ids.has(b.b))ids.add(b.a)}
 const particles=state.particles.filter(p=>ids.has(p.id));if(!particles.length)return {zoom:1,x:0,y:0}
 const xs=particles.map(p=>p.x),ys=particles.map(p=>p.y),left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys),base=Math.min(width,height)/17
 const zoom=Math.max(.6,Math.min(2,(width-100)/((right-left+2.5)*base),(height-130)/((bottom-top+2.5)*base)))
 return {zoom,x:-(left+right)/2*base*zoom,y:-(top+bottom)/2*base*zoom}
}

/** View history samples actual model positions. Rendering never advances the model. */
export class TrailHistory {
 points=new Map<number,TrailPoint[]>()
 private state:State|null=null
 private time=-1
 update(state:State,enabled:boolean){
  if(this.state!==state||state.time<this.time||!enabled){this.points.clear();this.time=-1}
  this.state=state
  if(!enabled||state.time===this.time)return
  for(const p of state.particles){
   const points=this.points.get(p.id)??[];points.push({x:p.x,y:p.y,time:state.time})
   while(points.length>96||points[0].time<state.time-TRAIL_DURATION)points.shift()
   this.points.set(p.id,points)
  }
  this.time=state.time
 }
}

const TAU=Math.PI*2
const palette=[{base:'#85c8b8',edge:'#bcebdd',dark:'#163e3d'},{base:'#d8ae68',edge:'#f4dca4',dark:'#534020'}]
function path(ctx:CanvasRenderingContext2D,x:number,y:number,r:number){ctx.beginPath();ctx.arc(x,y,r,0,TAU)}
function segment(ctx:CanvasRenderingContext2D,a:Point,b:Point){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}

function sphereSprite(type:0|1){
 const canvas=document.createElement('canvas');canvas.width=192;canvas.height=192
 const ctx=canvas.getContext('2d')!,c=palette[type],x=96,y=88,r=55
 const shadow=ctx.createRadialGradient(x,y+16,10,x,y+16,83);shadow.addColorStop(0,'#000b');shadow.addColorStop(.65,'#0004');shadow.addColorStop(1,'#0000')
 ctx.fillStyle=shadow;ctx.fillRect(0,0,192,192)
 const body=ctx.createRadialGradient(x-r*.4,y-r*.48,0,x+r*.22,y+r*.35,r*1.37)
 body.addColorStop(0,type?'#f9e7b7':'#e4f7ed');body.addColorStop(.18,c.edge);body.addColorStop(.44,c.base);body.addColorStop(.76,c.dark);body.addColorStop(1,'#07151a')
 path(ctx,x,y,r);ctx.fillStyle=body;ctx.fill()
 ctx.save();path(ctx,x,y,r);ctx.clip()
 const bounce=ctx.createRadialGradient(x+r*.35,y+r*.9,0,x+r*.35,y+r*.9,r*.8);bounce.addColorStop(0,type?'#deb86b88':'#8ed4bf77');bounce.addColorStop(1,'#0000')
 ctx.fillStyle=bounce;ctx.fillRect(x-r,y-r,r*2,r*2)
 const shine=ctx.createRadialGradient(x-r*.32,y-r*.5,0,x-r*.32,y-r*.5,r*.45);shine.addColorStop(0,'#fffff5aa');shine.addColorStop(.3,'#fffff53b');shine.addColorStop(1,'#ffffff00')
 ctx.fillStyle=shine;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore()
 ctx.strokeStyle=type?'#e1c38f88':'#9ed7c988';ctx.lineWidth=1.6;path(ctx,x,y,r-.5);ctx.stroke()
 ctx.beginPath();ctx.arc(x,y,r-2,Math.PI*1.07,Math.PI*1.78);ctx.strokeStyle='#f5f4de77';ctx.lineWidth=1.8;ctx.stroke()
 ctx.font='500 25px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#071b2199';ctx.fillText(type?'B':'A',x,y+9)
 return canvas
}

/** Lighting is a display convention. World positions and links come from State. */
export class ChamberRenderer {
 private sprites=[sphereSprite(0),sphereSprite(1)]
 private backdrop=document.createElement('canvas')
 private backgroundKey=''
 trails=new TrailHistory()
 draw(ctx:CanvasRenderingContext2D,width:number,height:number,dpr:number,state:State,options:SceneOptions){
  const {view,selected,hovered,highlight,forces,labels}=options
  const {scale,ox,oy}=cameraFrame(width,height,view),bound=7/Math.sqrt(state.params.concentration)
  const screen=(p:Point)=>({x:ox+p.x*scale,y:oy+p.y*scale}),radius=Math.max(7,scale*.44)
  const key=[width,height,dpr,view.zoom,view.x,view.y,bound].join(':')
  if(key!==this.backgroundKey){this.backgroundKey=key;this.drawBackground(width,height,dpr,scale,ox,oy,bound)}
  ctx.drawImage(this.backdrop,0,0,width,height)
  this.trails.update(state,options.trails)
  if(options.trails){
   ctx.lineCap='round';ctx.lineWidth=1.8
   for(const p of state.particles){const list=this.trails.points.get(p.id)??[]
    for(let i=1;i<list.length;i++){ctx.globalAlpha=Math.max(0,1-(state.time-list[i].time)/TRAIL_DURATION)*.48;ctx.strokeStyle=palette[p.type].base;segment(ctx,screen(list[i-1]),screen(list[i]))}
   }ctx.globalAlpha=1
  }
  if(forces){
   const inspected=state.particles.find(p=>p.id===(selected??hovered))
   if(inspected){const at=screen(inspected),outer=(1.05+state.params.range)*scale
    const field=ctx.createRadialGradient(at.x,at.y,0,at.x,at.y,outer);field.addColorStop(0,'#84c5b608');field.addColorStop(.95,'#84c5b610');field.addColorStop(1,'#84c5b600')
    path(ctx,at.x,at.y,outer);ctx.fillStyle=field;ctx.fill();ctx.lineWidth=1;ctx.strokeStyle='#86bcb355';ctx.setLineDash([3,5]);ctx.stroke();ctx.setLineDash([])
    path(ctx,at.x,at.y,1.05*scale);ctx.strokeStyle='#cc8c7066';ctx.stroke()
   }
  }
  const occupied=new Set<string>()
  for(const b of state.bonds){
   const a=state.particles[b.a],z=state.particles[b.b];let start=screen(a),end=screen(z)
   if(state.params.siteMode&&b.siteA!==undefined&&b.siteB!==undefined){
    const aa=siteAngle(a,b.siteA,state.params.siteMode,state.params.siteSpread),za=siteAngle(z,b.siteB,state.params.siteMode,state.params.siteSpread)
    start={x:start.x+Math.cos(aa)*radius,y:start.y+Math.sin(aa)*radius};end={x:end.x+Math.cos(za)*radius,y:end.y+Math.sin(za)*radius}
    occupied.add(`${b.a}:${b.siteA}`);occupied.add(`${b.b}:${b.siteB}`)
   }
   const size=Math.max(2.4,radius*.25),color=b.correct?'#d8bb7d':'#e9998c'
   ctx.lineCap='round';ctx.lineWidth=size+7;ctx.strokeStyle=b.correct?'#c8ac6120':'#e4887326';segment(ctx,start,end)
   ctx.lineWidth=size+2;ctx.strokeStyle='#071216';segment(ctx,start,end)
   const metal=ctx.createLinearGradient(start.x,start.y-size,end.x,end.y+size)
   metal.addColorStop(0,b.correct?'#7c6a47':'#874e47');metal.addColorStop(.48,color);metal.addColorStop(.53,b.correct?'#fff0c3':'#ffe0d7');metal.addColorStop(1,b.correct?'#8d794f':'#97534a')
   ctx.strokeStyle=metal;ctx.lineWidth=size;if(!b.correct)ctx.setLineDash([5,4]);segment(ctx,start,end);ctx.setLineDash([])
   if(!b.correct){const x=(start.x+end.x)/2,y=(start.y+end.y)/2;ctx.lineWidth=1.4;ctx.strokeStyle='#ffd0c1';segment(ctx,{x:x-3,y:y-3},{x:x+3,y:y+3});segment(ctx,{x:x-3,y:y+3},{x:x+3,y:y-3})}
  }
  const labelNodes:{id:number;type:0|1;at:Point;focused:boolean}[]=[]
  for(const p of state.particles){
   const at=screen(p)
   if(at.x<-100||at.x>width+100||at.y<-100||at.y>height+100)continue
   const focused=selected===p.id,hover=hovered===p.id,marked=highlight.includes(p.id),held=state.stableIds.includes(p.id)
   if(focused||hover||marked||held){
    const ring=radius+(focused?8:5)
    ctx.strokeStyle=focused?'#ead8aa':held?'#8ed6ba':marked?'#c5ddd1':'#9baea577';ctx.lineWidth=focused?1.4:1;path(ctx,at.x,at.y,ring);ctx.stroke()
    if(focused){ctx.strokeStyle='#e4d5af66';for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])segment(ctx,{x:at.x+dx*(ring+3),y:at.y+dy*(ring+3)},{x:at.x+dx*(ring+7),y:at.y+dy*(ring+7)})}
   }
   const factor=radius/55;ctx.drawImage(this.sprites[p.type],at.x-96*factor,at.y-88*factor,192*factor,192*factor)
   if(state.params.siteMode)for(let site=0;site<2;site++){
    const angle=siteAngle(p,site,state.params.siteMode,state.params.siteSpread),x=at.x+Math.cos(angle)*radius,y=at.y+Math.sin(angle)*radius,size=Math.max(3.3,radius*.25),type=site===0?state.params.siteType0:state.params.siteType1,taken=occupied.has(`${p.id}:${site}`)
    ctx.beginPath();if(type===0)ctx.arc(x,y,size,0,TAU);else{ctx.moveTo(x,y-size*1.2);ctx.lineTo(x+size*1.2,y);ctx.lineTo(x,y+size*1.2);ctx.lineTo(x-size*1.2,y);ctx.closePath()}
    ctx.fillStyle=type===0?'#c7eee4':'#dfb7ec';ctx.strokeStyle='#07171d';ctx.lineWidth=2.7;ctx.stroke();ctx.fill()
    if(taken){ctx.strokeStyle='#f6db9d';ctx.lineWidth=1;ctx.stroke()}
   }
   if(labels||focused||hover)labelNodes.push({id:p.id,type:p.type,at,focused})
  }
  const placed:{x:number;y:number}[]=[],centers=state.particles.map(screen)
  for(const item of labelNodes.sort((a,b)=>Number(b.focused)-Number(a.focused))){
   const candidates:Point[]=[{x:item.at.x,y:item.at.y+radius+19}]
   for(const offset of [radius+30,radius+49,radius+67])for(const angle of [Math.PI/2,0,Math.PI,-Math.PI/2,Math.PI/4,Math.PI*.75,-Math.PI*.25,-Math.PI*.75])candidates.push({x:item.at.x+Math.cos(angle)*offset,y:item.at.y+Math.sin(angle)*offset})
   const position=candidates.find(p=>p.x>22&&p.x<width-22&&p.y>60&&p.y<height-55&&!placed.some(q=>Math.abs(p.x-q.x)<41&&Math.abs(p.y-q.y)<20)&&!centers.some(q=>Math.hypot(Math.max(Math.abs(p.x-q.x)-20,0),Math.max(Math.abs(p.y-q.y)-9,0))<radius+3))??candidates[0]
   placed.push(position)
   const distance=Math.hypot(position.x-item.at.x,position.y-item.at.y)
   if(distance>radius+23){const dx=(position.x-item.at.x)/distance,dy=(position.y-item.at.y)/distance;ctx.strokeStyle='#b1c6b366';ctx.lineWidth=.7;segment(ctx,{x:item.at.x+dx*(radius+3),y:item.at.y+dy*(radius+3)},position)}
   const label=`${item.type?'B':'A'}${String(item.id+1).padStart(2,'0')}`
   ctx.font='10px "Manrope Variable", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#071318e8';ctx.fillRect(position.x-18,position.y-8,36,16);ctx.fillStyle=item.focused?'#f1ddb1':palette[item.type].edge;ctx.fillText(label,position.x,position.y)
  }
  if(forces)for(const p of state.particles){
   const at=screen(p),length=Math.hypot(p.fx,p.fy)*scale*.18;if(length<1)continue
   const dx=p.fx*scale*.18,dy=p.fy*scale*.18,angle=Math.atan2(dy,dx),end={x:at.x+dx,y:at.y+dy}
   ctx.strokeStyle='#dce5c7b3';ctx.lineWidth=1.2;segment(ctx,at,end)
   const head=Math.min(5,length*.3);ctx.beginPath();ctx.moveTo(end.x-head*Math.cos(angle-.5),end.y-head*Math.sin(angle-.5));ctx.lineTo(end.x,end.y);ctx.lineTo(end.x-head*Math.cos(angle+.5),end.y-head*Math.sin(angle+.5));ctx.stroke()
  }
  this.drawScale(ctx,width,height,scale,state)
 }
 private drawBackground(w:number,h:number,dpr:number,scale:number,ox:number,oy:number,bound:number){
  this.backdrop.width=Math.round(w*dpr);this.backdrop.height=Math.round(h*dpr)
  const ctx=this.backdrop.getContext('2d')!;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#070f14';ctx.fillRect(0,0,w,h)
  const light=ctx.createRadialGradient(w*.48,h*.42,0,w*.48,h*.42,Math.max(w,h)*.65);light.addColorStop(0,'#263c3c');light.addColorStop(.48,'#12282d');light.addColorStop(1,'#071015');ctx.fillStyle=light;ctx.fillRect(0,0,w,h)
  const left=ox-bound*scale,top=oy-bound*scale,size=bound*scale*2
  ctx.fillStyle='#030b10a6';ctx.beginPath();ctx.rect(0,0,w,h);ctx.rect(left,top,size,size);ctx.fill('evenodd')
  ctx.save();ctx.beginPath();ctx.rect(left,top,size,size);ctx.clip()
  const spacing=scale<18?2:1;ctx.lineWidth=.6;ctx.strokeStyle='#b8d0c00c'
  for(let i=Math.ceil(-bound/spacing)*spacing;i<=bound;i+=spacing){segment(ctx,{x:ox+i*scale,y:top},{x:ox+i*scale,y:top+size});segment(ctx,{x:left,y:oy+i*scale},{x:left+size,y:oy+i*scale})}
  ctx.fillStyle='#a9c8bb35'
  for(let x=Math.ceil(-bound);x<=bound;x++)for(let y=Math.ceil(-bound);y<=bound;y++){if(x%2||y%2)continue;ctx.fillRect(ox+x*scale-.7,oy+y*scale-.7,1.4,1.4)}
  ctx.strokeStyle='#c1d3bb23';ctx.setLineDash([2,7]);segment(ctx,{x:left,y:oy},{x:left+size,y:oy});segment(ctx,{x:ox,y:top},{x:ox,y:top+size});ctx.setLineDash([]);ctx.restore()
  ctx.strokeStyle='#9abbb632';ctx.lineWidth=1;ctx.strokeRect(left,top,size,size);ctx.strokeStyle='#c6bb9366';ctx.lineWidth=1.2
  for(const [x,y,dx,dy]of [[left,top,1,1],[left+size,top,-1,1],[left,top+size,1,-1],[left+size,top+size,-1,-1]]){ctx.beginPath();ctx.moveTo(x+dx*16,y);ctx.lineTo(x,y);ctx.lineTo(x,y+dy*16);ctx.stroke()}
  ctx.font='9px "Manrope Variable", sans-serif';ctx.textAlign='center';ctx.fillStyle='#96aaa38c'
  if(top>25&&left>20)for(let i=Math.ceil(-bound/2)*2;i<=bound;i+=2){const x=ox+i*scale;if(x<20||x>w-20)continue;ctx.fillText(String(i),x,top-10);ctx.strokeStyle='#abbcb144';segment(ctx,{x,y:top-4},{x,y:top})}
 }
 private drawScale(ctx:CanvasRenderingContext2D,w:number,h:number,scale:number,state:State){
  const units=scale>55?1:2,length=scale*units,x=w-24-length,y=h-29
  ctx.fillStyle='#08151be6';ctx.fillRect(x-12,y-15,length+24,34);ctx.lineWidth=1;ctx.strokeStyle='#b1bfa6'
  segment(ctx,{x,y},{x:x+length,y});segment(ctx,{x,y:y-3},{x,y:y+3});segment(ctx,{x:x+length,y:y-3},{x:x+length,y:y+3})
  ctx.font='9px "Manrope Variable", sans-serif';ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillStyle='#c0ccbb';ctx.fillText(`${units} model ${units===1?'unit':'units'}`,x+length/2,y+14)
  ctx.textAlign='left';ctx.fillStyle='#819995';ctx.font='8px "Manrope Variable", sans-serif';ctx.fillText('2D MODEL · SHADED FOR CLARITY',18,h-24)
  if(w>480){ctx.fillStyle='#a9bdb0';ctx.fillText(`${state.particles.length} PARTICLES  /  ${state.bonds.length} LINKS`,18,h-40)}
 }
}
