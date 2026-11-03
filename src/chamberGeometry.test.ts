import {describe,it,expect} from 'vitest'
import {createState,defaults,siteAngle} from './simulation/engine'
import {assemblyParticles,bondEndpoints,modelPosition,PARTICLE_RADIUS,sitePosition} from './chamberGeometry'

describe('3D view preserves the planar teaching model',()=>{
 it('preserves every pair distance and gives no particle invented height',()=>{
  const state=createState(),before=JSON.stringify(state)
  for(const a of state.particles){expect(modelPosition(a).y).toBe(0);for(const b of state.particles)expect(modelPosition(a).distanceTo(modelPosition(b))).toBeCloseTo(Math.hypot(a.x-b.x,a.y-b.y),12)}
  expect(JSON.stringify(state)).toBe(before)
 })
 it('preserves directional site orientations and radius at each supported spread',()=>{
  for(const mode of [1,2,3])for(const spread of [30,90,120,180]){
   const state=createState({...defaults,siteMode:mode,siteSpread:spread})
   for(const p of state.particles)for(const site of [0,1]){const delta=sitePosition(p,site,state).sub(modelPosition(p)),angle=siteAngle(p,site,mode,spread)
    expect(delta.y).toBe(0);expect(delta.length()).toBeCloseTo(PARTICLE_RADIUS,12);expect(delta.x/PARTICLE_RADIUS).toBeCloseTo(Math.cos(angle),12);expect(delta.z/PARTICLE_RADIUS).toBeCloseTo(Math.sin(angle),12)
   }
  }
 })
 it('connects the recorded sites for both compatible and unintended links without mutation',()=>{
  const state=createState({...defaults,siteMode:2}),before=JSON.stringify(state)
  for(const correct of [true,false]){const bond={a:0,b:1,siteA:1,siteB:0,correct};const [a,b]=bondEndpoints(state,bond);expect(a.equals(sitePosition(state.particles[0],1,state))).toBe(true);expect(b.equals(sitePosition(state.particles[1],0,state))).toBe(true)}
  expect(JSON.stringify(state)).toBe(before)
 })
 it('uses recorded centers in isotropic mode and includes actual unintended connections in framing',()=>{
  const state=createState();state.bonds=[{a:0,b:1,correct:true},{a:1,b:3,correct:false}]
  const before=JSON.stringify(state),[a,b]=bondEndpoints(state,state.bonds[0])
  expect(a.equals(modelPosition(state.particles[0]))).toBe(true);expect(b.equals(modelPosition(state.particles[1]))).toBe(true)
  expect(assemblyParticles(state,0).map(p=>p.id)).toEqual([0,1,3]);expect(assemblyParticles(state,null)).toHaveLength(state.particles.length);expect(JSON.stringify(state)).toBe(before)
 })
})
