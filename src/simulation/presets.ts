import {defaults,type Params} from './engine'

// This seed demonstrates one reproducible outcome, not a success-rate estimate.
export const trianglePreset:Params={...defaults,count:8,siteMode:3,siteSpread:60,targetMode:2,ruleMask:7,bindingChance:.2,temperature:.15,concentration:2,attraction:2.5,selectivity:1,seed:2,speed:4}

export const squarePreset:Params={...defaults,count:8,siteMode:2,targetMode:1,bindingChance:.2,temperature:.15,concentration:2,attraction:2.5,selectivity:1,seed:168,speed:4}
