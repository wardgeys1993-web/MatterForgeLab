const {verify, createHash} = require('node:crypto')
const {createReadStream} = require('node:fs')
const {stat} = require('node:fs/promises')

const REPOSITORY = 'wardgeys1993-web/MatterForgeLab'
function verifyManifest(envelope, publicKey, version) {
  if (!/^\d+\.\d+\.\d+$/.test(version) || !envelope || typeof envelope.payload !== 'string' || typeof envelope.signature !== 'string' || envelope.payload.length > 16000) throw new Error('Invalid release manifest.')
  const payload = Buffer.from(envelope.payload, 'base64')
  if (!verify(null, payload, publicKey, Buffer.from(envelope.signature, 'base64'))) throw new Error('Release signature did not match.')
  const manifest = JSON.parse(payload.toString('utf8'))
  if (manifest.schema !== 1 || manifest.repository !== REPOSITORY || manifest.version !== version || manifest.platform !== 'win32-x64') throw new Error('Release identity did not match.')
  const asset = manifest.installer
  if (!asset || asset.name !== `MatterForge-Lab-Setup-${version}.exe` || !Number.isSafeInteger(asset.size) || asset.size < 1000000 || asset.size > 1000000000 || !/^[A-Za-z0-9+/]{86}==$/.test(asset.sha512)) throw new Error('Invalid installer record.')
  return manifest
}
async function verifyInstaller(file, manifest) {
  const info = await stat(file)
  if (!info.isFile() || info.size !== manifest.installer.size) throw new Error('Installer size did not match.')
  const hash = createHash('sha512')
  for await (const chunk of createReadStream(file)) hash.update(chunk)
  if (hash.digest('base64') !== manifest.installer.sha512) throw new Error('Installer checksum did not match.')
}
function validateFeed(info, manifest) {
  if (info.version !== manifest.version || !Array.isArray(info.files) || info.files.length !== 1) throw new Error('Unexpected update feed.')
  const file = info.files[0]
  if (file.url !== manifest.installer.name || file.sha512 !== manifest.installer.sha512 || file.size !== manifest.installer.size) throw new Error('Update feed does not match signed release.')
}
module.exports = {REPOSITORY, verifyManifest, verifyInstaller, validateFeed}
