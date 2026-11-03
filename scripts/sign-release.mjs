import {readFile,writeFile,stat} from 'node:fs/promises'
import {createReadStream} from 'node:fs'
import {createHash,sign,createPublicKey} from 'node:crypto'
import path from 'node:path'
const pkg=JSON.parse(await readFile('package.json','utf8'))
const keyPath=process.env.MATTERFORGE_SIGNING_KEY_FILE
if(!keyPath)throw new Error('Set MATTERFORGE_SIGNING_KEY_FILE to the private key stored outside this repository.')
const key=await readFile(keyPath)
const publicKey=await readFile('desktop/release-public-key.pem','utf8')
if(createPublicKey(key).export({type:'spki',format:'pem'})!==publicKey)throw new Error('Signing key does not match the app public key.')
const name=`MatterForge-Lab-Setup-${pkg.version}.exe`,file=path.join('release',name)
const hash=createHash('sha512');for await(const chunk of createReadStream(file))hash.update(chunk)
const manifest={schema:1,repository:'wardgeys1993-web/MatterForgeLab',version:pkg.version,platform:'win32-x64',installer:{name,size:(await stat(file)).size,sha512:hash.digest('base64')}}
const payload=Buffer.from(JSON.stringify(manifest))
await writeFile('release/release-manifest.json',JSON.stringify({payload:payload.toString('base64'),signature:sign(null,payload,key).toString('base64')},null,2)+'\n','utf8')
const sha256=createHash('sha256');for await(const chunk of createReadStream(file))sha256.update(chunk)
await writeFile('release/SHA256SUMS.txt',`${sha256.digest('hex')}  ${name}\n`,'utf8')
console.log(`Signed release ${pkg.version}. No private key is included in the release.`)
