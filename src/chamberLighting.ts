import * as THREE from 'three'

/** Studio lighting is a display convention, independent of the particle model. */
export function studioLighting(renderer:THREE.WebGLRenderer,scene:THREE.Scene){
 const studio=new THREE.Scene();studio.background=new THREE.Color(.025,.035,.045)
 const panelGeometry=new THREE.PlaneGeometry(1,1),panelMaterials:THREE.MeshBasicMaterial[]=[]
 const panel=(width:number,height:number,position:[number,number,number],radiance:[number,number,number])=>{
  const material=new THREE.MeshBasicMaterial({color:new THREE.Color(...radiance),side:THREE.DoubleSide,toneMapped:false});panelMaterials.push(material)
  const mesh=new THREE.Mesh(panelGeometry,material);mesh.scale.set(width,height,1);mesh.position.set(...position);mesh.lookAt(0,0,0);studio.add(mesh)
 }
 // Broad reflected light cards avoid the round white highlights of point lights.
 panel(10,7,[-6,8,5],[3.4,2.9,2.2])
 panel(2,10,[7,4,-6],[1.15,1.85,2.45])
 panel(5,3,[4,6,7],[.33,.42,.45])
 const generator=new THREE.PMREMGenerator(renderer)
 const environment=generator.fromScene(studio,.06,.1,60)
 generator.dispose();panelGeometry.dispose();panelMaterials.forEach(material=>material.dispose());studio.clear()
 scene.environment=environment.texture
 scene.add(new THREE.HemisphereLight(0xa9c5cf,0x17242b,.65))
 const key=new THREE.SpotLight(0xffdfb0,220,65,Math.PI*.28,.9,2)
 key.position.set(-7,13,5);key.target.position.set(0,0,0);key.castShadow=true
 key.shadow.mapSize.set(2048,2048);key.shadow.camera.near=1;key.shadow.camera.far=45;key.shadow.bias=-.00025;key.shadow.normalBias=.025
 scene.add(key,key.target)
 const rim=new THREE.DirectionalLight(0x9acfe1,1.25);rim.position.set(5,4,-9);scene.add(rim)
 return environment
}

/** Deterministic microfinish affects lighting only, with no vertex displacement. */
export function satinFinish(){
 const size=256,data=new Uint8Array(size*size*4)
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  let hash=Math.imul(x+17,374761393)^Math.imul(y+29,668265263);hash=Math.imul(hash^(hash>>>13),1274126177);hash^=hash>>>16
  const noise=(hash>>>0)/4294967295,brush=Math.sin(y*Math.PI*.5)*.5+.5,i=(y*size+x)*4
  data[i]=Math.round(120+noise*12+brush*4);data[i+1]=Math.round(220+noise*27+brush*8);data[i+2]=128;data[i+3]=255
 }
 const texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat)
 texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true
 return texture
}
