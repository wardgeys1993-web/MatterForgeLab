const {test} = require('node:test')
const assert = require('node:assert/strict')
const {EventEmitter} = require('node:events')
const {generateKeyPairSync, sign, createHash} = require('node:crypto')
const {mkdtemp, writeFile, rm} = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const {verifyManifest, verifyInstaller, validateFeed} = require('../desktop/release-verification.cjs')
const {DesktopUpdater} = require('../desktop/updater.cjs')
const keys = generateKeyPairSync('ed25519')
const bytes = Buffer.alloc(1000001, 42)
const manifest = {schema:1, repository:'wardgeys1993-web/MatterForgeLab', version:'0.8.0', platform:'win32-x64', installer:{name:'MatterForge-Lab-Setup-0.8.0.exe',size:bytes.length,sha512:createHash('sha512').update(bytes).digest('base64')}}
const envelope = value => { const payload = Buffer.from(JSON.stringify(value)); return {payload:payload.toString('base64'),signature:sign(null,payload,keys.privateKey).toString('base64')} }
const info = {version:manifest.version,files:[{url:manifest.installer.name,sha512:manifest.installer.sha512,size:manifest.installer.size}]}
test('release signature binds repository, platform, version and installer', () => {
  assert.deepEqual(verifyManifest(envelope(manifest),keys.publicKey,'0.8.0'),manifest)
  assert.throws(()=>verifyManifest(envelope(manifest),keys.publicKey,'0.9.0'))
  assert.throws(()=>verifyManifest(envelope({...manifest,repository:'someone/else'}),keys.publicKey,'0.8.0'))
  assert.throws(()=>verifyManifest(envelope({...manifest,platform:'other'}),keys.publicKey,'0.8.0'))
  assert.throws(()=>verifyManifest(envelope({...manifest,installer:{...manifest.installer,name:'../attack.exe'}}),keys.publicKey,'0.8.0'))
  assert.throws(()=>verifyManifest({...envelope(manifest),signature:Buffer.alloc(64).toString('base64')},keys.publicKey,'0.8.0'))
  assert.throws(()=>verifyManifest(envelope(manifest),generateKeyPairSync('ed25519').publicKey,'0.8.0'))
})
test('feed must match signed installer and cannot substitute a remote URL', () => {
  validateFeed(info,manifest)
  assert.throws(()=>validateFeed({...info,files:[{...info.files[0],url:'https://example.com/installer.exe'}]},manifest))
  assert.throws(()=>validateFeed({...info,files:[{...info.files[0],sha512:'bad'}]},manifest))
  assert.throws(()=>validateFeed({...info,files:[...info.files,...info.files]},manifest))
})
test('download verification rejects size and same-size content tampering', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(),'matterforge-verification-'))
  try {
    const file = path.join(dir,'installer.exe')
    await writeFile(file,bytes);await verifyInstaller(file,manifest)
    await writeFile(file,Buffer.alloc(bytes.length,43));await assert.rejects(verifyInstaller(file,manifest))
    await writeFile(file,'truncated');await assert.rejects(verifyInstaller(file,manifest))
  } finally { await rm(dir,{recursive:true,force:true}) }
})
function mockUpdater() {
  const updater = new EventEmitter()
  updater.checkForUpdates = async()=>({isUpdateAvailable:true,updateInfo:info})
  updater.quitAndInstall = (...args)=>{updater.installs=(updater.installs||0)+1;updater.installArgs=args}
  const controller = new DesktopUpdater(updater,{version:'0.7.0',packaged:true,onChange:()=>{},fetchManifest:async()=>envelope(manifest)})
  controller.publicKey = keys.publicKey
  return {updater,controller}
}
test('manual update flow verifies before ready and rechecks before installation', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(),'matterforge-flow-'))
  try {
    const file=path.join(dir,'installer.exe');await writeFile(file,bytes)
    const {updater,controller}=mockUpdater();updater.downloadUpdate=async()=>[file]
    assert.equal(updater.autoDownload,false);assert.equal(updater.autoInstallOnAppQuit,false)
    await controller.install(async()=>true);assert.equal(updater.installs,undefined)
    assert.equal((await controller.check()).status,'available')
    assert.equal((await controller.download()).status,'ready')
    await controller.install(async()=>false);assert.equal(updater.installs,undefined)
    await controller.install(async()=>true);assert.equal(updater.installs,1);assert.deepEqual(updater.installArgs,[true,true])
    await writeFile(file,Buffer.alloc(bytes.length,1))
    assert.equal((await controller.install(async()=>true)).status,'error');assert.equal(updater.installs,1)
  } finally { await rm(dir,{recursive:true,force:true}) }
})
test('invalid signatures and network errors fail closed without leaking error details', async () => {
  const {updater,controller}=mockUpdater()
  controller.fetchManifest=async()=>({...envelope(manifest),signature:''})
  assert.equal((await controller.check()).status,'error')
  await controller.install(async()=>true);assert.equal(updater.installs,undefined)
  updater.checkForUpdates=async()=>{throw new Error('Sensitive local details')}
  assert.equal((await controller.check()).status,'error');assert(!controller.state.message.includes('Sensitive'))
})
test('current version, development build and concurrent checks are handled', async () => {
  const {updater,controller}=mockUpdater()
  updater.checkForUpdates=async()=>({isUpdateAvailable:false,updateInfo:info})
  assert.equal((await controller.check()).status,'current')
  controller.packaged=false;assert.equal((await controller.check()).status,'error')
  controller.packaged=true
  let finish, calls=0
  updater.checkForUpdates=()=>{calls++;return new Promise(resolve=>{finish=resolve})}
  const pending=controller.check();await controller.check();assert.equal(calls,1)
  finish({isUpdateAvailable:false,updateInfo:info});await pending
})
