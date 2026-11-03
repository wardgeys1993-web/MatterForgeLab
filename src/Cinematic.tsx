import {Clapperboard,Pause} from 'lucide-react'

/** Decorative assembly monogram. The adjacent wordmark supplies its name. */
export function ForgeMark({className=''}:{className?:string}) {
 return <svg className={`forge-mark ${className}`} viewBox="0 0 64 64" fill="none" aria-hidden="true">
  <path className="mark-frame" d="M32 5 55.4 18.5v27L32 59 8.6 45.5v-27Z"/>
  <path className="mark-fold" d="M15 42V22l17 20 17-20v20M15 22l17-10 17 10"/>
  <path className="mark-core" d="m32 24 6 8-6 8-6-8Z"/>
  <circle cx="15" cy="42" r="2.5"/><circle cx="49" cy="42" r="2.5"/>
 </svg>
}

export function AssemblyArtwork() {
 return <div className="assembly-artwork" aria-hidden="true">
  <picture><source srcSet="/visuals/assembly-hero-960.webp 960w, /visuals/assembly-hero.webp 1536w" sizes="(max-width: 760px) 100vw, 85vw" type="image/webp"/><img src="/visuals/assembly-hero.webp" alt="" fetchPriority="high" width="1536" height="1024"/></picture>
  <div className="assembly-vignette"/>
  <div className="assembly-reticle"><i/><span>01</span><i/></div>
  <div className="assembly-caption"><span className="caption-rule"/><span>ASSEMBLY STUDY 001<small>CONCEPTUAL ART</small></span></div>
 </div>
}

export function ChapterArtwork({page}:{page:string}) {
 if(page==='discover')return null
 const labels:Record<string,[string,string]>={lab:['02','THE EXPERIMENT'],research:['03','THE SEARCH'],learn:['04','THE FIELD GUIDE'],ladder:['05','THE POSSIBILITY']}
 const [number,label]=labels[page]??['01','DISCOVERY']
 return <div className={`chapter-artwork chapter-${page}`} aria-hidden="true">
  <img src="/visuals/lattice-atmosphere.webp" alt="" width="1536" height="732"/>
  <span>{number} <i/> {label}</span><ForgeMark/>
 </div>
}

export function StageGlyph({index}:{index:number}) {
 return <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className="stage-glyph">
  {index===0?<><circle cx="24" cy="24" r="15" opacity=".3"/><circle cx="24" cy="24" r="8"/><circle cx="24" cy="24" r="3" className="glyph-fill"/><circle cx="37" cy="16" r="2" className="glyph-fill"/></>:
   index===1?<><path d="m13 31 11-17 12 17H13Z"/><circle cx="13" cy="31" r="5"/><circle cx="24" cy="14" r="5"/><circle cx="36" cy="31" r="5"/></>:
   index===2?<><path d="m24 7 15 8v18l-15 8-15-8V15Z M9 15l15 9 15-9M24 24v17"/><circle cx="24" cy="24" r="3" className="glyph-fill"/></>:
   index===3?<><path d="m24 6 17 10-17 10L7 16ZM7 24l17 10 17-10M7 32l17 10 17-10"/></>:
   index===4?<><circle cx="24" cy="24" r="11"/><circle cx="24" cy="24" r="4"/><path d="M24 5v8m0 22v8M5 24h8m22 0h8M10.6 10.6l5.6 5.6m15.6 15.6 5.6 5.6M10.6 37.4l5.6-5.6m15.6-15.6 5.6-5.6"/></>:
   index===5?<><path d="M9 9h11v11H9ZM28 9h11v11H28ZM9 28h11v11H9ZM28 28h11v11H28ZM20 14h8M14 20v8m20-8v8m-14 6h8"/></>:
   <><path d="m24 5 6 13 13 6-13 6-6 13-6-13-13-6 13-6Z"/><path d="m24 15 3 6 6 3-6 3-3 6-3-6-6-3 6-3Z" opacity=".5"/></>}
 </svg>
}

export function MotionControl({active,reduced,onToggle}:{active:boolean;reduced:boolean;onToggle:()=>void}) {
 return <button className="motion-control" onClick={onToggle} aria-pressed={active} disabled={reduced} aria-label={reduced?'Cinematic motion disabled by system preference':'Cinematic motion'} title={reduced?'Your system requests reduced motion':active?'Pause decorative motion':'Enable cinematic motion'}>
  {active?<Clapperboard size={15}/>:<Pause size={15}/>}<span>MOTION {active?'ON':'OFF'}</span>
 </button>
}
