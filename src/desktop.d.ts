type DesktopUpdateState = {
  status:'idle'|'checking'|'current'|'available'|'downloading'|'verifying'|'ready'|'error'
  version:string
  availableVersion:string|null
  progress:number
  message:string
  packaged:boolean
}
interface Window {
  matterforgeDesktop?: {
    state:()=>Promise<DesktopUpdateState>
    check:()=>Promise<DesktopUpdateState>
    download:()=>Promise<DesktopUpdateState>
    install:()=>Promise<DesktopUpdateState>
    project:()=>Promise<void>
    subscribe:(callback:(state:DesktopUpdateState)=>void)=>()=>void
  }
}
