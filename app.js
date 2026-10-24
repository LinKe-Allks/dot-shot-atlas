'use strict';
(() => {
  const shots = window.SHOTS;
  const simulated = new Set(['dolly-in','dolly-out','pan','truck','orbit','crane-reveal','zoom']);
  const pairs = {
    'dolly-in': ['zoom','推镜改变机位与透视；变焦不移动相机。'],
    'zoom': ['dolly-in','变焦改变焦距；推镜改变相机与主体的距离。'],
    'dolly-out': ['dolly-in','同一条轴线，靠近与远离带来不同叙事方向。'],
    'pan': ['truck','摇镜只转动朝向；横移改变相机的位置。'],
    'truck': ['pan','横移会产生前后景视差；摇镜只转动相机。'],
    'low-angle': ['tilt','低角度是观看角度；垂直摇镜是相机转动。'],
    'high-angle': ['overhead','高角度是斜向下看；正俯拍是垂直向下看。'],
    'orbit': ['truck','环绕沿主体绕行；横移沿水平方向移动。'],
    'crane-reveal': ['tilt','升起改变机位高度；垂直摇镜改变观看方向。'],
    'dolly-zoom': ['zoom','滑动变焦组合了机位移动与反向变焦。']
  };
  let current = shots.find(s => s.id === 'dolly-in'), language = 'zh', category = '全部', view = 'motion', speed = 1;
  let video = null;
  const $ = id => document.getElementById(id);
  const e = text => String(text).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = s => String(s.number).padStart(2,'0');
  const diagram = s => `./assets/diagrams/${number(s)}.svg`;
  function sourceName(url){try{const host=new URL(url).hostname;return host.includes('runway')?'Runway 提示词指南':host.includes('adobe')?'Adobe 镜头指南':host.includes('studiobinder')?'StudioBinder 镜头指南':host.replace(/^www\./,'');}catch{return '参考来源';}}
  function setText(id,text){$(id).textContent=text;}
  function renderPrompt(){
    setText('prompt-text', current[`prompt_${language}`]); $('prompt-text').lang=language==='zh'?'zh-CN':'en';
    document.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===language)));
    setText('copy-status','');
  }
  function syncPlayer(){
    if(!video)return;
    const duration=Number.isFinite(video.duration)?video.duration:3;
    $('seek').max=duration;$('seek').value=video.currentTime;
    $('seek').setAttribute('aria-valuetext',`${video.currentTime.toFixed(2)} 秒，共 ${duration.toFixed(2)} 秒`);
    setText('timecode',`${video.currentTime.toFixed(2)} / ${duration.toFixed(2)} s`);
    setText('play',video.paused?'▶ 播放':'Ⅱ 暂停');
    $('play').setAttribute('aria-label',video.paused?'播放模拟':'暂停模拟');
  }
  function renderMedia(){
    const s=current, isSim=simulated.has(s.id), motion=isSim&&view==='motion';
    if(video)video.pause();video=null;
    $('media').replaceChildren();$('player-controls').hidden=!motion;
    $('view-tabs').hidden=!isSim;
    document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
    setText('media-badge',motion?'Blender 几何模拟':'构图示意图');
    setText('render-spec',motion?'640 × 360 · 12 FPS · 3 SEC':'VECTOR STUDY / SVG');
    setText('motion-cue',s.visual_cue);
    setText('media-caption',motion?'手动播放 · 非无缝片段，循环默认关闭':'静态图解 · 观察取景范围与相机路径');
    if(motion){
      video=document.createElement('video');const active=video;
      active.muted=true;active.playsInline=true;active.preload='metadata';active.playbackRate=speed;
      active.loop=$('loop').checked;
      active.poster=`./assets/motion/${s.id}.jpg`;active.src=`./assets/motion/${s.id}.mp4`;
      active.setAttribute('aria-label',`${s.title_zh}的 Blender 几何模拟，下方提供播放和逐帧控制`);
      ['timeupdate','loadedmetadata','pause','play','ended','seeked'].forEach(name=>active.addEventListener(name,()=>{if(video===active)syncPlayer();}));
      active.addEventListener('error',()=>{
        if(video!==active)return;active.pause();video=null;$('player-controls').hidden=true;
        $('media').innerHTML=`<img src="${diagram(s)}" alt="${e(s.visual_cue)}"><p class="media-error" role="status">模拟片段暂时无法加载，当前显示构图示意图。</p>`;
        setText('media-badge','构图示意图 · 视频未加载');setText('render-spec','VECTOR STUDY / SVG');
        setText('media-caption','视频加载失败，可切换到构图图解继续学习。');
      },{once:true});
      $('media').append(active);syncPlayer();
    }else{
      const img=document.createElement('img');img.src=diagram(s);img.alt=`${s.title_zh}示意：${s.visual_cue}`;$('media').append(img);
    }
  }
  function renderDetail(){
    const s=current;
    setText('viewer-number',`STUDY ${number(s)} / ${s.title_en}`);
    setText('shot-position',`${number(s)} / ${shots.length}`);
    $('previous').disabled=shots.indexOf(s)===0;$('next').disabled=shots.indexOf(s)===shots.length-1;
    renderMedia();
    setText('shot-title',s.title_zh);setText('shot-en',s.title_en);setText('shot-category',s.category);
    setText('shot-definition',s.definition);setText('shot-effect',s.effect);setText('shot-use',s.use_case);setText('shot-pitfall',s.pitfall);
    $('keywords').innerHTML=s.keywords_en.map(k=>`<span>${e(k)}</span>`).join('');
    $('source-links').innerHTML=s.source_urls.map(url=>`<a href="${e(url)}" target="_blank" rel="noopener noreferrer">${e(sourceName(url))} ↗</a>`).join('');
    const pair=pairs[s.id];
    $('comparison').innerHTML=pair?`<p class="compare-label">容易混淆？对照着看</p><button class="compare-link" type="button" data-select="${e(pair[0])}"><span>${e(pair[1])}</span><span>查看 ${e(shots.find(x=>x.id===pair[0]).title_en)} ↗</span></button>`:'';
    renderPrompt();
  }
  function renderCatalog(){
    const term=$('search').value.trim().toLocaleLowerCase();
    const filtered=shots.filter(s=>(category==='全部'||s.category===category)&&(!$('simulation-only').checked||simulated.has(s.id))&&(!term||[s.title,s.title_zh,s.title_en,s.category,s.definition,s.effect,s.use_case,s.keywords_en.join(' ')].join(' ').toLocaleLowerCase().includes(term)));
    setText('results-count',`${filtered.length} / 24 个镜头`);$('empty').hidden=filtered.length>0;
    $('shot-grid').innerHTML=filtered.map(s=>{
      const sim=simulated.has(s.id),selected=s.id===current.id;
      return `<article class="shot-card"><button type="button" class="shot-select" data-select="${e(s.id)}" aria-pressed="${selected}" aria-label="学习${e(s.title)}"><div class="shot-thumb"><img src="${sim?`./assets/motion/${e(s.id)}.jpg`:diagram(s)}" data-fallback="${diagram(s)}" alt="${e(s.visual_cue)}" loading="lazy"><span class="thumb-badge">${sim?'▶ Blender 模拟':'构图示意图'}</span>${selected?'<span class="thumb-selected">正在学习</span>':''}</div><div class="card-info"><span class="card-number">${number(s)}</span><span><span class="card-title">${e(s.title_zh)}</span><span class="card-en">${e(s.title_en)}</span></span></div></button><div class="card-meta"><span>${e(s.category)}</span><a href="${e(s.source_urls[0])}" target="_blank" rel="noopener noreferrer" aria-label="${e(s.title_zh)}参考来源">参考来源 ↗</a></div></article>`;
    }).join('');
    $('shot-grid').querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{img.src=img.dataset.fallback;},{once:true}));
  }
  function select(id,scroll=true,writeHistory=true){
    const selected=shots.find(s=>s.id===id);if(!selected)return;current=selected;
    renderDetail();renderCatalog();
    if(writeHistory&&location.hash!==`#${current.id}`)history.pushState(null,'',`#${current.id}`);
    if(scroll){document.querySelector('.workbench').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});$('shot-title').tabIndex=-1;$('shot-title').focus({preventScroll:true});}
  }
  document.addEventListener('click',event=>{const button=event.target.closest('[data-select]');if(button)select(button.dataset.select);});
  const cats=['全部',...new Set(shots.map(s=>s.category))];
  $('category-filters').innerHTML=cats.map(c=>`<button type="button" data-category="${e(c)}" aria-pressed="${c===category}">${e(c)}</button>`).join('');
  $('category-filters').addEventListener('click',event=>{const b=event.target.closest('[data-category]');if(!b)return;category=b.dataset.category;document.querySelectorAll('[data-category]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.category===category)));renderCatalog();});
  $('search').addEventListener('input',renderCatalog);$('simulation-only').addEventListener('change',renderCatalog);
  $('reset').addEventListener('click',()=>{$('search').value='';$('simulation-only').checked=false;category='全部';document.querySelectorAll('[data-category]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.category===category)));renderCatalog();$('search').focus();});
  document.querySelectorAll('[data-lang]').forEach(button=>button.addEventListener('click',()=>{language=button.dataset.lang;renderPrompt();}));
  $('copy').addEventListener('click',async()=>{
    const text=current[`prompt_${language}`];let copied=false;
    try{if(navigator.clipboard){await navigator.clipboard.writeText(text);copied=true;}}catch{}
    if(!copied){const area=document.createElement('textarea');area.value=text;area.style.cssText='position:fixed;left:-9999px;top:0';area.setAttribute('aria-label','待复制提示词');document.body.append(area);area.select();try{copied=document.execCommand('copy');}catch{}area.remove();$('copy').focus();}
    if(copied)setText('copy-status',language==='zh'?'已复制中文提示词。':'English prompt copied.');
    else{const range=document.createRange();range.selectNodeContents($('prompt-text'));const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);setText('copy-status','自动复制不可用。已选中文字，请长按复制或按 Ctrl/Cmd + C。');$('prompt-text').focus();}
  });
  async function togglePlay(){
    const active=video;if(!active)return;
    if(!active.paused){active.pause();return;}
    if(active.ended)active.currentTime=0;
    try{await active.play();}catch{if(video===active)setText('media-caption','浏览器未能开始播放，请重试或切换构图图解。');}
  }
  $('play').addEventListener('click',togglePlay);
  $('restart').addEventListener('click',()=>{if(video){video.pause();video.currentTime=0;syncPlayer();}});
  $('step').addEventListener('click',()=>{if(video&&Number.isFinite(video.duration)){video.pause();video.currentTime=Math.min(Math.max(0,video.duration-1/12),(Math.floor(video.currentTime*12+0.0001)+1)/12);syncPlayer();}});
  $('seek').addEventListener('input',()=>{if(video&&video.readyState){video.currentTime=Number($('seek').value);syncPlayer();}});
  $('loop').addEventListener('change',()=>{if(video)video.loop=$('loop').checked;});
  document.querySelectorAll('[data-speed]').forEach(b=>b.addEventListener('click',()=>{speed=Number(b.dataset.speed);if(video)video.playbackRate=speed;document.querySelectorAll('[data-speed]').forEach(x=>x.setAttribute('aria-pressed',String(Number(x.dataset.speed)===speed)));}));
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.view;renderMedia();}));
  function adjacent(delta){const s=shots[shots.indexOf(current)+delta];if(s)select(s.id,false);}
  $('previous').addEventListener('click',()=>adjacent(-1));$('next').addEventListener('click',()=>adjacent(1));
  document.querySelector('.workbench').addEventListener('keydown',event=>{
    if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||event.target.matches('input,textarea,select,[contenteditable="true"]'))return;
    if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();adjacent(event.key==='ArrowRight'?1:-1);}
  });
  function fromHash(){
    const id=location.hash.slice(1);
    if(id==='catalog'||id==='workbench')return;
    const s=shots.find(s=>s.id===id);
    if(s)select(s.id,false,false);
    else{history.replaceState(null,'',`#dolly-in`);select('dolly-in',false,false);}
  }
  window.addEventListener('hashchange',fromHash);
  // Initialize detail even when the incoming URL points straight to the catalog.
  select('dolly-in',false,false);fromHash();
})();
