'use strict';
// A dependency-free DOM harness: verifies app state and generated markup, not visual layout.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../dist'));
class Element {
  constructor(tag='div',attrs={}){this.tagName=tag;this.attrs=attrs;this.dataset={};for(const [k,v] of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5)]=v;this.listeners={};this.children=[];this.value='';this.checked=false;this.textContent='';this.hidden=false;this.style={};this.paused=true;this.currentTime=0;this.duration=3;this.readyState=1;}
  setAttribute(k,v){this.attrs[k]=v;}
  addEventListener(k,f){(this.listeners[k]??=[]).push(f);}
  async emit(k,event={}){for(const f of this.listeners[k]||[])await f({target:this,preventDefault(){},...event});}
  set innerHTML(v){this._html=v;this.children=parse(v);}
  get innerHTML(){return this._html||'';}
  replaceChildren(){this.children=[];this._html='';}
  append(x){this.children.push(x);}
  querySelectorAll(selector){return this.children.filter(x=>x.matches(selector));}
  matches(selector){return selector.split(',').some(s=>s===this.tagName||(s.startsWith('[')&&s.endsWith(']')&&Object.hasOwn(this.attrs,s.slice(1,-1))));}
  closest(selector){return this.matches(selector)?this:null;}
  pause(){this.paused=true;this.emit('pause');}
  async play(){this.paused=false;await this.emit('play');}
  focus(){} scrollIntoView(){} select(){} remove(){}
}
function parse(html){return [...html.matchAll(/<(\w+)([^>]*?)>/g)].map(m=>{const attrs=Object.fromEntries([...m[2].matchAll(/([\w-]+)="([^"]*)"/g)].map(a=>[a[1],a[2]]));return new Element(m[1],attrs);});}
function create(hash=''){
 const all=parse(fs.readFileSync(path.join(root,'index.html'),'utf8')),ids=Object.fromEntries(all.filter(x=>x.attrs.id).map(x=>[x.attrs.id,x]));
 const doc=new Element();doc.getElementById=id=>{assert.ok(ids[id],`Missing element ${id}`);return ids[id];};doc.querySelectorAll=s=>all.flatMap(x=>[x,...x.children]).filter(x=>x.matches(s));doc.querySelector=s=>s==='.workbench'?ids.workbench:null;doc.createElement=t=>new Element(t);
 const win=new Element(),location={hash},writes=[];const history={pushState(_,__,url){location.hash=url;writes.push(url);},replaceState(_,__,url){location.hash=url;}};
 const ctx=vm.createContext({window:win,document:doc,location,history,URL,matchMedia:()=>({matches:true}),navigator:{clipboard:{writeText:async t=>{ctx.copied=t;}}}});
 for(const f of ['catalog.js','app.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
 return {ctx,ids,all,doc,win,location,writes,video:()=>ids.media.children.find(x=>x.tagName==='video'),buttons:s=>doc.querySelectorAll(s)};
}
(async()=>{
 const h=create('#does-not-exist');const {ids}=h;
 assert.equal(h.location.hash,'#dolly-in');assert.equal(ids['shot-title'].textContent,'推镜');assert.equal(ids['results-count'].textContent,'24 / 24 个镜头');
 assert.equal(h.ctx.window.SHOTS.length,24);assert.ok(h.ctx.window.SHOTS.every(s=>!s.notion_url&&s.prompt_zh&&s.prompt_en));
 for(const s of h.ctx.window.SHOTS)assert.ok(fs.existsSync(path.join(root,`assets/diagrams/${String(s.number).padStart(2,'0')}.svg`)));
 assert.equal(h.video().loop,false);assert.equal(h.video().paused,true);
 await ids.play.emit('click');assert.equal(h.video().paused,false);
 await ids.step.emit('click');assert.equal(h.video().paused,true);assert.ok(Math.abs(h.video().currentTime-1/12)<1e-8);
 ids.seek.value='1.5';await ids.seek.emit('input');assert.equal(h.video().currentTime,1.5);
 await h.buttons('[data-speed]')[0].emit('click');assert.equal(h.video().playbackRate,.5);
 ids.loop.checked=true;await ids.loop.emit('change');assert.equal(h.video().loop,true);
 await ids.restart.emit('click');assert.equal(h.video().currentTime,0);assert.equal(h.video().paused,true);
 await h.buttons('[data-view]')[1].emit('click');assert.equal(ids['player-controls'].hidden,true);assert.equal(h.video(),undefined);
 await h.buttons('[data-view]')[0].emit('click');assert.equal(ids['player-controls'].hidden,false);
 await ids.next.emit('click');assert.equal(h.location.hash,'#dolly-out');assert.equal(h.video().playbackRate,.5);
 await ids.previous.emit('click');assert.equal(h.location.hash,'#dolly-in');assert.equal(h.writes.length,2);
 h.location.hash='#pan';await h.win.emit('hashchange');assert.equal(ids['shot-title'].textContent,'水平摇镜');assert.equal(h.writes.length,2);
 await ids.workbench.emit('keydown',{key:'ArrowRight',target:ids['shot-title']});assert.equal(h.location.hash,'#tilt');
 await ids.workbench.emit('keydown',{key:'ArrowRight',target:ids.seek});assert.equal(h.location.hash,'#tilt');
 ids['simulation-only'].checked=true;await ids['simulation-only'].emit('change');assert.equal(ids['results-count'].textContent,'7 / 24 个镜头');
 ids.search.value='ORBIT';await ids.search.emit('input');assert.equal(ids['results-count'].textContent,'1 / 24 个镜头');
 ids.search.value='no-such-shot';await ids.search.emit('input');assert.equal(ids.empty.hidden,false);
 await ids.reset.emit('click');assert.equal(ids['results-count'].textContent,'24 / 24 个镜头');assert.equal(ids.empty.hidden,true);
 const cat=h.buttons('[data-category]').find(b=>b.dataset.category==='转场');await ids['category-filters'].emit('click',{target:cat});assert.equal(ids['results-count'].textContent,'3 / 24 个镜头');
 await h.buttons('[data-lang]')[1].emit('click');assert.equal(ids['prompt-text'].lang,'en');await ids.copy.emit('click');assert.equal(h.ctx.copied,ids['prompt-text'].textContent);
 h.location.hash='#extreme-wide';await h.win.emit('hashchange');assert.equal(ids.previous.disabled,true);assert.equal(ids['player-controls'].hidden,true);
 h.location.hash='#cross-dissolve';await h.win.emit('hashchange');assert.equal(ids.next.disabled,true);
 const catalog=create('#catalog');assert.equal(catalog.location.hash,'#catalog');assert.ok(catalog.ids['shot-title'].textContent);
 const failed=create('#pan');await failed.video().emit('error');assert.equal(failed.ids['player-controls'].hidden,true);assert.match(failed.ids.media.innerHTML,/视频|模拟片段/);
 console.log('PASS: 24 records/assets, privacy fields, playback, seek, speed, loop, diagram toggle, navigation, hash history, keyboard scope, search, filters/reset, bilingual copy, boundaries, and error fallback.');
})().catch(e=>{console.error(e);process.exitCode=1;});
