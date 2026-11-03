import {useEffect,useRef,useState} from 'react'
import {flushSync} from 'react-dom'

export function useCinematicMotion() {
 const [enabled,setEnabled]=useState(()=>{try{return localStorage.getItem('matterforge-motion')!=='off'}catch{return true}})
 const [reduced,setReduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches)
 const transition=useRef<ViewTransition|null>(null)
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(media.matches);media.addEventListener('change',update);return()=>media.removeEventListener('change',update)},[])
 const active=enabled&&!reduced
 useEffect(()=>{document.documentElement.dataset.motion=active?'full':'reduced';if(!active)transition.current?.skipTransition()},[active])
 const toggle=()=>{setEnabled(value=>{try{localStorage.setItem('matterforge-motion',value?'off':'on')}catch{/* Motion remains usable without storage. */}return !value})}
 const navigate=(update:()=>void)=>{
  transition.current?.skipTransition()
  if(!active||!document.startViewTransition){update();return}
  transition.current=document.startViewTransition(()=>flushSync(update))
  void transition.current.finished.catch(()=>{/* A newer navigation can supersede this one. */})
 }
 return {active,reduced,toggle,navigate}
}

