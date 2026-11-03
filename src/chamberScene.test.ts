import {describe,it,expect} from 'vitest'
import {createState,defaults,step} from './simulation/engine'
import {cameraFrame,particleAt,frameParticles,TrailHistory,TRAIL_DURATION} from './chamberScene'

describe('chamber presentation preserves model coordinates',()=>{
 it('picks the same particle after pan, zoom and responsive resizing',()=>{
  const state=createState(),p=state.particles[0]
  for(const [width,height]of [[320,390],[800,560],[1440,800]])for(const zoom of [.6,1,2]){
   const view={zoom,x:42,y:-18},f=cameraFrame(width,height,view)
   expect(particleAt(state,f.ox+p.x*f.scale,f.oy+p.y*f.scale,width,height,view)).toBe(p.id)
  }
 })
 it('selects the nearest particle in an overlapping hit area',()=>{
  const state=createState({...defaults,count:6});state.particles[0].x=0;state.particles[0].y=0;state.particles[1].x=.15;state.particles[1].y=0
  expect(particleAt(state,400,280,800,560,{zoom:1,x:0,y:0})).toBe(0)
 })
 it('frames the selected connected component without moving particles',()=>{
  const state=createState(),before=JSON.stringify(state)
  state.bonds=[{a:0,b:1,correct:true},{a:1,b:2,correct:true}]
  const saved=JSON.stringify(state),view=frameParticles(state,800,560,0),f=cameraFrame(800,560,view)
  for(const p of state.particles.slice(0,3)){expect(f.ox+p.x*f.scale).toBeGreaterThan(20);expect(f.ox+p.x*f.scale).toBeLessThan(780);expect(f.oy+p.y*f.scale).toBeGreaterThan(20);expect(f.oy+p.y*f.scale).toBeLessThan(540)}
  expect(JSON.stringify(state)).toBe(saved);expect(saved).not.toBe(before)
 })
 it('does not add paused-frame samples or mutate simulation data',()=>{
  const state=createState(),history=new TrailHistory(),before=JSON.stringify(state)
  for(let frame=0;frame<120;frame++)history.update(state,true)
  expect(history.points.get(0)).toHaveLength(1);expect(JSON.stringify(state)).toBe(before)
  step(state);history.update(state,true)
  expect(history.points.get(0)).toHaveLength(2)
  expect(history.points.get(0)![1]).toEqual({x:state.particles[0].x,y:state.particles[0].y,time:state.time})
 })
 it('keeps a bounded time history and clears it on restore, rewind and toggle',()=>{
  const state=createState(),history=new TrailHistory()
  for(let i=0;i<500;i++){step(state);history.update(state,true)}
  const points=history.points.get(0)!
  expect(points.length).toBeLessThanOrEqual(96);expect(points[0].time).toBeGreaterThanOrEqual(state.time-TRAIL_DURATION)
  const restored=structuredClone(state);history.update(restored,true);expect(history.points.get(0)).toHaveLength(1)
  restored.time=0;history.update(restored,true);expect(history.points.get(0)![0].time).toBe(0)
  history.update(restored,false);expect(history.points.size).toBe(0)
 })
})
