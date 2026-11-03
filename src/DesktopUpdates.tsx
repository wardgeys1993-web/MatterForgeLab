import {useEffect,useRef,useState} from 'react'
import {ArrowDownToLine,CheckCircle2,ExternalLink,RefreshCw,ShieldCheck,X} from 'lucide-react'
import packageInfo from '../package.json'
import './desktop.css'

export default function DesktopUpdates(){
 const api=window.matterforgeDesktop
 const dialog=useRef<HTMLDialogElement>(null)
 const [state,setState]=useState<DesktopUpdateState>({status:'idle',version:packageInfo.version,availableVersion:null,progress:0,message:'Check GitHub when you are ready.',packaged:false})
 const [error,setError]=useState('')
 useEffect(()=>{if(!api)return;let active=true;void api.state().then(s=>{if(active)setState(s)}).catch(()=>{if(active)setError('The update service is unavailable. Restart the app and try again.')});const unsubscribe=api.subscribe(setState);return()=>{active=false;unsubscribe()}},[api])
 const act=async(action:()=>Promise<DesktopUpdateState>)=>{setError('');try{setState(await action())}catch{setError('The update service is unavailable. Restart the app and try again.')}}
 const busy=['checking','downloading','verifying'].includes(state.status)
 return <><button className="desktop-update-trigger" onClick={()=>dialog.current?.showModal()} aria-label="App updates"><ArrowDownToLine size={16}/><span>APP UPDATES</span>{state.status==='ready'&&<i/>}</button>
 <dialog ref={dialog} className="desktop-update-dialog" aria-labelledby="desktop-update-title" onClick={event=>{if(event.target===dialog.current)dialog.current?.close()}}>
  <div className="desktop-update-card"><button className="desktop-update-close" aria-label="Close app updates" onClick={()=>dialog.current?.close()}><X size={20}/></button>
   <div className="desktop-update-emblem"><ShieldCheck size={30}/></div><div className="eyebrow">MATTERFORGE LAB / DESKTOP</div><h2 id="desktop-update-title">A little more<br/><em>possibility.</em></h2><p className="desktop-update-intro">Keep your laboratory up to date, at your own pace.</p>
   <div className="desktop-update-version"><span>INSTALLED VERSION</span><b>{state.version}</b><span>WINDOWS 64-BIT</span></div>
   <div className={`desktop-update-status ${state.status}`} role="status" aria-live="polite">{state.status==='current'||state.status==='ready'?<CheckCircle2 size={19}/>:<ShieldCheck size={19}/>}<p>{api?error||state.message:'Desktop updates are available in the installed Windows app. Download it from GitHub.'}</p></div>
   {state.status==='downloading'&&<div className="desktop-progress"><progress max={100} value={state.progress} aria-label="Update download progress"/><span>{state.progress}%</span></div>}
   <div className="desktop-update-actions">{api?(state.status==='ready'?<button className="primary" onClick={()=>void act(api.install)}><RefreshCw size={16}/> RESTART AND INSTALL</button>:state.status==='available'?<button className="primary" onClick={()=>void act(api.download)}><ArrowDownToLine size={16}/> DOWNLOAD {state.availableVersion}</button>:<button className="primary" disabled={busy} onClick={()=>void act(api.check)}><RefreshCw size={16} className={busy?'desktop-spin':''}/>{busy?'PLEASE WAIT':'CHECK FOR UPDATES'}</button>):<a className="primary" href="https://github.com/wardgeys1993-web/MatterForgeLab/releases/latest" target="_blank" rel="noreferrer">GET THE WINDOWS APP <ExternalLink size={16}/></a>}
   <a href="https://github.com/wardgeys1993-web/MatterForgeLab/releases" target="_blank" rel="noreferrer">Release notes <ExternalLink size={14}/></a></div>
   <div className="desktop-update-privacy"><ShieldCheck size={16}/><p>Experiments stay on this computer. Update checks contact GitHub only when you choose. No account or tracking.</p></div>
  </div>
 </dialog></>
}
