import fs from 'node:fs'
import path from 'node:path'
import {execFileSync} from 'node:child_process'
const roots=['src','public','docs','scripts','tests','desktop','desktop-tests','.github']
const rootFiles=['.gitignore','.oxlintrc.json','AGENTS.md','LICENSE','README.md','ROADMAP.md','SECURITY.md','index.html','package.json','package-lock.json','playwright.config.js','tsconfig.app.json','tsconfig.json','tsconfig.node.json','vite.config.ts','electron-builder.yml']
const blocked=/(^|\/)(?:\.Codex|\.codex|\.claude|\.cursor|node_modules|release|dist|test-results|playwright-report|coverage|originals)(\/|$)|(?:^|\/)\.env(?:\.|$)|\.(?:key|pfx|p12|log|map)$/i
const patterns=[
 ['private key',new RegExp('BEGIN [A-Z ]*'+'PRIVATE KEY')],
 ['GitHub credential',new RegExp('(?:gh[pousr]_'+'[A-Za-z0-9]{30,}|github_pat_'+'[A-Za-z0-9_]{30,})')],
 ['API credential',new RegExp('sk-'+'(?:proj-)?[A-Za-z0-9_-]{24,}')],
 ['AWS credential',new RegExp('AKIA'+'[A-Z0-9]{16}')],
 ['personal machine path',/[A-Za-z]:[\\/]{1,2}Users[\\/]{1,2}[A-Za-z0-9_. -]+|\/Users\/[A-Za-z0-9_.-]+/],
 ['personal mailbox',/[A-Z0-9._%+-]+@(?:gmail|hotmail|outlook|live|protonmail)\.[A-Z]{2,}/i],
 ['credential in URL',/https?:\/\/[^/\s:@]+:[^/\s@]+@/]
]
function walk(dir){return fs.existsSync(dir)?fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${dir}/${e.name}`):[`${dir}/${e.name}`]):[]}
let files
if(fs.existsSync('.git')) files=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean)
else files=[...rootFiles.filter(f=>fs.existsSync(f)),...roots.flatMap(walk).filter(f=>!blocked.test(f))]
if(!files.length)throw new Error('No public files to inspect.')
const findings=[]
for(const file of files){
 if(blocked.test(file)||(!roots.some(root=>file.startsWith(root+'/'))&&!rootFiles.includes(file)))findings.push(`${file}: outside the public file allowlist`)
 if(file.endsWith('.pem')&&file!=='desktop/release-public-key.pem')findings.push(`${file}: unexpected key file`)
 const absolute=path.resolve(file);if(fs.lstatSync(absolute).isSymbolicLink()){findings.push(`${file}: symbolic link`);continue}
 if(/\.(png|webp|ico|woff2|jpe?g)$/i.test(file))continue
 let content=fs.readFileSync(absolute,'utf8')
 // This exact non-working fixture verifies rejection of URL credentials.
 if(file==='src/research/localAI.test.ts')content=content.replace(['http:','','user:pass@localhost:11434','v1','chat','completions'].join('/'),'redacted-test-fixture')
 for(const [label,pattern] of patterns)if(pattern.test(content))findings.push(`${file}: ${label}`)
}
if(findings.length){console.error(findings.join('\n'));process.exitCode=1}else console.log(`Privacy check passed for ${files.length} allowlisted files. Local data and build output are excluded. Review media and commit identity separately.`)
