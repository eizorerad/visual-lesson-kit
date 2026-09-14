/* Authored language packs. Existing nodes keep their source text and identities;
   observing text changes lets legacy state-painted scenes stay in the chosen language. */
(function(global){
'use strict';
var PACKS={ru:{label:'RU',source:true,ui:{notesHead:'Пояснения · подсвечен текущий шаг',notesEmpty:'Нет пояснения к этой сцене.',swipeHint:'Свайп — следующий или предыдущий шаг'},notes:{},qa:{},strings:{},patterns:[]}};
var current='ru',listeners=[],records=new WeakMap(),bindings=new Map();
var ATTRS=['title','aria-label','placeholder','alt'];
var IGNORE='script,style,code,pre,textarea,[contenteditable]:not([contenteditable="false"]),[data-i18n-ignore]';
function own(o,k){return Object.prototype.hasOwnProperty.call(o,k);}
function known(code){return typeof code==='string'&&own(PACKS,code);}
function pack(code,definition){
 if(typeof code!=='string'||!/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(code)||!definition||typeof definition!=='object')throw new TypeError('i18n.pack needs a language code and definition');
 var old=PACKS[code]||{label:code.toUpperCase(),source:false,ui:{},notes:{},qa:{},strings:{},patterns:[]};
 var patterns=definition.patterns||[];
 patterns.forEach(function(p){if(!p||Object.prototype.toString.call(p.match)!=='[object RegExp]'||p.match.source[0]!=='^'||p.match.source.slice(-1)!=='$'||!['string','function'].includes(typeof p.replace))throw new TypeError('Translation patterns must be anchored regular expressions with replacements');});
 PACKS[code]={label:definition.label||old.label,source:definition.source===undefined?old.source:!!definition.source,
  ui:Object.assign({},old.ui,definition.ui||{}),notes:Object.assign({},old.notes,definition.notes||{}),qa:Object.assign({},old.qa,definition.qa||{}),
  strings:Object.assign({},old.strings,definition.strings||{}),patterns:old.patterns.concat(patterns)};
}
function text(value){
 if(typeof value!=='string')return value;
 var parts=/^(\s*)([\s\S]*?)(\s*)$/.exec(value),source=parts[2],p=PACKS[current],translated=source;
 if(own(p.strings,source))translated=p.strings[source];
 else for(var i=0;i<p.patterns.length;i++){var rule=p.patterns[i];rule.match.lastIndex=0;if(rule.match.test(source)){rule.match.lastIndex=0;translated=source.replace(rule.match,rule.replace);break;}}
 return parts[1]+translated+parts[3];
}
function ignored(node){var el=node.nodeType===1?node:node.parentElement;return !!(el&&el.closest(IGNORE));}
function renderValue(node,key,read,write){
 var values=records.get(node)||{},old=values[key],now=read();if(now===null)return;
 var source=old&&now===old.last?old.source:now,next=text(source);
 values[key]={source:source,last:next};records.set(node,values);if(next!==now)write(next);
}
function apply(root){
 if(!root||ignored(root))return;
 if(root.nodeType===3){renderValue(root,'text',function(){return root.nodeValue;},function(v){root.nodeValue=v;});return;}
 if(root.nodeType===1)ATTRS.forEach(function(name){if(root.hasAttribute(name))renderValue(root,name,function(){return root.getAttribute(name);},function(v){root.setAttribute(name,v);});});
 Array.from(root.childNodes||[]).forEach(apply);
}
function observe(root){
 if(!root)return function(){};
 if(bindings.has(root))return bindings.get(root).dispose;
 var observer=new MutationObserver(function(changes){
  var targets=new Set();changes.forEach(function(c){if(c.type==='childList')c.addedNodes.forEach(function(node){targets.add(node);});else targets.add(c.target);});
  targets.forEach(function(node){if(root===node||root.contains(node))apply(node);});
 });
 observer.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:ATTRS});
 function dispose(){observer.disconnect();bindings.delete(root);}
 bindings.set(root,{dispose:dispose});apply(root);return dispose;
}
function storageKey(){return 'lesson-language:'+String((global.LESSON||{}).id||global.location.pathname);}
function resolve(){
 var asked;try{asked=new URL(global.location.href).searchParams.get('lang');}catch(e){}
 if(known(asked))return asked;
 var saved;try{saved=global.localStorage.getItem(storageKey());}catch(e){}
 if(known(saved))return saved;
 var configured=(global.LESSON||{}).lang||global.DECK_LANG;return known(configured)?configured:'ru';
}
function markLanguage(){document.documentElement.lang=current;document.documentElement.dataset.lang=current;apply(document.querySelector('title'));}
function setLang(next){
 if(!known(next)||next===current)return current;
 current=next;markLanguage();
 try{global.localStorage.setItem(storageKey(),current);}catch(e){}
 try{var url=new URL(global.location.href);url.searchParams.set('lang',current);global.history.replaceState(null,'',url.href);}catch(e){}
 bindings.forEach(function(_,root){apply(root);});
 listeners.slice().forEach(function(fn){fn(current);});return current;
}
function languages(){return Object.keys(PACKS);}
function toggle(){var all=languages();return setLang(all[(all.indexOf(current)+1)%all.length]);}
function ui(key){return own(PACKS[current].ui,key)?PACKS[current].ui[key]:PACKS.ru.ui[key];}
function notes(scene){return scene?(PACKS[current].notes[scene.id]||scene.notes):null;}
function qa(scene){return scene?(PACKS[current].qa[scene.id]||scene.qa):null;}
function untranslated(scenes){
 if(PACKS[current].source)return [];
 return (scenes||[]).filter(function(scene){var n=PACKS[current].notes[scene.id],q=PACKS[current].qa[scene.id];return !n||(Array.isArray(scene.notes)&&n.length!==scene.notes.length)||(Array.isArray(scene.qa)&&scene.qa.length&&(!q||q.length!==scene.qa.length));}).map(function(s){return s.id;});
}
function onChange(fn){if(typeof fn!=='function')throw new TypeError('onChange needs a function');listeners.push(fn);return function(){listeners=listeners.filter(function(value){return value!==fn;});};}
function start(){current=resolve();markLanguage();observe(document.body);return current;}
global.D=global.D||{};
global.D.i18n={pack:pack,start:start,lang:function(){return current;},setLang:setLang,toggle:toggle,languages:languages,label:function(){return PACKS[current].label;},ui:ui,notes:notes,qa:qa,untranslated:untranslated,onChange:onChange,text:text,apply:apply,observe:observe};
})(window);
