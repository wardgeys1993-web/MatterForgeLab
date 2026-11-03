import {Vector3} from 'three'
import {siteAngle,type Bond,type Particle,type State} from './simulation/engine'

// Model x/y map isometrically to the world x/z plane. Height is always zero.
export const PARTICLE_RADIUS=.44
export const modelPosition=(p:{x:number;y:number})=>new Vector3(p.x,0,p.y)
export function sitePosition(p:Particle,site:number,state:State){
 const angle=siteAngle(p,site,state.params.siteMode,state.params.siteSpread)
 return modelPosition(p).add(new Vector3(Math.cos(angle)*PARTICLE_RADIUS,0,Math.sin(angle)*PARTICLE_RADIUS))
}
export function bondEndpoints(state:State,bond:Bond){
 const a=state.particles[bond.a],b=state.particles[bond.b]
 return state.params.siteMode&&bond.siteA!==undefined&&bond.siteB!==undefined
  ?[sitePosition(a,bond.siteA,state),sitePosition(b,bond.siteB,state)] as const
  :[modelPosition(a),modelPosition(b)] as const
}
export function assemblyParticles(state:State,selected:number|null){
 if(selected===null)return state.particles
 const ids=new Set([selected])
 for(let pass=0;pass<state.particles.length;pass++)for(const b of state.bonds){if(ids.has(b.a))ids.add(b.b);if(ids.has(b.b))ids.add(b.a)}
 return state.particles.filter(p=>ids.has(p.id))
}
export type CameraAction='frame'|'reset'|'top'|'orbit'|'zoom-in'|'zoom-out'|'left'|'right'|'up'|'down'
