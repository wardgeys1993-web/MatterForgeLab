import * as THREE from 'three'
import {OrbitControls} from 'three/addons/controls/OrbitControls.js'
import {TrailHistory,TRAIL_DURATION} from './chamberScene'
import {assemblyParticles,bondEndpoints,modelPosition,PARTICLE_RADIUS,sitePosition,type CameraAction} from './chamberGeometry'
import {satinFinish,studioLighting} from './chamberLighting'
import type {State} from './simulation/engine'

export type ViewOptions={selected:number|null;hovered:number|null;highlight:number[];forces:boolean;trails:boolean;labels:boolean}
const UP=new THREE.Vector3(0,1,0),INK='#09151c',COLORS=[0x83cbb9,0xd5b474]
const ORBIT=new THREE.Vector3(.42,.86,.58).normalize()
type ParticleObject={body:THREE.Mesh;ports:THREE.Mesh[];rims:THREE.Mesh[];ring:THREE.Mesh;letter:THREE.Sprite}
type Flight={from:THREE.Vector3;to:THREE.Vector3;targetFrom:THREE.Vector3;targetTo:THREE.Vector3;started:number}

/** A 3D presentation of the unchanged planar model. No fabricated height or bonds. */
export class Chamber3DScene {
 readonly renderer:THREE.WebGLRenderer
 readonly camera=new THREE.PerspectiveCamera(38,1,.1,180)
 readonly scene=new THREE.Scene()
 readonly controls:OrbitControls
 private overlay:HTMLCanvasElement
 private ctx:CanvasRenderingContext2D
 private resources=new Set<{dispose:()=>void}>()
 private bodies:ParticleObject[]=[]
 private bondMeshes:THREE.Mesh[]=[]
 private occupied=new Set<string>()
 private raycaster=new THREE.Raycaster()
 private trails=new TrailHistory()
 private boundary:THREE.LineLoop
 private floor:THREE.Mesh
 private grid:THREE.LineSegments<THREE.BufferGeometry,THREE.LineBasicMaterial>
 private range:THREE.Mesh[]=[]
 private forceArrows:THREE.ArrowHelper[]=[]
 private trailLines:THREE.LineSegments
 private trailPositions=new Float32Array(30*95*6)
 private trailColors=new Float32Array(30*95*6)
 private sphere:THREE.SphereGeometry
 private cylinder:THREE.CylinderGeometry
 private portSphere:THREE.SphereGeometry
 private portDiamond:THREE.OctahedronGeometry
 private ringGeometry:THREE.TorusGeometry
 private materials:THREE.MeshStandardMaterial[]
 private portMaterials:THREE.MeshStandardMaterial[]
 private bondMaterials:THREE.MeshStandardMaterial[]
 private ringMaterials:THREE.MeshBasicMaterial[]
 private rimMaterial:THREE.MeshStandardMaterial
 private letterMaterials:THREE.SpriteMaterial[]
 private width=0
 private height=0
 private dpr=1
 private flight:Flight|null=null
 private dirty=true
 private lastState:State|null=null
 private lastTime=-1
 private lastOptions=''
 private lastBound=-1
 private lastCamera=new THREE.Matrix4()
 private options:ViewOptions={selected:null,hovered:null,highlight:[],forces:false,trails:false,labels:false}
 private onControlStart=()=>{this.flight=null}
 private onControlChange=()=>{this.dirty=true}

 constructor(canvas:HTMLCanvasElement,overlay:HTMLCanvasElement){
  this.overlay=overlay;this.ctx=overlay.getContext('2d')!
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'})
  this.renderer.setClearColor(INK);this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,2))
  this.renderer.outputColorSpace=THREE.SRGBColorSpace
  this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.1
  this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap
  this.scene.fog=new THREE.Fog(INK,42,90)
  this.camera.position.copy(ORBIT).multiplyScalar(26)
  this.controls=new OrbitControls(this.camera,canvas)
  this.controls.enableDamping=true;this.controls.dampingFactor=.085
  this.controls.minDistance=2;this.controls.maxDistance=75
  this.controls.minPolarAngle=.015;this.controls.maxPolarAngle=Math.PI/2-.06
  this.controls.rotateSpeed=.65;this.controls.zoomSpeed=.75;this.controls.panSpeed=.75
  this.controls.screenSpacePanning=false
  this.controls.addEventListener('start',this.onControlStart);this.controls.addEventListener('change',this.onControlChange)
  this.controls.update()
  this.own(studioLighting(this.renderer,this.scene))
  this.sphere=this.own(new THREE.SphereGeometry(PARTICLE_RADIUS,40,28))
  this.cylinder=this.own(new THREE.CylinderGeometry(1,1,1,12))
  this.portSphere=this.own(new THREE.SphereGeometry(.105,18,12))
  this.portDiamond=this.own(new THREE.OctahedronGeometry(.14))
  this.ringGeometry=this.own(new THREE.TorusGeometry(.54,.012,8,64))
  const grain=this.own(satinFinish());grain.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy())
  this.materials=[{color:0x4a8e83,roughness:.58,metalness:.48},{color:0xb0915c,roughness:.5,metalness:.83}].map(finish=>this.own(new THREE.MeshStandardMaterial({...finish,roughnessMap:grain,bumpMap:grain,bumpScale:.008,envMapIntensity:1.05})))
  this.portMaterials=[0xb6e0d3,0xbc9ccf].map(color=>this.own(new THREE.MeshStandardMaterial({color,roughness:.6,metalness:.35,envMapIntensity:.7})))
  this.bondMaterials=[{color:0xddbe7f,metalness:.78},{color:0xe99081,metalness:.3}].map(finish=>this.own(new THREE.MeshStandardMaterial({...finish,roughness:.43,envMapIntensity:.8})))
  this.ringMaterials=[0xe7d09b,0x82d7b8,0x9abfc5].map(color=>this.own(new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8})))
  this.rimMaterial=this.own(new THREE.MeshStandardMaterial({color:0xffd78a,roughness:.45,metalness:.75,envMapIntensity:.9}))
  this.letterMaterials=['A','B'].map(text=>this.makeLetter(text))
  this.floor=new THREE.Mesh(this.own(new THREE.PlaneGeometry(1,1)),this.own(new THREE.MeshStandardMaterial({color:0x0d1920,roughness:.96,metalness:.04,envMapIntensity:.18})))
  this.floor.rotation.x=-Math.PI/2;this.floor.position.y=-.47;this.floor.receiveShadow=true;this.scene.add(this.floor)
  this.grid=new THREE.GridHelper(24,24,0x355451,0x1c343b);this.grid.position.y=-.462
  this.grid.material.transparent=true;this.grid.material.opacity=.65;this.scene.add(this.grid)
  this.resources.add(this.grid.geometry);this.resources.add(this.grid.material)
  this.boundary=new THREE.LineLoop(this.own(new THREE.BufferGeometry()),this.own(new THREE.LineBasicMaterial({color:0x77918a,transparent:true,opacity:.65})));this.scene.add(this.boundary)
  for(const color of [0x8ecbbc,0xdd9d7b]){const ring=new THREE.Mesh(this.own(new THREE.RingGeometry(.994,1,128)),this.own(new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,transparent:true,opacity:.7})));ring.rotation.x=-Math.PI/2;ring.position.y=.015;ring.visible=false;this.range.push(ring);this.scene.add(ring)}
  const trailGeometry=this.own(new THREE.BufferGeometry())
  trailGeometry.setAttribute('position',new THREE.BufferAttribute(this.trailPositions,3).setUsage(THREE.DynamicDrawUsage))
  trailGeometry.setAttribute('color',new THREE.BufferAttribute(this.trailColors,3).setUsage(THREE.DynamicDrawUsage))
  this.trailLines=new THREE.LineSegments(trailGeometry,this.own(new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.58,depthWrite:false})))
  this.trailLines.frustumCulled=false;this.scene.add(this.trailLines)
 }
 private own<T extends {dispose:()=>void}>(resource:T):T{this.resources.add(resource);return resource}
 private makeLetter(letter:string){
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128
  const ctx=canvas.getContext('2d')!;ctx.font='500 70px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#dbdfcd';ctx.shadowColor='#061417';ctx.shadowBlur=2;ctx.fillText(letter,64,68)
  const texture=this.own(new THREE.CanvasTexture(canvas));texture.colorSpace=THREE.SRGBColorSpace
  return this.own(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false,toneMapped:false}))
 }
 resize(width:number,height:number){
  const dpr=Math.min(devicePixelRatio||1,2)
  if(width===this.width&&height===this.height&&dpr===this.dpr)return
  this.width=width;this.height=height;this.dpr=dpr
  this.renderer.setPixelRatio(dpr);this.renderer.setSize(width,height,false)
  this.overlay.width=Math.round(width*dpr);this.overlay.height=Math.round(height*dpr)
  this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.dirty=true
 }
 private addParticle(){
  const body=new THREE.Mesh(this.sphere,this.materials[0]);body.castShadow=true;body.receiveShadow=true;body.userData.id=this.bodies.length
  const ports=[0,1].map(()=>new THREE.Mesh(this.portSphere,this.portMaterials[0]))
  const rims=[0,1].map(()=>new THREE.Mesh(this.own(new THREE.TorusGeometry(.115,.014,8,24)),this.rimMaterial))
  const ring=new THREE.Mesh(this.ringGeometry,this.ringMaterials[0]);ring.rotation.x=-Math.PI/2
  const letter=new THREE.Sprite(this.letterMaterials[0]);letter.scale.setScalar(.24)
  this.scene.add(body,...ports,...rims,ring,letter);this.bodies.push({body,ports,rims,ring,letter})
  const arrow=new THREE.ArrowHelper(UP,new THREE.Vector3(),1,0xa8d8c8,.15,.075);this.forceArrows.push(arrow);this.scene.add(arrow)
 }
 private rod(index:number,start:THREE.Vector3,end:THREE.Vector3,correct:boolean){
  let mesh=this.bondMeshes[index]
  if(!mesh){mesh=new THREE.Mesh(this.cylinder,this.bondMaterials[0]);mesh.castShadow=true;this.scene.add(mesh);this.bondMeshes.push(mesh)}
  const direction=end.clone().sub(start),length=direction.length()
  mesh.visible=length>.0001;mesh.material=this.bondMaterials[correct?0:1]
  mesh.position.copy(start).add(end).multiplyScalar(.5);mesh.scale.set(.055,length,.055)
  if(mesh.visible)mesh.quaternion.setFromUnitVectors(UP,direction.normalize())
 }
 private updateModel(state:State,options:ViewOptions){
  const bound=7/Math.sqrt(state.params.concentration)
  if(bound!==this.lastBound){
   this.floor.scale.set(bound*2+.14,bound*2+.14,1);this.grid.scale.set(bound/12,1,bound/12)
   // Boundary follows concentration; grid spacing remains one model unit.
   this.scene.remove(this.grid);this.resources.delete(this.grid.geometry);this.resources.delete(this.grid.material);this.grid.geometry.dispose();this.grid.material.dispose()
   const points:number[]=[];for(let n=Math.ceil(-bound);n<=bound;n++){points.push(n,-.46,-bound,n,-.46,bound,-bound,-.46,n,bound,-.46,n)}
   const geometry=this.own(new THREE.BufferGeometry());geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3))
   this.grid=new THREE.LineSegments(geometry,this.own(new THREE.LineBasicMaterial({color:0x355451,transparent:true,opacity:.44})))
   this.scene.add(this.grid)
   this.boundary.geometry.dispose();this.resources.delete(this.boundary.geometry);this.boundary.geometry=this.own(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-bound,-.45,-bound),new THREE.Vector3(bound,-.45,-bound),new THREE.Vector3(bound,-.45,bound),new THREE.Vector3(-bound,-.45,bound)]));this.lastBound=bound
  }
  while(this.bodies.length<state.particles.length)this.addParticle()
  this.occupied.clear();let rods=0
  for(const bond of state.bonds){
   const [a,b]=bondEndpoints(state,bond)
   if(state.params.siteMode){this.occupied.add(`${bond.a}:${bond.siteA}`);this.occupied.add(`${bond.b}:${bond.siteB}`)}
   if(bond.correct)this.rod(rods++,a,b,true)
   else{const length=a.distanceTo(b),dashes=Math.max(2,Math.ceil(length/.17));for(let i=0;i<dashes;i++)this.rod(rods++,a.clone().lerp(b,i/dashes),a.clone().lerp(b,(i+.56)/dashes),false)}
  }
  for(let i=rods;i<this.bondMeshes.length;i++)this.bondMeshes[i].visible=false
  this.bodies.forEach((obj,i)=>{
   const p=state.particles[i],visible=!!p;obj.body.visible=visible;obj.letter.visible=visible
   obj.ports.forEach(port=>port.visible=visible&&!!state.params.siteMode);obj.rims.forEach(r=>r.visible=false);obj.ring.visible=false;this.forceArrows[i].visible=false
   if(!p)return
   const at=modelPosition(p);obj.body.position.copy(at);obj.body.material=this.materials[p.type];obj.letter.material=this.letterMaterials[p.type]
   const selected=options.selected===p.id,held=state.stableIds.includes(p.id)
   obj.ring.visible=selected||held||options.hovered===p.id||options.highlight.includes(p.id)
   obj.ring.material=this.ringMaterials[selected?0:held?1:2];obj.ring.position.copy(at);obj.ring.position.y=-.43
   for(let site=0;site<2;site++){
    const type=site===0?state.params.siteType0:state.params.siteType1,port=obj.ports[site]
    port.geometry=type?this.portDiamond:this.portSphere;port.material=this.portMaterials[type];port.position.copy(sitePosition(p,site,state))
    const rim=obj.rims[site];rim.visible=port.visible&&this.occupied.has(`${p.id}:${site}`);rim.position.copy(port.position);rim.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),port.position.clone().sub(at).normalize())
   }
   const force=new THREE.Vector3(p.fx,0,p.fy).multiplyScalar(.18),length=force.length(),arrow=this.forceArrows[i]
   if(options.forces&&length>.015){arrow.visible=true;arrow.position.copy(at);arrow.setDirection(force.normalize());arrow.setLength(length,Math.min(.18,length*.25),Math.min(.085,length*.13))}
  })
  const inspected=state.particles.find(p=>p.id===(options.selected??options.hovered))
  this.range.forEach((ring,i)=>{ring.visible=options.forces&&!!inspected;if(inspected){ring.position.copy(modelPosition(inspected));ring.position.y=.015;ring.scale.setScalar(i?1.05:1.05+state.params.range)}})
  this.trails.update(state,options.trails);let vertex=0
  if(options.trails)for(const p of state.particles){const points=this.trails.points.get(p.id)??[],color=new THREE.Color(COLORS[p.type])
   for(let i=1;i<points.length;i++)for(const point of [points[i-1],points[i]]){const fade=Math.max(0,1-(state.time-point.time)/TRAIL_DURATION);this.trailPositions.set([point.x,0,point.y],vertex*3);this.trailColors.set([color.r*fade,color.g*fade,color.b*fade],vertex*3);vertex++}
  }
  this.trailLines.visible=options.trails;this.trailLines.geometry.setDrawRange(0,vertex)
  this.trailLines.geometry.attributes.position.needsUpdate=true;this.trailLines.geometry.attributes.color.needsUpdate=true
 }
 command(action:CameraAction,state:State,selected:number|null,reduced:boolean){
  this.controls.update()
  // A second toolbar action continues toward the intended frame, even mid-flight.
  const target=(this.flight?.targetTo??this.controls.target).clone(),offset=(this.flight?.to??this.camera.position).clone().sub(target),distance=offset.length()
  let next=target.clone(),position=this.camera.position.clone()
  if(action==='frame'||action==='reset'){
   const particles=assemblyParticles(state,action==='reset'?null:selected)
   const box=new THREE.Box3().setFromPoints(particles.map(modelPosition));if(box.isEmpty())return
   box.getCenter(next);const sphere=box.getBoundingSphere(new THREE.Sphere());const fov=THREE.MathUtils.degToRad(this.camera.fov)/2
   const angle=Math.min(fov,Math.atan(Math.tan(fov)*this.camera.aspect)),radius=Math.max(1.6,sphere.radius+.75)
   const fit=Math.max(3,Math.min(70,radius/Math.sin(angle)*1.15))
   position=next.clone().add((action==='reset'?ORBIT.clone():offset.normalize()).multiplyScalar(fit))
  }else if(action==='top')position=target.clone().add(new THREE.Vector3(0,distance,.001))
  else if(action==='orbit')position=target.clone().addScaledVector(ORBIT,distance)
  else if(action==='zoom-in'||action==='zoom-out')position=target.clone().add(offset.normalize().multiplyScalar(THREE.MathUtils.clamp(distance*(action==='zoom-in'?.8:1.25),2,75)))
  else{
   const spherical=new THREE.Spherical().setFromVector3(offset)
   if(action==='left')spherical.theta-=.22;if(action==='right')spherical.theta+=.22
   if(action==='up')spherical.phi=Math.max(.015,spherical.phi-.16);if(action==='down')spherical.phi=Math.min(Math.PI/2-.06,spherical.phi+.16)
   position=target.clone().add(new THREE.Vector3().setFromSpherical(spherical))
  }
  this.flight={from:this.camera.position.clone(),to:position,targetFrom:this.controls.target.clone(),targetTo:next,started:performance.now()-(reduced?650:0)};this.dirty=true
 }
 panKey(dx:number,dy:number){
  this.flight=null;const offset=this.camera.position.clone().sub(this.controls.target),right=new THREE.Vector3().crossVectors(offset,UP).normalize().multiplyScalar(-dx*offset.length()*.025)
  const forward=new THREE.Vector3(offset.x,0,offset.z).normalize().multiplyScalar(dy*offset.length()*.025),move=right.add(forward)
  this.camera.position.add(move);this.controls.target.add(move);this.controls.update();this.dirty=true
 }
 pick(x:number,y:number){
  this.raycaster.setFromCamera(new THREE.Vector2(x/this.width*2-1,-y/this.height*2+1),this.camera)
  return this.raycaster.intersectObjects(this.bodies.filter(o=>o.body.visible).map(o=>o.body),false)[0]?.object.userData.id??null
 }
 render(now:number,state:State,options:ViewOptions,reduced:boolean){
  this.options=options;this.controls.enableDamping=!reduced
  if(this.flight){const f=this.flight,t=reduced?1:Math.min(1,(now-f.started)/650),ease=1-Math.pow(1-t,3)
   this.camera.position.lerpVectors(f.from,f.to,ease);this.controls.target.lerpVectors(f.targetFrom,f.targetTo,ease);if(t>=1)this.flight=null;this.dirty=true
  }
  this.controls.update()
  // Paused rule edits can change classification or site geometry without advancing time.
  const signature=JSON.stringify([options,state.params,state.bonds,state.stableIds])
  if(state!==this.lastState||state.time!==this.lastTime||signature!==this.lastOptions){this.updateModel(state,options);this.lastState=state;this.lastTime=state.time;this.lastOptions=signature;this.dirty=true}
  if(!this.lastCamera.equals(this.camera.matrixWorld)){this.lastCamera.copy(this.camera.matrixWorld);this.dirty=true}
  if(!this.dirty)return false
  this.bodies.forEach(obj=>{if(obj.body.visible)obj.letter.position.copy(obj.body.position).add(this.camera.position.clone().sub(obj.body.position).normalize().multiplyScalar(.45))})
  this.renderer.render(this.scene,this.camera);this.drawOverlay(state);this.dirty=false;return true
 }
 private projected(position:THREE.Vector3){const p=position.clone().project(this.camera);return {x:(p.x+1)/2*this.width,y:(1-p.y)/2*this.height,visible:p.z>-1&&p.z<1}}
 private drawOverlay(state:State){
  const ctx=this.ctx,w=this.width,h=this.height;ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.clearRect(0,0,w,h)
  const boxes:{x:number;y:number;w:number;h:number}[]=[]
  const projected=state.particles.map(p=>({p,at:this.projected(modelPosition(p))})).filter(n=>n.at.visible)
  if(this.options.labels){
   ctx.font='500 10px sans-serif';ctx.textBaseline='middle';ctx.textAlign='center'
   for(const {p,at}of projected){
    if(at.x<15||at.x>w-15||at.y<48||at.y>h-50)continue
    const candidates=[[27,-27],[27,27],[-27,-27],[-27,27],[0,-42],[0,42],[51,0],[-51,0]]
    let chosen:{x:number;y:number;score:number}|null=null
    for(const [dx,dy]of candidates){const x=Math.max(20,Math.min(w-20,at.x+dx)),y=Math.max(72,Math.min(h-61,at.y+dy));let score=0
     if((x<230&&y<140)||(x>w-70&&y<260))score+=500
     for(const b of boxes)if(Math.abs(x-b.x)<39&&Math.abs(y-b.y)<20)score+=100
     for(const other of projected)if(Math.hypot(x-other.at.x,y-other.at.y)<23)score+=25
     if(!chosen||score<chosen.score)chosen={x,y,score}
    }
    if(!chosen||chosen.score>=500)continue
    const {x,y}=chosen;boxes.push({x,y,w:38,h:18});ctx.strokeStyle='#afc9b650';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(at.x,at.y);ctx.lineTo(x,y);ctx.stroke()
    ctx.fillStyle='#071318e8';ctx.fillRect(x-18,y-8,36,16);ctx.fillStyle=p.type?'#edd5a3':'#ade5d7';ctx.fillText(`${p.type?'B':'A'}${String(p.id+1).padStart(2,'0')}`,x,y)
   }
  }
  const shade=ctx.createLinearGradient(0,h-61,0,h);shade.addColorStop(0,'#09151c00');shade.addColorStop(1,'#09151cf5');ctx.fillStyle=shade;ctx.fillRect(0,h-61,w,61)
  ctx.textAlign='left';ctx.font='500 8px sans-serif';ctx.fillStyle='#afc6bd';ctx.fillText(`${state.particles.length} PARTICLES  /  ${state.bonds.length} LINKS`,18,h-31)
  ctx.fillStyle='#7f9998';ctx.font='7px sans-serif';ctx.fillText('3D VIEW Â· PLANAR MODEL Â· ARBITRARY UNITS',18,h-16)
  const origin=new THREE.Vector3(-7/Math.sqrt(state.params.concentration),-.44,7/Math.sqrt(state.params.concentration)),a=this.projected(origin),b=this.projected(origin.clone().add(new THREE.Vector3(1,0,0)))
  if(a.visible&&a.x>5&&b.x<w-5&&a.y>60&&a.y<h-70){ctx.strokeStyle='#b6c6ae';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.fillStyle='#c7d2bc';ctx.font='9px sans-serif';ctx.fillText('1 model unit',(a.x+b.x)/2,(a.y+b.y)/2+13)}
  // Orientation triad uses the same camera rotation, with model axis names.
  const center={x:w-42,y:h-34},axes=[{v:new THREE.Vector3(1,0,0),label:'x',color:'#d9bd83'},{v:new THREE.Vector3(0,0,1),label:'y',color:'#8bd5c3'},{v:new THREE.Vector3(0,1,0),label:'n',color:'#71909d'}]
  for(const axis of axes){const dir=axis.v.transformDirection(this.camera.matrixWorldInverse),x=center.x+dir.x*22,y=center.y-dir.y*22;ctx.strokeStyle=axis.color;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(center.x,center.y);ctx.lineTo(x,y);ctx.stroke();ctx.fillStyle=axis.color;ctx.font='9px sans-serif';ctx.fillText(axis.label,x+3,y)}
 }
 exportPNG(state:State,options:ViewOptions,reduced:boolean){
  // Export can be requested while the chamber is offscreen, after a paused rule edit.
  this.render(performance.now(),state,options,reduced)
  // Render immediately before capture, avoiding a permanent preserved GPU buffer.
  this.renderer.render(this.scene,this.camera)
  const out=document.createElement('canvas');out.width=this.overlay.width;out.height=this.overlay.height
  const ctx=out.getContext('2d')!;ctx.drawImage(this.renderer.domElement,0,0);ctx.drawImage(this.overlay,0,0)
  return out.toDataURL('image/png')
 }
 dispose(){
  this.controls.removeEventListener('start',this.onControlStart);this.controls.removeEventListener('change',this.onControlChange);this.controls.dispose()
  for(const arrow of this.forceArrows)arrow.dispose()
  for(const resource of this.resources)resource.dispose()
  this.scene.traverse(obj=>{if(obj instanceof THREE.Light&&'shadow'in obj)(obj as THREE.DirectionalLight).shadow?.dispose()})
  this.renderer.dispose();this.renderer.forceContextLoss();this.scene.clear()
 }
}
