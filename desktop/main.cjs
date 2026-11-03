const {app, BrowserWindow, ipcMain, protocol, net, session, shell, Menu, dialog} = require('electron')
const {autoUpdater} = require('electron-updater')
const path = require('node:path')
const {pathToFileURL} = require('node:url')
const {DesktopUpdater} = require('./updater.cjs')
const {allowFullscreen} = require('./permissions.cjs')

const APP_URL = 'app://matterforge/'
const PROJECT_URL = 'https://github.com/wardgeys1993-web/MatterForgeLab'
const externalHosts = new Set(['github.com','goldbook.iupac.org','openstax.org','www.energy.gov','www.genome.gov','www.nature.com','www.ncbi.nlm.nih.gov','www.nist.gov','www.nobelprize.org'])
protocol.registerSchemesAsPrivileged([{scheme:'app', privileges:{standard:true, secure:true, supportFetchAPI:true, corsEnabled:true}}])
app.setAppUserModelId('org.matterforgelab.desktop')
if (!app.requestSingleInstanceLock()) app.quit()
else {
  let window, updater
  const isApp = value => { try { const url = new URL(value); return url.protocol === 'app:' && url.hostname === 'matterforge' } catch { return false } }
  const openExternal = value => {
    try { const url = new URL(value); if (url.protocol === 'https:' && !url.username && !url.password && externalHosts.has(url.hostname)) void shell.openExternal(url.href) } catch { /* Ignore unsupported links. */ }
  }
  app.on('second-instance', () => { if (window) { if (window.isMinimized()) window.restore(); window.focus() } })
  app.whenReady().then(async () => {
    const root = path.join(app.getAppPath(), 'dist')
    protocol.handle('app', request => {
      const url = new URL(request.url)
      if (!isApp(request.url) || !['GET','HEAD'].includes(request.method)) return new Response('Not found', {status:404})
      let decoded
      try { decoded = decodeURIComponent(url.pathname) } catch { return new Response('Invalid path', {status:400}) }
      const file = path.resolve(root, `.${decoded === '/' ? '/index.html' : decoded}`)
      if (!file.startsWith(root + path.sep)) return new Response('Forbidden', {status:403})
      return net.fetch(pathToFileURL(file).href)
    })
    session.defaultSession.setPermissionRequestHandler((contents, permission, callback, details) => callback(allowFullscreen(window, contents, permission, details)))
    session.defaultSession.setPermissionCheckHandler((contents, permission, _origin, details) => allowFullscreen(window, contents, permission, details))
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      const headers = {...details.responseHeaders}
      if (isApp(details.url)) headers['Content-Security-Policy'] = ["default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' http://127.0.0.1:* http://localhost:* http://[::1]:*; worker-src 'self'; object-src 'none'; base-uri 'none'; frame-src 'none'; form-action 'none'"]
      callback({responseHeaders:headers})
    })
    updater = new DesktopUpdater(autoUpdater, {version:app.getVersion(), packaged:app.isPackaged, onChange:state => { if (window && !window.isDestroyed()) window.webContents.send('desktop:update-state', state) }})
    const handle = (name, action) => ipcMain.handle(name, (event) => {
      if (!window || event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame || !isApp(event.senderFrame.url)) throw new Error('Untrusted sender.')
      return action()
    })
    handle('desktop:state', () => updater.state)
    handle('desktop:check', () => updater.check())
    handle('desktop:download', () => updater.download())
    handle('desktop:install', () => updater.install(async () => {
      const result = await dialog.showMessageBox(window, {type:'question', title:'Install MatterForge Lab update', message:'Restart to install the verified update?', detail:'Your saved experiments and settings stay on this computer. Pause active research first to preserve the current partial trial. Otherwise research resumes from its last completed checkpoint.', buttons:['Keep working','Restart and install'], defaultId:0, cancelId:0, noLink:true})
      return result.response === 1
    }))
    handle('desktop:project', () => shell.openExternal(PROJECT_URL))
    Menu.setApplicationMenu(null)
    window = new BrowserWindow({width:1440,height:960,minWidth:880,minHeight:640,title:'MatterForge Lab',backgroundColor:'#080f13',show:false,icon:path.join(__dirname,'icon.png'),webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true,webviewTag:false,spellcheck:false}})
    window.webContents.setWindowOpenHandler(({url}) => { openExternal(url); return {action:'deny'} })
    window.webContents.on('will-navigate', (event, url) => { if (!isApp(url)) { event.preventDefault(); openExternal(url) } })
    window.webContents.on('will-attach-webview', event => event.preventDefault())
    window.once('ready-to-show', () => window.show())
    await window.loadURL(APP_URL)
  }).catch(() => { dialog.showErrorBox('MatterForge Lab could not start','Please reinstall MatterForge Lab from its official GitHub release. Your saved data is kept separately.'); app.quit() })
  app.on('window-all-closed', () => app.quit())
}
