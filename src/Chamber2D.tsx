import {useEffect,useLayoutEffect,useRef} from 'react'
import type {MutableRefObject} from 'react'
import type {State} from './simulation/engine'
import {ChamberRenderer,particleAt,type Camera} from './chamberScene'

type Props={capture?:MutableRefObject<(()=>string)|null>;sim:MutableRefObject<State>;selected:number|null;onSelect:(n:number|null)=>void;highlight:number[];view:Camera;onPan:(x:number,y:number)=>void;forces:boolean;trails:boolean;labels:boolean}

export default function Chamber(props:Props){
 const ref=useRef<HTMLCanvasElement>(null),latest=useRef(props),hovered=useRef<number|null>(null)
 const displayedView=useRef({...props.view})
 const drag=useRef<{x:number;y:number;startX:number;startY:number;moved:boolean}|null>(null)
 useLayoutEffect(()=>{latest.current=props},[props])
 useEffect(()=>{
  const canvas=ref.current!,ctx=canvas.getContext('2d',{alpha:false})!,renderer=new ChamberRenderer()
  const capture=latest.current.capture
  let frame=0,dirty=true,width=0,height=0,previousTime=-1,previousState:State|null=null,previousProps:Props|null=null,previousHover:number|null=null,visible=true,lastFrame=performance.now()
  const resize=new ResizeObserver(entries=>{width=entries[0].contentRect.width;height=entries[0].contentRect.height;dirty=true})
  resize.observe(canvas)
  const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)dirty=true})
  intersection.observe(canvas)
  if(capture)capture.current=()=>{
   const p=latest.current,box=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2)
   canvas.width=Math.round(box.width*dpr);canvas.height=Math.round(box.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)
   renderer.draw(ctx,box.width,box.height,dpr,p.sim.current,{...p,view:displayedView.current,hovered:hovered.current})
   return canvas.toDataURL('image/png')
  }
  const draw=(now=performance.now())=>{
   frame=requestAnimationFrame(draw)
   const elapsed=Math.min(100,now-lastFrame);lastFrame=now
   if(!visible||document.hidden||!width||!height)return
   const p=latest.current,s=p.sim.current,dpr=Math.min(devicePixelRatio||1,2),pixelWidth=Math.round(width*dpr),pixelHeight=Math.round(height*dpr)
   const camera=displayedView.current,target=p.view,instant=document.documentElement.dataset.motion==='reduced'||drag.current?.moved
   if(camera.zoom!==target.zoom||camera.x!==target.x||camera.y!==target.y){
    const blend=instant?1:1-Math.exp(-elapsed/65)
    for(const key of ['zoom','x','y'] as const){camera[key]+=(target[key]-camera[key])*blend;if(Math.abs(target[key]-camera[key])<(key==='zoom'?.0001:.05))camera[key]=target[key]}
    dirty=true
   }
   if(canvas.width!==pixelWidth||canvas.height!==pixelHeight){canvas.width=pixelWidth;canvas.height=pixelHeight;dirty=true}
   if(!dirty&&previousState===s&&previousTime===s.time&&previousProps===p&&previousHover===hovered.current)return
   ctx.setTransform(dpr,0,0,dpr,0,0)
   renderer.draw(ctx,width,height,dpr,s,{...p,view:camera,hovered:hovered.current})
   previousTime=s.time;previousState=s;previousProps=p;previousHover=hovered.current;dirty=false
  }
  draw()
  return()=>{cancelAnimationFrame(frame);resize.disconnect();intersection.disconnect();if(capture)capture.current=null}
 },[])
 const hit=(clientX:number,clientY:number)=>{const r=ref.current!.getBoundingClientRect();return particleAt(props.sim.current,clientX-r.left,clientY-r.top,r.width,r.height,displayedView.current)}
 const clearDrag=()=>{drag.current=null}
 return <canvas ref={ref} tabIndex={0} aria-label="Particle simulation. Click a particle to inspect it or drag to pan. Arrow keys pan; the Inspect particle selector supports keyboard selection."
  onKeyDown={e=>{
   const delta:Record<string,[number,number]>={ArrowLeft:[20,0],ArrowRight:[-20,0],ArrowUp:[0,20],ArrowDown:[0,-20]}
   if(delta[e.key]){e.preventDefault();props.onPan(...delta[e.key])}
   if(e.key==='Escape'){props.onSelect(null);hovered.current=null}
  }}
  onPointerDown={e=>{if(e.button!==0)return;e.currentTarget.setPointerCapture(e.pointerId);drag.current={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false}}}
  onPointerMove={e=>{
   const d=drag.current
   if(!d){hovered.current=hit(e.clientX,e.clientY);e.currentTarget.style.cursor=hovered.current===null?'grab':'pointer';return}
   if(Math.hypot(e.clientX-d.startX,e.clientY-d.startY)>4)d.moved=true
   if(d.moved){e.currentTarget.style.cursor='grabbing';props.onPan(e.clientX-d.x,e.clientY-d.y);d.x=e.clientX;d.y=e.clientY}
  }}
  onPointerUp={e=>{const d=drag.current;clearDrag();if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);e.currentTarget.style.cursor='grab';if(d&&!d.moved)props.onSelect(hit(e.clientX,e.clientY))}}
  onPointerCancel={clearDrag} onLostPointerCapture={clearDrag} onPointerLeave={()=>{hovered.current=null}}/>
}
