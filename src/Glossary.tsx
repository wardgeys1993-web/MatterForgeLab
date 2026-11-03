import {useEffect,useState} from 'react'
import {BookOpen,Search,X} from 'lucide-react'

const terms=[
 ['Atom','A small unit of an element, made of a nucleus and electrons. Atoms can join to make molecules.'],
 ['Molecule','A group of atoms joined in a particular arrangement. Its properties depend on the atoms and how they connect.'],
 ['Bond','An interaction that holds parts together. Real chemical bonds arise from electron behavior; the lab uses simple spring-like links.'],
 ['Brownian motion','Irregular motion caused by many tiny collisions with surrounding particles. The lab approximates its effect with random movement.'],
 ['Catalyst','A substance that speeds a particular reaction without being consumed overall. It does not make every reaction possible.'],
 ['Concentration','How much of something is present in a given volume. In this two-dimensional lab, it controls how crowded the chamber is.'],
 ['Entropy','A measure related to the number of microscopic arrangements compatible with a larger-scale description. It is not simply a synonym for mess.'],
 ['Free energy','A quantity used to compare possible changes under specified conditions. It combines energetic and entropic effects; this lab does not calculate it.'],
 ['Enzyme','A biological catalyst, usually a protein, that helps a specific chemical reaction proceed.'],
 ['Protein','A molecule made from one or more chains of amino acids. Its shape and interactions help determine what it does.'],
 ['Ribosome','A cellular machine that reads messenger RNA and joins amino acids to build proteins. It does not manufacture arbitrary materials.'],
 ['Self-assembly','A process where parts organize through their local interactions without each part being individually positioned.'],
 ['Selectivity','How strongly an interaction favors some partners over others. In this lab, lower selectivity allows unintended bonds.'],
 ['Thermal agitation','Motion associated with temperature. In this lab, it changes random movement and the modeled chance that bonds break.'],
 ['Valence','In the broadest sense, a measure of an atom’s capacity to combine. The lab uses a simplified limit of two bonds per particle.']
] as const

export default function Glossary({onClose}:{onClose:()=>void}){
 const [query,setQuery]=useState(''),[open,setOpen]=useState<string|null>(null)
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[onClose])
 const matches=terms.filter(([name,meaning])=>`${name} ${meaning}`.toLowerCase().includes(query.toLowerCase().trim()))
 return <div className="modal-backdrop" onClick={onClose}><section className="modal glossary" role="dialog" aria-modal="true" aria-labelledby="glossary-title" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={onClose} aria-label="Close glossary"><X/></button><div className="eyebrow"><BookOpen size={14}/> YOUR POCKET FIELD GUIDE</div><h2 id="glossary-title">Words worth knowing.</h2><p>Simple explanations, without leaving your experiment.</p><label className="glossary-search"><Search size={17}/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search a word or idea" aria-label="Search glossary"/></label><div className="glossary-results">{matches.length===0&&<p>No matches yet. Try a different word.</p>}{matches.map(([name,meaning])=><div className="glossary-entry" key={name}><button aria-expanded={open===name} onClick={()=>setOpen(open===name?null:name)}><b>{name}</b><span>{open===name?'−':'+'}</span></button>{open===name&&<p>{meaning}</p>}</div>)}</div><p className="glossary-source">For more on biological terms, see the <a href="https://www.genome.gov/genetics-glossary" target="_blank" rel="noreferrer">NHGRI genetics glossary</a>. Connections to the simulation are teaching analogies.</p></section></div>
}
