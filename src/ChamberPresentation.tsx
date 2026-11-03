import {useEffect,useRef,useState} from 'react'
import {Focus,Maximize2,Minimize2,Scan,X,ZoomIn,ZoomOut,Layers3,Orbit} from 'lucide-react'
import type {MutableRefObject} from 'react'
import type {State} from './simulation/engine'
import {frameParticles,type Camera} from './chamberScene'
import type {CameraAction} from './chamberGeometry'

export function ChamberCameraTools({selected,onCommand}:{selected:number|null;onCommand:(action:CameraAction)=>void}){
 const items:[CameraAction,string,typeof Scan][]=[['frame',selected===null?'Frame all particles':'Frame selected assembly',Scan],['zoom-in','Zoom in',ZoomIn],['zoom-out','Zoom out',ZoomOut],['top','Top view',Layers3],['orbit','Perspective view',Orbit],['reset','Reset camera',Focus]]
 return <div className="canvas-tools">{items.map(([action,title,Icon])=><button key={action} title={title} aria-label={title} onClick={()=>onCommand(action)}><Icon size={17}/></button>)}</div>
}

export function FrameParticles({sim,selected,onFrame}:{sim:MutableRefObject<State>;selected:number|null;onFrame:(view:Camera)=>void}){
 return <button title={selected===null?'Frame all particles':'Frame selected assembly'} aria-label={selected===null?'Frame all particles':'Frame selected assembly'} onClick={e=>{const box=e.currentTarget.closest('.canvas-wrap')!.getBoundingClientRect();onFrame(frameParticles(sim.current,box.width,box.height,selected))}}><Scan size={17}/></button>
}

export function ChamberFullscreen(){
 const button=useRef<HTMLButtonElement>(null)
 const [expanded,setExpanded]=useState(false),[error,setError]=useState('')
 useEffect(()=>{const update=()=>setExpanded(document.fullscreenElement===button.current?.closest('.viewport-panel'));document.addEventListener('fullscreenchange',update);return()=>document.removeEventListener('fullscreenchange',update)},[])
 return <><button ref={button} className="chamber-fullscreen" title={expanded?'Exit fullscreen':'Fullscreen chamber'} aria-label={expanded?'Exit fullscreen chamber':'Fullscreen chamber'} onClick={async()=>{
  setError('');try{if(expanded)await document.exitFullscreen();else await button.current?.closest('.viewport-panel')?.requestFullscreen()}catch{setError('Fullscreen is unavailable in this browser.')}
 }}>{expanded?<Minimize2 size={16}/>:<Maximize2 size={16}/>}<span>{expanded?'EXIT':'EXPAND'}</span></button>{error&&<span role="status" className="chamber-view-error">{error}</span>}</>
}

export function ParticleInspector({state,selected,onSelect}:{state:State;selected:number|null;onSelect:(id:number|null)=>void}){
 const p=state.particles.find(p=>p.id===selected),bonds=p?state.bonds.filter(b=>b.a===p.id||b.b===p.id):[]
 return <div className={`chamber-inspector ${p?'has-selection':''}`}>
  <label><span>INSPECT PARTICLE</span><select aria-label="Inspect particle" value={selected??''} onChange={e=>onSelect(e.target.value===''?null:Number(e.target.value))}><option value="">Select in the chamber</option>{state.particles.map(p=><option key={p.id} value={p.id}>{p.type?'B':'A'}{String(p.id+1).padStart(2,'0')} · particle {p.id+1}</option>)}</select></label>
  {p?<><div className="particle-readings"><span><small>POSITION</small><b>{p.x.toFixed(2)}, {p.y.toFixed(2)}</b></span><span><small>CONNECTIONS</small><b>{bonds.length} / 2</b></span><span><small>PAIRING</small><b>{bonds.some(b=>!b.correct)?'Unintended link':bonds.length?'Compatible':'Unbound'}</b></span></div><button className="clear-particle" aria-label="Clear particle selection" onClick={()=>onSelect(null)}><X size={15}/></button></>:<p>Choose a particle to follow its position and connections.</p>}
 </div>
}
