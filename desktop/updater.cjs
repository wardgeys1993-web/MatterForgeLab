const {readFileSync} = require('node:fs')
const path = require('node:path')
const {REPOSITORY, verifyManifest, verifyInstaller, validateFeed} = require('./release-verification.cjs')

class DesktopUpdater {
  constructor(updater, {version, packaged, onChange, fetchManifest}) {
    this.updater = updater
    this.onChange = onChange
    this.packaged = packaged
    this.fetchManifest = fetchManifest || (async version => {
      const response = await fetch(`https://github.com/${REPOSITORY}/releases/download/v${version}/release-manifest.json`, {signal: AbortSignal.timeout(20000), headers: {'User-Agent':'MatterForgeLab'}})
      if (!response.ok) throw new Error('Release manifest unavailable.')
      const reader = response.body.getReader()
      const chunks = []; let size = 0
      for (;;) {
        const item = await reader.read(); if (item.done) break
        size += item.value.length
        if (size > 24000) { await reader.cancel(); throw new Error('Release manifest too large.') }
        chunks.push(Buffer.from(item.value))
      }
      return JSON.parse(Buffer.concat(chunks).toString('utf8'))
    })
    this.publicKey = readFileSync(path.join(__dirname, 'release-public-key.pem'), 'utf8')
    this.state = {status:'idle', version, availableVersion:null, progress:0, message:'Check GitHub when you are ready.', packaged}
    updater.autoDownload = false
    updater.autoInstallOnAppQuit = false
    updater.allowPrerelease = false
    updater.allowDowngrade = false
    updater.disableWebInstaller = true
    updater.logger = null
    updater.on('error', () => this.fail())
    updater.on('download-progress', progress => {
      if (this.state.status === 'downloading') this.set({progress:Math.min(100, Math.max(0, Math.round(progress.percent)))})
    })
  }
  set(patch) { this.state = {...this.state, ...patch}; this.onChange(this.state); return this.state }
  fail() { this.file = null; return this.set({status:'error', progress:0, message:'Could not verify or retrieve this update. Check your connection and try again. Your installed app is unchanged.'}) }
  async check() {
    if (this.busy || this.state.status === 'ready') return this.state
    if (!this.packaged) return this.set({status:'error', message:'Updates are available in the installed Windows app.'})
    this.busy = true; this.manifest = null; this.file = null
    this.set({status:'checking', availableVersion:null, progress:0, message:'Checking the public GitHub release...'})
    try {
      const result = await this.updater.checkForUpdates()
      if (!result || !result.isUpdateAvailable) return this.set({status:'current', message:'You have the latest stable release.'})
      const version = result.updateInfo.version
      if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Unexpected version.')
      this.manifest = verifyManifest(await this.fetchManifest(version), this.publicKey, version)
      validateFeed(result.updateInfo, this.manifest)
      return this.set({status:'available', availableVersion:version, message:`Version ${version} is available. Its release signature is verified.`})
    } catch { return this.fail() } finally { this.busy = false }
  }
  async download() {
    if (this.busy || this.state.status !== 'available' || !this.manifest) return this.state
    this.busy = true
    this.set({status:'downloading', progress:0, message:'Downloading the installer from GitHub...'})
    try {
      const files = await this.updater.downloadUpdate()
      if (!Array.isArray(files) || files.length !== 1) throw new Error('Unexpected download.')
      this.set({status:'verifying', message:'Checking the downloaded installer against the signed release...'})
      await verifyInstaller(files[0], this.manifest)
      this.file = files[0]
      return this.set({status:'ready', progress:100, message:'Verified and ready. Install whenever you are ready to restart.'})
    } catch { return this.fail() } finally { this.busy = false }
  }
  async install(confirm) {
    if (this.busy || this.state.status !== 'ready' || !this.file || !this.manifest) return this.state
    this.busy = true
    try {
      if (!(await confirm())) return this.state
      await verifyInstaller(this.file, this.manifest)
      this.updater.quitAndInstall(true, true)
      return this.state
    } catch { return this.fail() } finally { this.busy = false }
  }
}
module.exports = {DesktopUpdater}
