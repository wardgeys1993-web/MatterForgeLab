import type {Params} from './engine'
export type SiteSetting='siteType0'|'siteType1'|'siteMask'
export function siteMaskName(mask:number){return ([[1,'1 + 1'],[2,'1 + 2'],[4,'2 + 2']] as const).filter(([bit])=>(mask&bit)!==0).map(([,name])=>name).join(', ')||'none'}
export function describeSiteRules(p:Params,omit?:string){if(!p.siteMode)return 'site types inactive in any-direction mode';const fields=[omit==='siteType0'?'':`first site type ${p.siteType0+1}`,omit==='siteType1'?'':`second site type ${p.siteType1+1}`,omit==='siteMask'?'':`allowed site pairs ${siteMaskName(p.siteMask)}`].filter(Boolean);return fields.length?fields.join(', '):'site settings selected for comparison'}
