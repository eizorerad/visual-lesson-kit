(function(){
'use strict';
const button=document.getElementById('speedToggle');if(!button)return;
const speeds=[1,.5,1.5];let i=0;
button.addEventListener('click',function(){
 i=(i+1)%speeds.length;A.setSpeed(speeds[i]);
 const value=document.getElementById('speedValue');
 if(value)value.textContent=speeds[i]+'×';else this.textContent=speeds[i]+'×';
});
})();
