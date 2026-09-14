/* Register the remaining inspected chemistry/physics explanations. */
(function(global){'use strict';
const specs=global.CHEMISTRY_APPLICATIONS||[];
for(const id of ['stoichiometry','protonation','diffusion','membrane','photons','kinetics','atp','arrows']){const found=specs.filter(s=>s.id===id);if(found.length!==1)throw new Error('Load one context recipe: '+id);global.CHEMISTRY_BRIDGE.add(found[0]);}
})(window);
