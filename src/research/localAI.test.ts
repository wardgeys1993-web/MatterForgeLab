import {afterEach,describe,expect,it,vi} from 'vitest'
import {LocalChatExplainer} from './localAI'

afterEach(()=>vi.unstubAllGlobals())
describe('optional local research explainer',()=>{
 it('sends only bounded evidence to an explicitly configured loopback adapter',async()=>{const fetcher=vi.fn(async()=>new Response(JSON.stringify({choices:[{message:{content:'A model explanation.'}}]}),{status:200}));vi.stubGlobal('fetch',fetcher);const answer=await new LocalChatExplainer().run({endpoint:'http://127.0.0.1:11434/v1/chat/completions',model:'local-model',mode:'explain',evidence:'Measured results'});expect(answer).toBe('A model explanation.');const [url,options]=fetcher.mock.calls[0] as unknown as [string,RequestInit];expect(url).toBe('http://127.0.0.1:11434/v1/chat/completions');expect(options.credentials).toBe('omit');expect(options.redirect).toBe('error');expect(String(options.body)).toContain('Measured results')})
 it('rejects remote, credentialed and unexpected endpoints before making a request',async()=>{const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);for(const endpoint of ['https://example.com/v1/chat/completions','http://user:pass@localhost:11434/v1/chat/completions','http://127.0.0.1:11434/other'])await expect(new LocalChatExplainer().run({endpoint,model:'model',mode:'explain',evidence:'x'})).rejects.toThrow();expect(fetcher).not.toHaveBeenCalled()})
 it('reports a disconnected local server without affecting the deterministic engine',async()=>{vi.stubGlobal('fetch',vi.fn(async()=>{throw new TypeError('offline')}));await expect(new LocalChatExplainer().run({endpoint:'http://127.0.0.1:11434/v1/chat/completions',model:'model',mode:'hypotheses',evidence:'x'})).rejects.toThrow(/unavailable/)} )
})
