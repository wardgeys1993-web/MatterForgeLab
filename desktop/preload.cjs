const {contextBridge, ipcRenderer} = require('electron')
contextBridge.exposeInMainWorld('matterforgeDesktop', {
  state: () => ipcRenderer.invoke('desktop:state'),
  check: () => ipcRenderer.invoke('desktop:check'),
  download: () => ipcRenderer.invoke('desktop:download'),
  install: () => ipcRenderer.invoke('desktop:install'),
  project: () => ipcRenderer.invoke('desktop:project'),
  subscribe: callback => {
    const handler = (_event, state) => callback(state)
    ipcRenderer.on('desktop:update-state', handler)
    return () => ipcRenderer.removeListener('desktop:update-state', handler)
  }
})
