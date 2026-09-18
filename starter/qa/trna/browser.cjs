/* Portable browser launch for the tRNA checks. No browser is downloaded here. */
'use strict';
async function launch(pw,options={}){
 const channel=options.channel||process.env.PLAYWRIGHT_CHANNEL;
 const configuration={headless:true,...options,...(channel?{channel}:{})};
 try{return await pw.chromium.launch(configuration);}
 catch(error){
  // Fall back only when the default bundled executable is absent. Explicit
  // channel choices and unrelated launch/runtime failures must remain visible.
  if(channel||!/Executable doesn't exist at/i.test(error.message))throw error;
  return pw.chromium.launch({...configuration,channel:'chrome'});
 }
}
module.exports={launch};
