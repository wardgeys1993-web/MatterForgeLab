import {useEffect,useImperativeHandle,useLayoutEffect,useRef,useState} from 'react'
import type {MutableRefObject,Ref} from 'react'
import type {State} from './simulation/engine'
import Chamber2D from './Chamber2D'
import type {Chamber3DScene} from './chamber3DScene'
import {frameParticles} from './chamberScene'
import type {CameraAction} from './chamberGeometry'

export type ChamberHandle={command:(action:CameraAction)=>void;exportPNG:()=>string|undefined}
type Props={ref?:Ref<ChamberHandle>;sim:MutableRefObject<State>;selected:number|null;onSelect:(n:number|null)=>void;highlight:number[];forces:boolean;trails:boolean;labels:boolean}
const reduced=()=>document.documentElement.dataset.motion==='reduced'

export default function Chamber({ref:handleRef,...props}:Props){
 const canvas=useRef<HTMLCanvasElement>(null),overlay=useRef<HTMLCanvasElement>(null),container=useRef<HTMLDivElement>(null)
 const renderer=useRef<Chamber3DScene|null>(null),latest=useRef(props),hovered=useRef<number|null>(null)
 const fallbackCapture=useRef<(()=>string)|null>(null)
 const gesture=useRef<{x:number;y:number;moved:boolean;multi:boolean}|null>(null),pointers=useRef(new Set<number>())
 const [fallback,setFallback]=useState(false),[error,setError]=useState(''),[view,setView]=useState({zoom:1,x:0,y:0})
 useLayoutEffect(()=>{latest.current=props},[props])
 useImperativeHandle(handleRef,()=>({
  command:(action)=>{
   const p=latest.current
   if(renderer.current){renderer.current.command(action,p.sim.current,p.selected,reduced());return}
   if(action==='frame'){const box=container.current!.getBoundingClientRect();setView(frameParticles(p.sim.current,box.width,box.height,p.selected))}
   else if(action==='zoom-in'||action==='zoom-out')setView(v=>({...v,zoom:Math.max(.6,Math.min(2,v.zoom+(action==='zoom-in'?.2:-.2)))}))
   else if(action==='reset'||action==='top'||action==='orbit')setView({zoom:1,x:0,y:0})
  },
  exportPNG:()=>{const p=latest.current;return renderer.current?.exportPNG(p.sim.current,{selected:p.selected,hovered:hovered.current,highlight:p.highlight,forces:p.forces,trails:p.trails,labels:p.labels},reduced())??fallbackCapture.current?.()}
 }),[])
 useEffect(()=>{
  if(fallback)return
  const element=canvas.current!,hud=overlay.current!
  const activePointers=pointers.current
  let disposed=false,release=()=>{}
  void import('./chamber3DScene').then(({Chamber3DScene})=>{
  if(disposed)return
  const scene=new Chamber3DScene(element,hud);renderer.current=scene
  let frame=0,width=0,height=0,visible=true,initialized=false
  const loss=(event:Event)=>{event.preventDefault();setError('The graphics connection was interrupted. Switched to the 2D view.');setFallback(true)}
  element.addEventListener('webglcontextlost',loss)
  const resize=new ResizeObserver(entries=>{width=entries[0].contentRect.width;height=entries[0].contentRect.height;scene.resize(width,height)})
  resize.observe(element)
  const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting});intersection.observe(element)
  const draw=(now:number)=>{
   frame=requestAnimationFrame(draw)
   if(!width||!height||!visible||document.hidden)return
   const p=latest.current
   if(!initialized){scene.command('reset',p.sim.current,null,true);initialized=true}
   scene.resize(width,height);scene.render(now,p.sim.current,{selected:p.selected,hovered:hovered.current,highlight:p.highlight,forces:p.forces,trails:p.trails,labels:p.labels},reduced())
  }
  frame=requestAnimationFrame(draw)
  release=()=>{cancelAnimationFrame(frame);resize.disconnect();intersection.disconnect();element.removeEventListener('webglcontextlost',loss);renderer.current=null;scene.dispose();activePointers.clear();gesture.current=null}
  }).catch(()=>{if(!disposed){setError('3D graphics are unavailable. The 2D view remains fully usable.');setFallback(true)}})
  return()=>{disposed=true;release()}
 },[fallback])
 return <div ref={container} className="chamber-renderer" data-renderer={fallback?'2d':'3d'}>
  {fallback?<Chamber2D capture={fallbackCapture} sim={props.sim} selected={props.selected} onSelect={props.onSelect} highlight={props.highlight} forces={props.forces} trails={props.trails} labels={props.labels} view={view} onPan={(x,y)=>setView(v=>({...v,x:v.x+x,y:v.y+y}))}/>:<>
   <canvas ref={canvas} className="chamber-webgl" tabIndex={0} aria-label="Particle simulation in 3D. Drag to orbit, right drag or Shift drag to pan, scroll to zoom. Arrow keys orbit; Shift and arrows pan. Click to inspect."
    onKeyDown={e=>{
     const actions:Record<string,CameraAction>={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down','+':'zoom-in','=':'zoom-in','-':'zoom-out','0':'reset',t:'top',f:'frame'}
     if(actions[e.key]){e.preventDefault();if(e.shiftKey&&e.key.startsWith('Arrow'))renderer.current?.panKey(e.key==='ArrowLeft'?-1:e.key==='ArrowRight'?1:0,e.key==='ArrowUp'?-1:e.key==='ArrowDown'?1:0);else renderer.current?.command(actions[e.key],props.sim.current,props.selected,reduced())}
     if(e.key==='Escape')props.onSelect(null)
    }}
    onPointerDown={e=>{pointers.current.add(e.pointerId);if(pointers.current.size>1&&gesture.current)gesture.current.multi=true;else gesture.current={x:e.clientX,y:e.clientY,moved:false,multi:e.button!==0||e.shiftKey||e.ctrlKey}}}
    onPointerMove={e=>{const g=gesture.current;if(g){if(Math.hypot(e.clientX-g.x,e.clientY-g.y)>4)g.moved=true;return}const r=e.currentTarget.getBoundingClientRect();hovered.current=renderer.current?.pick(e.clientX-r.left,e.clientY-r.top)??null;e.currentTarget.style.cursor=hovered.current===null?'grab':'pointer'}}
    onPointerUp={e=>{const g=gesture.current;pointers.current.delete(e.pointerId);if(g&&!g.moved&&!g.multi){const r=e.currentTarget.getBoundingClientRect();props.onSelect(renderer.current?.pick(e.clientX-r.left,e.clientY-r.top)??null)}if(!pointers.current.size)gesture.current=null}}
    onPointerCancel={e=>{pointers.current.delete(e.pointerId);gesture.current=null}} onPointerLeave={()=>{hovered.current=null}}
   />
   <canvas ref={overlay} className="chamber-hud" aria-hidden="true"/>
  </>}
  <div className="canvas-label"><b>{fallback?'PLANAR VIEW':'3D OBSERVATORY'}</b><span>{fallback?'DRAG TO PAN · SELECT TO INSPECT':'DRAG TO ORBIT · SCROLL TO ZOOM'}</span><span className="chamber-model-label">{fallback?'2D teaching model':'Planar physics · perspective view'}</span></div>
  <div className="chamber-view-mode"><button onClick={()=>{setFallback(v=>!v);setError('')}}>{fallback?'Try 3D view':'Use 2D view'}</button><span>{fallback?'': 'SHIFT + DRAG TO PAN'}</span></div>
  {error&&<p className="chamber-graphics-status" role="status">{error}</p>}
 </div>
}
