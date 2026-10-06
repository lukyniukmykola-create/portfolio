(() => {
  'use strict';
  const root=document.documentElement,body=document.body;
  // Reload starts the greeting at the top rather than restoring a mid-page offset.
  if('scrollRestoration' in history)history.scrollRestoration='manual';
  const systemMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer=matchMedia('(hover: hover) and (pointer: fine)');
  let motionOff=systemMotion.matches,motionChoice=null;
  try{const savedMotion=sessionStorage.getItem('ml-motion-mode');if(savedMotion==='full'||savedMotion==='reduced'){motionOff=savedMotion==='reduced';motionChoice=!motionOff;}}catch{}
  root.dataset.motion=motionOff?'reduced':'full';
  const motionButton=document.querySelector('#motion-toggle');
  const loader=document.querySelector('.preloader');
  const skipButton=document.querySelector('.skip-intro');
  let introActive=false,introClosing=false,introFrames=0,introStart=0,introWord=-1,introExitTimer=0;
  let gyro={redraw(){},resume(){},stop(){}};
  let cursor={updateMode(){}};
  let ambient={updateMode(){}};

  // Canvas intro: projected ellipses, restrained reflections, and orbit labels.
  const introCanvas=document.querySelector('.intro-canvas');
  const introContext=introCanvas.getContext('2d');
  let introW=1,introH=1,introMouseX=0,introMouseY=0;
  const turn=(p,x,y,z)=>{
    let [a,b,c]=p;
    let q=b*Math.cos(x)-c*Math.sin(x);c=b*Math.sin(x)+c*Math.cos(x);b=q;
    q=a*Math.cos(y)+c*Math.sin(y);c=-a*Math.sin(y)+c*Math.cos(y);a=q;
    q=a*Math.cos(z)-b*Math.sin(z);b=a*Math.sin(z)+b*Math.cos(z);a=q;
    return[a,b,c];
  };
  const resizeIntro=()=>{
    introW=innerWidth;introH=innerHeight;
    const dpr=Math.min(devicePixelRatio||1,1.5);
    introCanvas.width=Math.round(introW*dpr);introCanvas.height=Math.round(introH*dpr);
    introContext?.setTransform(dpr,0,0,dpr,0,0);
  };
  const introOrbits=[
    {radius:1.00,angles:[.32,.57,-.28],rate:.045},
    {radius:1.36,angles:[1.12,.22,.18],rate:-.035},
    {radius:1.08,angles:[.4,1.04,.55],rate:.032},
    {radius:1.55,angles:[1.15,-.7,-.3],rate:-.024}
  ];
  const drawIntro=t=>{
    if(!introContext)return;
    const c=introContext,w=introW,h=introH;
    c.clearRect(0,0,w,h);
    const radius=Math.min(h*.42,w*.32),cx=w/2+introMouseX,cy=h/2+introMouseY;
    const project=p=>{const scale=900/(900-p[2]);return[cx+p[0]*scale,cy+p[1]*scale];};
    const point=(a,orbit)=>turn([Math.cos(a)*radius*orbit.radius,Math.sin(a)*radius*orbit.radius,0],orbit.angles[0]+t*orbit.rate,orbit.angles[1],orbit.angles[2]);
    // Two almost invisible curved surfaces hold the scene together.
    const shade=c.createRadialGradient(cx-radius*.25,cy-radius*.35,radius*.05,cx,cy,radius*1.05);
    shade.addColorStop(0,'rgba(255,255,255,.01)');shade.addColorStop(.7,'rgba(255,255,255,.003)');shade.addColorStop(.91,'rgba(255,255,255,.023)');shade.addColorStop(.96,'rgba(255,255,255,.10)');shade.addColorStop(1,'rgba(255,255,255,0)');
    c.fillStyle=shade;c.beginPath();c.arc(cx,cy,radius*1.05,0,Math.PI*2);c.fill();
    // Large soft arcs extend beyond the scene, as in the reference transition.
    c.strokeStyle='rgba(255,255,255,.05)';c.lineWidth=1;
    c.beginPath();c.ellipse(cx,cy-h*.3,w*.63,h*.94,0,.12,Math.PI-.12);c.stroke();
    const mobile=w<600,count=mobile?3:4;
    for(let k=0;k<count;k++){
      const orbit=introOrbits[k];
      const samples=160,points=[];
      for(let j=0;j<=samples;j++){const a=j/samples*Math.PI*2,p=point(a,orbit);points.push({p,screen:project(p),a});}
      c.shadowBlur=0;c.strokeStyle="rgba(231,222,206,.16)";c.lineWidth=.7;c.beginPath();points.forEach((p,j)=>j?c.lineTo(...p.screen):c.moveTo(...p.screen));c.stroke();
      for(let j=0;j<samples;j++){
        const p=points[j],q=points[j+1],glint=Math.pow(Math.max(0,Math.cos(p.a-(1.2+k+t*.07))),52);
        if(glint<.015)continue;
        const z=p.p[2]/(radius*orbit.radius),alpha=.12+(z+1)*.08+glint*.72;
        c.strokeStyle=`rgba(255,239,211,${alpha})`;c.lineWidth=.7+glint*.9;
        c.beginPath();c.moveTo(...p.screen);c.lineTo(...q.screen);c.stroke();
      }
      c.shadowBlur=0;
      for(let j=0;j<2;j++){
        const nodeAngles=[-.4,-.85,2.3,3.45];
        const p=point(t*(.11+k*.02)+(j*2.5)+nodeAngles[k],orbit),q=project(p);
        const ballRadius=(j?3:k===1?14:6.5)*(1+p[2]/1200);
        const g=c.createRadialGradient(q[0]-ballRadius*.4,q[1]-ballRadius*.5,.1,q[0],q[1],ballRadius);
        g.addColorStop(0,'#fff6e7');g.addColorStop(.15,'#e9e3d8');g.addColorStop(.29,'#99948b');g.addColorStop(.44,'#292724');g.addColorStop(.82,'#090807');g.addColorStop(.93,'#807563');g.addColorStop(1,'#c6b99f');
        c.fillStyle=g;c.beginPath();c.arc(...q,ballRadius,0,Math.PI*2);c.fill();
      }
    }
    // A few labels rotate at different speeds and disappear behind the scene.
    const labels=['Python','Next.js','API','React','Automation','Databases','Telegram','SQL','Git'];
    const labelAngles=[-2.25,-.74,.11,3.13,2.47,1.78,-1.45,1.02,-2.84];
    const n=mobile?5:9;
    c.font=`${mobile?10:13}px -apple-system, Segoe UI, sans-serif`;
    for(let j=0;j<n;j++){
      const angle=labelAngles[j]+t*.045;
      const p=turn([Math.cos(angle)*radius*1.57,Math.sin(angle)*radius*1.25,0],.18,.14,-.15);
      const q=project(p),focus=labels[j]==='Next.js'||labels[j]==='API';
      const alpha=focus?.86+.14*Math.pow(Math.max(0,Math.cos(t*.7+j)),6):.24+.3*((Math.cos(angle-t*.08)+1)/2);
      if(Math.abs(q[0]-cx)<radius*.67&&Math.abs(q[1]-cy)<radius*.31)continue;
      if(focus){const halo=c.createRadialGradient(q[0],q[1],0,q[0],q[1],24);halo.addColorStop(0,'rgba(255,239,207,.16)');halo.addColorStop(.35,'rgba(255,234,194,.05)');halo.addColorStop(1,'rgba(255,234,194,0)');c.fillStyle=halo;c.beginPath();c.arc(q[0],q[1],24,0,Math.PI*2);c.fill();}
      c.fillStyle=`rgba(244,237,225,${alpha})`;c.textAlign=q[0]<cx?'right':'left';c.shadowColor='#fff5e3';c.shadowBlur=focus?5:0;c.fillText(labels[j],q[0]+(q[0]<cx?-14:14),q[1]+4);
      c.fillStyle=`rgba(255,250,237,${alpha})`;c.shadowColor='#fff0d4';c.shadowBlur=focus?16:5;c.beginPath();c.arc(q[0],q[1],focus?3:1.8,0,Math.PI*2);c.fill();c.shadowBlur=0;
    }
  };

  // Native scroll is the timeline: the hero stays pinned for one viewport.
  // User input disarms the countdown, and scrolling back never re-arms it.
  const heroScene=document.querySelector('.hero');
  const journey=document.createElement('div'),pin=document.createElement('div');
  journey.className='intro-journey';pin.className='intro-pin';
  heroScene.before(journey);journey.append(pin);pin.append(heroScene);
  const atmosphere=document.createElement('div');atmosphere.className='hero-atmosphere';atmosphere.setAttribute('aria-hidden','true');
  const horizonField=document.createElement('div');horizonField.className='horizon-field';atmosphere.append(horizonField);pin.prepend(atmosphere);
  body.classList.add('intro-scroll-ready');
  const irisShell=document.createElement('div');
  irisShell.className='intro-iris-shell';irisShell.setAttribute('aria-hidden','true');
  const waveSvg=document.createElementNS('http://www.w3.org/2000/svg','svg'),waveStroke=document.createElementNS('http://www.w3.org/2000/svg','path');
  waveSvg.setAttribute('preserveAspectRatio','none');waveStroke.setAttribute('fill','none');waveStroke.setAttribute('stroke','rgba(234,225,208,.3)');waveStroke.setAttribute('stroke-width','.8');waveSvg.append(waveStroke);irisShell.append(waveSvg);body.append(irisShell);
  const headerScene=document.querySelector('.header');
  const sceneActors=[...heroScene.querySelectorAll('.hero-enter')];
  const greeting=document.querySelector('.greeting');
  const greetingMeta=document.querySelector('.greeting-meta');
  const sceneHint=document.querySelector('.intro-scroll');
  const greetingWords=['Hello.','Привіт.','Ciao.','Bonjour.','Hola.','你好.','こんにちは.','Привіт.'];
  const greetingLanguages=['ENGLISH','УКРАЇНСЬКОЮ','ITALIANO','FRANÇAIS','ESPAÑOL','中文','日本語','SCROLL TO EXPLORE'];
  const greetingHolds=[380,420,260,300,260,280,350,300];
  const greetingEnds=greetingHolds.map((_,i)=>greetingHolds.slice(0,i+1).reduce((a,b)=>a+b,0));
  const greetingDuration=greetingEnds[greetingEnds.length-1];
  const irisSupported=typeof CSS!=='undefined'&&CSS.supports('clip-path','path("M0 0H10V10H0Z")');
  let journeyRange=Math.round(innerHeight*.9),journeyProgress=0,targetProgress=0;
  let sceneFrame=0,lastSceneFrame=0,lastOrbitFrame=-100,sceneEpoch=performance.now();
  let greetingEnded=false,autoArmed=true,manualJourney=false,autoTween=null;
  let lastStage=-1,returnWasVisible=false,hiddenAt=0;
  const clamp=value=>Math.max(0,Math.min(1,value));
  const ease=value=>value<.5?4*value*value*value:1-Math.pow(-2*value+2,3)/2;
  const scrollPosition=()=>clamp(scrollY/journeyRange);
  const canAnimateCore=()=>!introActive||(!autoTween&&journeyProgress>.25&&Math.abs(journeyProgress-targetProgress)<.002);
  const modalIsOpen=()=>!!document.querySelector('dialog[open]');

  const setGreeting=(index,animate=true)=>{
    if(index===introWord)return;
    introWord=index;greeting.textContent=greetingWords[index];greetingMeta.textContent=greetingLanguages[index];
    greeting.classList.remove('animate');
    if(animate&&!motionOff){void greeting.offsetWidth;greeting.style.animationDuration=`${greetingHolds[index]}ms`;greeting.classList.add('animate');}
  };
  const restartGreetings=arm=>{
    introStart=performance.now();introWord=-1;greetingEnded=false;autoArmed=arm;
    loader.dataset.startedAt=String(introStart);delete loader.dataset.closedAt;
    setGreeting(0);
  };

  const paintJourney=p=>{
    journeyProgress=p;introActive=p<.999;introClosing=false;
    const visible=p<.999,mainReady=p>=.92,headerReady=p>=.975;
    const contentSkip=document.activeElement?.classList.contains('skip');
    const restoreFocus=headerReady&&headerScene.hasAttribute('inert')&&(loader.contains(document.activeElement)||document.activeElement===skipButton||contentSkip);
    loader.style.visibility=visible?'visible':'hidden';loader.style.display='flex';
    loader.setAttribute('aria-hidden',String(!visible));
    skipButton.hidden=!visible;skipButton.disabled=!visible;skipButton.tabIndex=visible?0:-1;
    document.querySelector('#intro-motion').hidden=!motionOff||!visible;
    document.querySelector('main').inert=!mainReady;headerScene.inert=!headerReady;
    if(restoreFocus)(contentSkip?document.querySelector('main'):headerScene.querySelector('.logo')).focus({preventScroll:true});
    if(!headerReady&&headerScene.querySelector('.nav.open')){headerScene.querySelector('.nav').classList.remove('open');const menu=headerScene.querySelector('.menu-toggle');menu.setAttribute('aria-expanded','false');menu.textContent='Menu';}
    loader.dataset.progress=p.toFixed(3);loader.dataset.mode=manualJourney?'manual':autoTween?'automatic':'waiting';
    loader.dataset.state=p>=.999?'finished':p<=.001?'playing':'scrubbing';
    if(p>=.999&&!loader.dataset.closedAt)loader.dataset.closedAt=String(performance.now());
    headerScene.style.opacity=String(clamp((p-.45)/.5));
    headerScene.style.transform=motionOff?'none':`translateY(${(1-clamp(p/.85))*-10}px)`;
    heroScene.style.setProperty('--scene-scale',String(motionOff?1:.97+.03*p));
    heroScene.style.setProperty('--scene-contrast',String(motionOff?1:.86+.14*p));
    sceneActors.forEach((actor,index)=>{
      const isCore=actor.classList.contains('core-figure'),isName=actor.classList.contains('name-line');
      const start=isCore?.34:.18+Math.min(index,6)*.025;
      const end=isCore?.86:.62+Math.min(index,8)*.025;
      const reveal=clamp((p-start)/(end-start));
      actor.style.setProperty('--scene-opacity',String(reveal));
      let transform='none';
      if(!motionOff)transform=isCore?`scale(${.88+.12*reveal}) rotate(${(1-reveal)*-13}deg)`:isName?`translateY(${(1-reveal)*105}%)`:`translateY(${(1-reveal)*25}px)`;
      actor.style.setProperty('--scene-transform',transform);
    });
    loader.querySelector('.loader-center').style.opacity=String(clamp(1-(Math.max(0,p-.38)/.4)));
    loader.querySelector('.loader-center').style.transform=motionOff?'none':`translateY(${-p*innerHeight*.72}px) scale(${1-p*.06})`;
    loader.querySelector('.loader-bottom').style.transform=motionOff?'none':`translateY(${-p*innerHeight}px)`;
    introCanvas.style.transform=motionOff?'none':`translateY(${-p*innerHeight*.22}px) scale(${1-p*.05})`;
    loader.querySelectorAll('.intro-side').forEach(el=>{el.style.opacity=String(.35*clamp(1-p*1.8));el.style.transform=motionOff?'none':`translateY(${-p*innerHeight*.35}px)`;});
    sceneHint.textContent=p>.01?'SCROLL DOWN · SCROLL UP TO RETURN':'SCROLL TO REVEAL';
    if(motionOff||!irisSupported){loader.style.clipPath='none';loader.style.opacity=String(1-p);irisShell.style.visibility='hidden';}
    else{
      loader.style.opacity='1';
      const edge=innerHeight*(1-p),curve=Math.sin(p*Math.PI)*innerHeight*.12;
      loader.style.clipPath=p<=.001?'none':`path("M0 0H${innerWidth}V${edge}Q${innerWidth/2} ${edge+curve} 0 ${edge}Z")`;
      irisShell.style.visibility=visible&&p>.005?'visible':'hidden';
      waveSvg.setAttribute('viewBox',`0 0 ${innerWidth} ${innerHeight}`);waveStroke.setAttribute('d',`M0 ${edge}Q${innerWidth/2} ${edge+curve} ${innerWidth} ${edge}`);waveSvg.style.opacity=String(Math.sin(p*Math.PI)*.4);
    }
    if(canAnimateCore())gyro.resume();else gyro.stop();
    if(lastStage!==Math.round(p*1000)){lastStage=Math.round(p*1000);}
  };

  const ensureSceneFrame=()=>{if(!sceneFrame&&!document.hidden)sceneFrame=requestAnimationFrame(sceneLoop);};
  const moveToHero=(automatic=false)=>{
    if(scrollY>=journeyRange&&journeyProgress>=.999)return;
    autoArmed=false;
    if(!automatic)manualJourney=true;
    autoTween={start:performance.now(),from:scrollY,to:journeyRange,duration:motionOff?200:650};
    ensureSceneFrame();
  };
  const disarmAuto=()=>{manualJourney=true;autoArmed=false;autoTween=null;loader.dataset.mode='manual';ensureSceneFrame();};
  function sceneLoop(now){
    sceneFrame=0;
    const dt=Math.min((now-lastSceneFrame)||16,120);lastSceneFrame=now;
    const tweening=!!autoTween;
    if(autoTween){
      const amount=clamp((now-autoTween.start)/autoTween.duration);
      window.scrollTo({top:autoTween.from+(autoTween.to-autoTween.from)*ease(amount),behavior:'instant'});
      if(amount===1)autoTween=null;
    }
    targetProgress=scrollPosition();
    let next=motionOff||tweening||scrollY>journeyRange+35?targetProgress:journeyProgress+(targetProgress-journeyProgress)*(1-Math.exp(-dt/45));
    if(Math.abs(next-targetProgress)<.001)next=targetProgress;
    if(next<.001)next=0;if(next>.999)next=1;
    if(lastStage<0||Math.abs(next-journeyProgress)>.0001)paintJourney(next);
    if(!greetingEnded){
      const elapsed=now-introStart;let index=greetingEnds.findIndex(end=>elapsed<end);if(index<0)index=greetingWords.length-1;
      setGreeting(index);document.querySelector('.loader-progress').style.width=`${clamp(elapsed/greetingDuration)*100}%`;
      if(elapsed>=greetingDuration){greetingEnded=true;greeting.classList.remove('animate');if(autoArmed&&!manualJourney&&scrollY<2)moveToHero(true);}
    }
    if(journeyProgress<.85&&(motionOff?lastOrbitFrame<0:now-lastOrbitFrame>32)){
      drawIntro(motionOff?0:(now-sceneEpoch)/1000);lastOrbitFrame=now;
    }
    if(autoTween||!greetingEnded||journeyProgress<.999||Math.abs(journeyProgress-targetProgress)>.0001)ensureSceneFrame();
  }

  const measureJourney=(preserve=true)=>{
    const previous=journeyRange,currentY=scrollY;
    journeyRange=Math.max(360,Math.round(innerHeight*.9));
    journey.style.height=(pin.getBoundingClientRect().height+journeyRange)+'px';
    resizeIntro();lastOrbitFrame=-100;
    if(preserve&&previous>0){
      if(currentY<=previous+2)window.scrollTo({top:journeyRange*clamp(currentY/previous),behavior:'instant'});
      else window.scrollTo({top:currentY+journeyRange-previous,behavior:'instant'});
    }
    autoTween=null;targetProgress=scrollPosition();paintJourney(targetProgress);ensureSceneFrame();
  };
  const playIntro=()=>{
    autoTween=null;manualJourney=false;returnWasVisible=false;autoArmed=true;
    loader.classList.remove('exit');body.classList.remove('intro-active','intro-closing');
    window.scrollTo({top:0,behavior:'instant'});resizeIntro();lastOrbitFrame=-100;
    journeyProgress=targetProgress=0;restartGreetings(true);paintJourney(0);ensureSceneFrame();
  };
  const finishIntro=event=>{event?.preventDefault?.();moveToHero(false);};
  document.querySelector('.skip-intro').addEventListener('click',finishIntro);
  document.querySelector('.skip').addEventListener('click',finishIntro);

  window.addEventListener('scroll',()=>{
    const target=scrollPosition();
    if(target>.02)returnWasVisible=true;
    if(target<.005&&returnWasVisible&&!autoTween){returnWasVisible=false;manualJourney=true;restartGreetings(false);}
    targetProgress=target;ensureSceneFrame();
  },{passive:true});
  document.addEventListener('wheel',event=>{
    if(modalIsOpen()||event.ctrlKey||Math.abs(event.deltaY)<1)return;
    const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);
    const inJourney=scrollY<journeyRange-1||journeyProgress<.999||!!autoTween;
    if(inJourney||delta<0&&scrollY<=journeyRange+2){
      disarmAuto();
    }
  },{passive:true});
  let lastTouchY=0;
  document.addEventListener('touchstart',event=>{if(event.touches.length===1)lastTouchY=event.touches[0].clientY;},{passive:true});
  document.addEventListener('touchmove',event=>{
    if(modalIsOpen()||event.touches.length!==1)return;
    const y=event.touches[0].clientY,delta=lastTouchY-y;lastTouchY=y;
    if(scrollY<journeyRange||journeyProgress<.999||autoTween){
      if(Math.abs(delta)>2)disarmAuto();
    }
  },{passive:true});
  document.addEventListener('keydown',event=>{
    if(modalIsOpen()||event.defaultPrevented)return;
    if(event.key==='Escape'&&journeyProgress<.999){finishIntro(event);return;}
    if(event.target.closest('input,textarea,select')||event.target.isContentEditable)return;
    const steps={ArrowDown:70,ArrowUp:-70,PageDown:journeyRange*.45,PageUp:-journeyRange*.45,' ':journeyRange*.45};
    if(event.key===' '&&event.target.closest('button,a'))return;
    let step=steps[event.key];if(step===undefined)return;if(event.shiftKey&&event.key===' ')step=-step;
    if(scrollY<journeyRange||journeyProgress<.999||step<0&&scrollY<=journeyRange+2){
      event.preventDefault();disarmAuto();window.scrollTo({top:Math.max(0,scrollY+step),behavior:'instant'});ensureSceneFrame();
    }
  });
  document.addEventListener('pointermove',event=>{if(introActive&&!motionOff&&event.pointerType==='mouse'){introMouseX=(event.clientX/innerWidth-.5)*7;introMouseY=(event.clientY/innerHeight-.5)*5;}},{passive:true});
  window.addEventListener('resize',()=>measureJourney(true));
  window.addEventListener('load',()=>{if(autoArmed&&!manualJourney&&(!location.hash||location.hash==='#home')){window.scrollTo({top:0,behavior:'instant'});targetProgress=0;paintJourney(0);ensureSceneFrame();}});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){hiddenAt=performance.now();cancelAnimationFrame(sceneFrame);sceneFrame=0;}
    else{if(hiddenAt){const pause=performance.now()-hiddenAt;introStart+=pause;sceneEpoch+=pause;if(autoTween)autoTween.start+=pause;hiddenAt=0;}lastSceneFrame=performance.now();ensureSceneFrame();}
  });
  measureJourney(false);

  const updateMotionUI=()=>{motionButton.textContent=`Motion: ${motionOff?'off':'on'}`;motionButton.setAttribute('aria-pressed',String(!motionOff));motionButton.setAttribute('aria-label',motionOff?'Enable animations':'Reduce animations');};
  const setMotion=enabled=>{
    motionChoice=enabled;motionOff=!enabled;root.dataset.motion=motionOff?'reduced':'full';
    try{sessionStorage.setItem('ml-motion-mode',enabled?'full':'reduced');}catch{}
    body.classList.toggle('motion',enabled&&'IntersectionObserver' in window);
    if(motionOff){finishIntro();gyro.stop();document.querySelectorAll('.magnetic').forEach(el=>el.style.transform='');document.querySelectorAll('.project-card').forEach(el=>{el.style.setProperty('--tilt-x','0deg');el.style.setProperty('--tilt-y','0deg');});}
    cursor.updateMode();ambient.updateMode();gyro.redraw();if(enabled)gyro.resume();updateMotionUI();
  };
  motionButton.addEventListener('click',()=>setMotion(motionOff));
  document.querySelector('#replay-intro').addEventListener('click',playIntro);
  document.querySelector('#intro-motion').addEventListener('click',()=>{setMotion(true);playIntro();});
  systemMotion.addEventListener('change',()=>{if(motionChoice===null){setMotion(!systemMotion.matches);motionChoice=null;}});
  updateMotionUI();
  // The prototype always opens with its greeting scene, including reduced motion.
  playIntro();

  // Native scrolling stays uninterrupted; every reveal is a bounded local effect.
  const header=document.querySelector('.header');
  const updateHeader=()=>header.classList.toggle('scrolled',scrollY>journeyRange+30);
  addEventListener('scroll',updateHeader,{passive:true});updateHeader();
  const nav=document.querySelector('.nav'),menu=document.querySelector('.menu-toggle');
  const closeMenu=()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='Menu';};
  menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';nav.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'Close':'Menu';});
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('click',e=>{const link=e.target.closest('a[href^="#"]');if(!link||link.classList.contains('skip'))return;disarmAuto();});
  addEventListener('resize',()=>{if(innerWidth>760)closeMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){closeMenu();menu.focus();}});
  if('IntersectionObserver' in window){
    if(!motionOff)body.classList.add('motion');
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}}),{threshold:.08,rootMargin:'0px 0px -12px 0px'});
    document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
    const navObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)nav.querySelectorAll('a').forEach(a=>{if(a.hash==='#'+entry.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}),{rootMargin:'-12% 0px -67% 0px'});
    document.querySelectorAll('main section[id]').forEach(el=>navObserver.observe(el));
  }

  // The graphite horizon follows the pointer with gentle inertia and idle drift.
  // Both the planet and work window stop rendering when outside the viewport.
  let ambientFrame=0,ambientVisible=true,ambientLast=0,planetX=0,planetY=0,planetAimX=0,planetAimY=0;
  let workVisible=false,workFrame=0,workProgress=1;
  const workSection=document.querySelector('#work');
  const workOffset=()=>workSection.getBoundingClientRect().top-Number(workSection.dataset.shift||0);
  const paintWork=()=>{
    workFrame=0;
    if(motionOff){workSection.style.setProperty('--work-shift','0px');workSection.dataset.shift='0';return;}
    const target=clamp((innerHeight-workOffset())/(innerHeight*.65));
    workProgress+=(target-workProgress)*.16;
    if(Math.abs(target-workProgress)<.002)workProgress=target;
    const shift=(1-workProgress)*22;
    workSection.dataset.shift=String(shift);workSection.style.setProperty('--work-shift',shift.toFixed(2)+'px');
    workSection.style.setProperty('--work-edge',String(.12+.12*workProgress));
    if(Math.abs(target-workProgress)>.002)workFrame=requestAnimationFrame(paintWork);
  };
  const requestWork=()=>{if(!workFrame&&workVisible)workFrame=requestAnimationFrame(paintWork);};
  const ambientTick=now=>{
    ambientFrame=0;
    if(motionOff||document.hidden||!ambientVisible)return;
    const dt=Math.min(80,(now-ambientLast)||16);ambientLast=now;
    planetX+=(planetAimX-planetX)*(1-Math.exp(-dt/420));planetY+=(planetAimY-planetY)*(1-Math.exp(-dt/420));
    const t=now*.00016;
    horizonField.style.setProperty('--planet-x',(planetX+Math.sin(t)*2.2).toFixed(2)+'px');
    horizonField.style.setProperty('--planet-y',(planetY+Math.cos(t*.83)*1.6).toFixed(2)+'px');
    horizonField.style.setProperty('--planet-turn',(planetX*.018+Math.sin(t*.7)*.07).toFixed(3)+'deg');
    atmosphere.style.setProperty('--light-x',(54+planetX*.5).toFixed(2)+'%');
    atmosphere.style.setProperty('--light-y',(70+planetY*.3).toFixed(2)+'%');
    ambientFrame=requestAnimationFrame(ambientTick);
  };
  ambient.updateMode=()=>{
    if(motionOff||document.hidden||!ambientVisible){cancelAnimationFrame(ambientFrame);ambientFrame=0;}
    else if(!ambientFrame){ambientLast=performance.now();ambientFrame=requestAnimationFrame(ambientTick);}
    if(motionOff){horizonField.style.setProperty('--planet-x','0px');horizonField.style.setProperty('--planet-y','0px');horizonField.style.setProperty('--planet-turn','0deg');}
    requestWork();
  };
  document.addEventListener('pointermove',e=>{if(motionOff||!finePointer.matches||e.pointerType!=='mouse'||!ambientVisible)return;planetAimX=(e.clientX/innerWidth-.5)*18;planetAimY=(e.clientY/innerHeight-.5)*10;},{passive:true});
  document.documentElement.addEventListener('pointerleave',()=>{planetAimX=planetAimY=0;});
  addEventListener('blur',()=>{planetAimX=planetAimY=0;});
  addEventListener('scroll',requestWork,{passive:true});addEventListener('resize',requestWork);
  document.addEventListener('visibilitychange',()=>{ambient.updateMode();if(document.hidden){cancelAnimationFrame(workFrame);workFrame=0;}else requestWork();});
  if('IntersectionObserver' in window){
    new IntersectionObserver(entries=>{ambientVisible=entries[0].isIntersecting;ambient.updateMode();},{rootMargin:'0px'}).observe(pin);
    new IntersectionObserver(entries=>{workVisible=entries[0].isIntersecting;requestWork();},{rootMargin:'80px'}).observe(workSection);
  }else workVisible=true;
  ambient.updateMode();

  // Case studies use the project descriptions supplied in the master document.
  const projects={
    steelon:{title:'STEELON',category:'CURRENCY MONITORING / DESKTOP',problem:'Currency information changes frequently. Repeated manual checks make it harder to track historical values and respond to updates.',solution:'A Python desktop application combines API data, update logic, SQLite history and Telegram notifications in one monitoring workflow.',result:'Current values, historical data and notifications are available through a connected desktop and messaging workflow.',flow:['Collect API updates','Store the history','Display & notify'],tags:['Python','API','SQLite','Desktop','Telegram']},
    student:{title:'Student Activity System',category:'TELEGRAM / STUDENT WORKFLOWS',problem:'Tasks and participant submissions can become difficult to organize when they are spread across messages and separate records.',solution:'A Telegram-based system handles tasks and submissions, stores information persistently in SQLite, and provides activity statistics.',result:'A structured workflow for student tasks, submissions and statistics, accessible through Telegram.',flow:['Assign a task','Record submissions','Review the activity'],tags:['Python','Telegram Bot API','SQLite','Automation']},
    models:{title:'3D Automation Models',category:'ENGINEERING / INTERACTIVE VISUALIZATION',problem:'Automation systems can be difficult to understand from a flat description alone.',solution:'Interactive 3D models and technical visualizations make components and their relationships easier to explore.',result:'An interactive visual way to communicate and inspect automation concepts.',flow:['Model the components','Explore the system','Understand the links'],tags:['3D','Engineering','Visualization']}
  };
  const dialog=document.querySelector('#project-dialog');let dialogTrigger,currentProject=0;
  const projectKeys=Object.keys(projects);
  const showProject=key=>{
    const p=projects[key];currentProject=projectKeys.indexOf(key);
    for(const [id,key] of [['title','title'],['category','category'],['problem','problem'],['solution','solution'],['result','result']])document.querySelector('#dialog-'+id).textContent=p[key];
    document.querySelector('#dialog-tags').replaceChildren(...p.tags.map(text=>{const span=document.createElement('span');span.className='tag';span.textContent=text;return span;}));
    document.querySelector('#dialog-flow').replaceChildren(...p.flow.map((text,i)=>{const li=document.createElement('li'),number=document.createElement('span'),label=document.createElement('span');number.className='flow-number';number.textContent=String(i+1).padStart(2,'0');label.textContent=text;li.append(number,label);return li;}));
    const preview=document.querySelector(`[data-project="${key}"] .project-art svg`).cloneNode(true);
    const idMap=new Map();preview.querySelectorAll('[id]').forEach(el=>{const id=el.id,newId='case-'+id;idMap.set(id,newId);el.id=newId;});
    preview.querySelectorAll('*').forEach(el=>{for(const attribute of [...el.attributes]){let value=attribute.value;for(const [oldId,newId]of idMap)value=value.replaceAll(`url(#${oldId})`,`url(#${newId})`);if(value!==attribute.value)el.setAttribute(attribute.name,value);}});
    document.querySelector('#dialog-preview').replaceChildren(preview);
    document.querySelector('#project-count').textContent=String(currentProject+1).padStart(2,'0')+' / 03';
    dialog.scrollTop=0;
  };
  document.querySelectorAll('[data-project]').forEach(button=>button.addEventListener('click',()=>{
    dialogTrigger=button;showProject(button.dataset.project);
    dialog.showModal();body.style.overflow='hidden';
  }));
  document.querySelector('#previous-project').addEventListener('click',()=>showProject(projectKeys[(currentProject+2)%3]));
  document.querySelector('#next-project').addEventListener('click',()=>showProject(projectKeys[(currentProject+1)%3]));
  document.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close();});
  dialog.addEventListener('close',()=>{body.style.overflow='';dialogTrigger?.focus({preventScroll:true});});
  document.querySelector('#year').textContent=new Date().getFullYear();
  const resumeDialog=document.querySelector('#resume-dialog'),resumeButton=document.querySelector('#resume-button');
  let resumeTrigger=resumeButton;
  const openProfile=event=>{resumeTrigger=event.currentTarget;resumeDialog.showModal();body.style.overflow='hidden';};
  resumeButton.addEventListener('click',openProfile);
  document.querySelectorAll('.profile-open').forEach(button=>button.addEventListener('click',openProfile));
  document.querySelector('.resume-close').addEventListener('click',()=>resumeDialog.close());
  resumeDialog.addEventListener('click',e=>{const r=resumeDialog.getBoundingClientRect();if(e.target===resumeDialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))resumeDialog.close();});
  resumeDialog.addEventListener('close',()=>{body.style.overflow='';resumeTrigger.focus({preventScroll:true});});
  // Decode the embedded PDF once; Blob downloads also work when opened offline.
  const profileLinks=[...document.querySelectorAll('.resume-download')];
  try{
    const binary=atob(profileLinks[0].getAttribute('href').split(',')[1]);
    const bytes=Uint8Array.from(binary,char=>char.charCodeAt(0));
    const profileUrl=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
    profileLinks.forEach(link=>link.href=profileUrl);
    addEventListener('pagehide',event=>{if(!event.persisted)URL.revokeObjectURL(profileUrl);});
  }catch{/* The inline data URI remains a usable fallback. */}

  // White dot, soft trailing ring, and bounded magnetic motion.
  const dot=document.querySelector('.cursor-dot'),ring=document.querySelector('.cursor-ring');
  let mouseX=-100,mouseY=-100,ringX=-100,ringY=-100,cursorRaf=0;
  const pointerFrame=()=>{
    cursorRaf=0;if(motionOff||!finePointer.matches)return;
    ringX+=(mouseX-ringX)*.19;ringY+=(mouseY-ringY)*.19;
    dot.style.transform=`translate(${mouseX-2}px,${mouseY-2}px)`;
    const width=ring.offsetWidth;ring.style.transform=`translate(${ringX-width/2}px,${ringY-width/2}px)`;
    if(Math.abs(ringX-mouseX)+Math.abs(ringY-mouseY)>.2)cursorRaf=requestAnimationFrame(pointerFrame);
  };
  cursor.updateMode=()=>{body.classList.toggle('has-cursor',finePointer.matches&&!motionOff);if(motionOff){cancelAnimationFrame(cursorRaf);cursorRaf=0;}};
  cursor.updateMode();finePointer.addEventListener('change',()=>cursor.updateMode());
  document.addEventListener('pointermove',e=>{
    if(e.pointerType!=='mouse'||motionOff||!finePointer.matches)return;
    mouseX=e.clientX;mouseY=e.clientY;dot.classList.remove('is-hidden');ring.classList.remove('is-hidden');
    ring.classList.toggle('is-hover',!!e.target.closest('a,button:not(:disabled)'));
    if(!cursorRaf)cursorRaf=requestAnimationFrame(pointerFrame);
  },{passive:true});
  const hideCursor=()=>{dot.classList.add('is-hidden');ring.classList.add('is-hidden');};
  document.documentElement.addEventListener('pointerleave',hideCursor);addEventListener('blur',hideCursor);
  document.addEventListener('keydown',e=>{if(e.key==='Tab')hideCursor();});
  document.querySelectorAll('.magnetic').forEach(el=>{
    el.addEventListener('pointermove',e=>{if(motionOff||!finePointer.matches||e.pointerType!=='mouse')return;const r=el.getBoundingClientRect(),x=Math.max(-9,Math.min(9,(e.clientX-r.left-r.width/2)*.15)),y=Math.max(-7,Math.min(7,(e.clientY-r.top-r.height/2)*.22));el.style.transform=`translate(${x}px,${y}px)`;});
    el.addEventListener('pointerleave',()=>el.style.transform='');el.addEventListener('blur',()=>el.style.transform='');
  });
  document.querySelectorAll('.project-card').forEach(el=>{
    el.addEventListener('pointermove',e=>{if(motionOff||!finePointer.matches||e.pointerType!=='mouse')return;const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;el.style.setProperty('--mx',`${x*100}%`);el.style.setProperty('--my',`${y*100}%`);el.style.setProperty('--tilt-x',`${(y-.5)*-2.2}deg`);el.style.setProperty('--tilt-y',`${(x-.5)*2.2}deg`);});
    el.addEventListener('pointerleave',()=>{el.style.setProperty('--tilt-x','0deg');el.style.setProperty('--tilt-y','0deg');});
  });

  // The gyro is real geometry with reflective gunmetal shading, not a flat image.
  // Everything is inline; the embedded reference remains the WebGL fallback.
  const stage=document.querySelector('.core-stage'),canvas=document.querySelector('.core-canvas');
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true,powerPreference:'low-power',premultipliedAlpha:true});
  if(gl){
    try{
      const vertexSource=`
        attribute vec3 aPosition; attribute vec3 aNormal; attribute vec2 aUv;
        uniform mat3 uModel; uniform vec3 uOffset; uniform float uScale; uniform float uAspect;
        varying vec3 vPosition; varying vec3 vNormal; varying vec2 vUv;
        void main(){
          vec3 p=uModel*(aPosition*uScale)+uOffset;
          vPosition=p;vNormal=normalize(uModel*aNormal);vUv=aUv;
          gl_Position=vec4(p.x*2.35/uAspect,p.y*2.35,-p.z,3.7-p.z);
        }`;
      const fragmentSource=`
        precision highp float;
        varying vec3 vPosition; varying vec3 vNormal; varying vec2 vUv;
        uniform float uMaterial; uniform float uPulse; uniform float uMesh;
        uniform mat3 uRingInverse[3]; uniform vec3 uRingOffset[3]; uniform vec3 uRingRadii;
        uniform sampler2D uCoreMark;
        float sceneDistance(vec3 position){
          float distanceValue=10.;
          for(int i=0;i<3;i++){
            if(abs(float(i)-uMesh)<.25)continue;
            vec3 q=uRingInverse[i]*(position-uRingOffset[i]);
            float radius=i==0?uRingRadii.x:i==1?uRingRadii.y:uRingRadii.z;
            float width=i==0?.078:i==1?.065:.045;
            float depth=i==0?.033:i==1?.030:.025;
            vec2 edge=abs(vec2(length(q.xy)-radius,q.z))-vec2(width*.82,depth*.64);
            float d=length(max(edge,0.))+min(max(edge.x,edge.y),0.)-.008;
            distanceValue=min(distanceValue,d);
          }
          return distanceValue;
        }
        float softOcclusion(vec3 position,vec3 normal){
          float nearShade=clamp(1.-sceneDistance(position+normal*.065)/.065,0.,1.);
          float farShade=clamp(1.-sceneDistance(position+normal*.18)/.18,0.,1.);
          return clamp(1.-nearShade*.3-farShade*.18,.52,1.);
        }
        float studioPanel(vec3 r,vec3 direction,vec2 size,float softness){
          vec3 forward=normalize(direction),right=normalize(cross(vec3(0.,1.,0.),forward)),up=cross(forward,right);
          float facing=dot(r,forward);
          vec2 uv=vec2(dot(r,right),dot(r,up))/max(facing,.001);
          vec2 edge=abs(uv)-size;
          return (1.-smoothstep(-softness,softness,max(edge.x,edge.y)))*step(.001,facing);
        }
        vec3 environment(vec3 r){
          vec3 color=vec3(.022,.023,.025)+max(r.y,0.)*vec3(.045,.045,.046);
          color+=pow(max(dot(r,normalize(vec3(-.5,.22,-1.))),0.),4.)*vec3(.20,.21,.23);
          color+=studioPanel(r,vec3(-.58,.73,1.35),vec2(.18,1.1),.105)*vec3(2.7,2.66,2.58);
          color+=studioPanel(r,vec3(.75,.22,1.1),vec2(.52,.22),.16)*vec3(.95,.99,1.06);
          color+=studioPanel(r,vec3(-1.1,-.23,.72),vec2(.065,.86),.052)*vec3(2.2,2.13,1.99);
          color+=studioPanel(r,vec3(.15,1.,.28),vec2(.65,.13),.075)*vec3(1.8,1.75,1.65);
          color+=studioPanel(r,vec3(.9,-.45,.65),vec2(.075,.65),.055)*vec3(.75,.78,.82);
          color+=studioPanel(r,vec3(-.65,.55,-1.2),vec2(.19,.9),.065)*vec3(1.65,1.54,1.34);
          color+=studioPanel(r,vec3(.8,.3,-1.1),vec2(.45,.17),.08)*vec3(1.25,1.29,1.35);
          float ribbon=exp(-pow(r.x+r.y*.58-.12,2.)*260.)*smoothstep(.15,.8,r.z);
          color+=ribbon*vec3(1.5,1.37,1.14);
          return color;
        }
        void main(){
          vec3 N=normalize(vNormal),V=normalize(vec3(0.,0.,3.7)-vPosition);
          if(dot(N,V)<0.)N=-N;
          float facing=max(dot(N,V),0.);
          vec3 reflection=environment(reflect(-V,N));
          float fresnel=pow(1.-facing,3.);
          vec3 col=reflection*(.76+fresnel*.24)+vec3(.008);
          float diffuse=max(dot(N,normalize(vec3(-.7,1.,1.))),0.);
          if(uMaterial>0.5&&uMaterial<1.5){
            col=reflection*(.64+fresnel*.19)+vec3(.062,.064,.069)*(.4+diffuse*.8);
            col+=pow(1.-facing,8.)*vec3(.16,.148,.124);
            float arcLight=pow(max(cos(vUv.x*6.283185-1.8),0.),7.);
            col+=vec3(.07,.069,.065)*diffuse*diffuse;
            col+=vec3(.12,.115,.10)*arcLight*(.2+diffuse*.8);
            float glint=pow(max(dot(reflect(-normalize(vec3(-.6,.8,1.2)),N),V),0.),38.);
            col+=glint*vec3(1.5,1.48,1.42);
          }
          if(uMaterial>1.5&&uMaterial<2.5)col=vec3(.17,.16,.145);
          if(uMaterial>2.5)col=vec3(1.25,1.07,.82);
          if(uMaterial<.5){
            vec3 r=reflect(-V,N);
            float coreRibbon=exp(-pow(r.x+r.y*.58-.12,2.)*400.)*smoothstep(.05,.85,r.z);
            float coreKey=pow(max(dot(r,normalize(vec3(-.45,.55,1.))),0.),20.);
            col=(reflection*.06+coreKey*vec3(1.2,1.16,1.05)+coreRibbon*vec3(2.4,2.2,1.86)+vec3(.007))*uPulse;
            if(uMesh>3.5){float mark=texture2D(uCoreMark,vec2(.5-vUv.x,vUv.y)).a;col=mix(col,vec3(.14)+reflection*.08,mark*.78);}
          }
          if(uMaterial<1.5)col*=softOcclusion(vPosition,N);
          col=vec3(1.)-exp(-col*1.3);
          col=pow(col,vec3(.78));
          gl_FragColor=vec4(col,1.);
        }`;
      const compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(message);}return s;};
      const program=gl.createProgram(),vs=compile(gl.VERTEX_SHADER,vertexSource),fs=compile(gl.FRAGMENT_SHADER,fragmentSource);
      gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
      gl.deleteShader(vs);gl.deleteShader(fs);gl.useProgram(program);
      const attributes={position:gl.getAttribLocation(program,'aPosition'),normal:gl.getAttribLocation(program,'aNormal'),uv:gl.getAttribLocation(program,'aUv')};
      const uniforms={};for(const key of ['Model','Offset','Scale','Aspect','Material','Pulse','Mesh','CoreMark','RingRadii'])uniforms[key]=gl.getUniformLocation(program,'u'+key);
      uniforms.RingInverse=gl.getUniformLocation(program,'uRingInverse[0]');uniforms.RingOffset=gl.getUniformLocation(program,'uRingOffset[0]');
      const markCanvas=document.createElement('canvas');markCanvas.width=512;markCanvas.height=256;
      const markContext=markCanvas.getContext('2d');markContext.clearRect(0,0,512,256);markContext.font='500 54px -apple-system, Segoe UI, sans-serif';markContext.fillStyle='#fff';markContext.textAlign='center';markContext.textBaseline='middle';markContext.fillText('ML',128,128);
      const markTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,markTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,markCanvas);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.activeTexture(gl.TEXTURE0);
      const makeMesh=(vertices,indices)=>{
        const vertexBuffer=gl.createBuffer(),indexBuffer=gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
        return{vertexBuffer,indexBuffer,count:indices.length};
      };
      const torus=(radius,width,depth,segments=256,sides=56,roundness=.42)=>{
        const vertices=[],indices=[];
        for(let i=0;i<=segments;i++)for(let j=0;j<=sides;j++){
          const a=i/segments*Math.PI*2,b=j/sides*Math.PI*2,c=Math.cos(b),s=Math.sin(b);
          const rr=radius+Math.sign(c)*Math.pow(Math.abs(c),roundness)*width;
          const z=Math.sign(s)*Math.pow(Math.abs(s),roundness)*depth;
          const nr=Math.sign(c)*Math.pow(Math.abs(c),2-roundness)/width,nz=Math.sign(s)*Math.pow(Math.abs(s),2-roundness)/depth,l=Math.hypot(nr,nz);
          vertices.push(rr*Math.cos(a),rr*Math.sin(a),z,nr/l*Math.cos(a),nr/l*Math.sin(a),nz/l,i/segments,j/sides);
          if(i<segments&&j<sides){const n=i*(sides+1)+j;indices.push(n,n+sides+1,n+1,n+1,n+sides+1,n+sides+2);}
        }
        return makeMesh(vertices,indices);
      };
      const sphere=()=>{
        const vertices=[],indices=[],lat=26,lon=48;
        for(let i=0;i<=lat;i++)for(let j=0;j<=lon;j++){
          const a=i/lat*Math.PI,b=j/lon*Math.PI*2,x=Math.sin(a)*Math.cos(b),y=Math.cos(a),z=Math.sin(a)*Math.sin(b);
          vertices.push(x,y,z,x,y,z,j/lon,i/lat);
          if(i<lat&&j<lon){const n=i*(lon+1)+j;indices.push(n,n+1,n+lon+1,n+1,n+lon+2,n+lon+1);}
        }
        return makeMesh(vertices,indices);
      };
      const rings=[torus(1.13,.078,.033),torus(.90,.065,.030),torus(.67,.045,.025),torus(.43,.015,.016,192,20,1)];
      const orbit=torus(1.29,.006,.006,256,12,1),coreOrbit=torus(.37,.009,.009,192,16,1),ball=sphere();
      const mul=(a,b)=>{const r=[];for(let col=0;col<3;col++)for(let row=0;row<3;row++){let sum=0;for(let k=0;k<3;k++)sum+=a[k*3+row]*b[col*3+k];r[col*3+row]=sum;}return r;};
      const matrix=(x,y,z)=>{const cx=Math.cos(x),sx=Math.sin(x),cy=Math.cos(y),sy=Math.sin(y),cz=Math.cos(z),sz=Math.sin(z);return mul(mul([cz,sz,0,-sz,cz,0,0,0,1],[cy,0,-sy,0,1,0,sy,0,cy]),[1,0,0,0,cx,sx,0,-sx,cx]);};
      const apply=(m,p)=>[m[0]*p[0]+m[3]*p[1]+m[6]*p[2],m[1]*p[0]+m[4]*p[1]+m[7]*p[2],m[2]*p[0]+m[5]*p[1]+m[8]*p[2]];
      const draw=(mesh,model,offset,scale,material,pulse=1,meshId=-1)=>{
        gl.bindBuffer(gl.ARRAY_BUFFER,mesh.vertexBuffer);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.indexBuffer);
        for(const [key,size,offsetBytes] of [['position',3,0],['normal',3,12],['uv',2,24]]){gl.enableVertexAttribArray(attributes[key]);gl.vertexAttribPointer(attributes[key],size,gl.FLOAT,false,32,offsetBytes);}
        gl.uniformMatrix3fv(uniforms.Model,false,new Float32Array(model));gl.uniform3fv(uniforms.Offset,new Float32Array(offset));gl.uniform1f(uniforms.Scale,scale);gl.uniform1f(uniforms.Material,material);gl.uniform1f(uniforms.Pulse,pulse);gl.uniform1f(uniforms.Mesh,meshId);
        gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);
      };
      gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.clearColor(0,0,0,0);
      // A restrained bloom pass keeps only the strongest white/champagne glints.
      const postProgram=gl.createProgram();
      const postVS=compile(gl.VERTEX_SHADER,`attribute vec2 aPosition;varying vec2 vUv;void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`);
      const postFS=compile(gl.FRAGMENT_SHADER,`precision mediump float;varying vec2 vUv;uniform sampler2D uScene;uniform vec2 uTexel;
        vec3 bright(vec2 offset){vec3 c=texture2D(uScene,vUv+offset*uTexel).rgb;return c*smoothstep(.56,.91,max(max(c.r,c.g),c.b));}
        void main(){vec4 c=texture2D(uScene,vUv);
          vec4 n=texture2D(uScene,vUv+vec2(0.,1.)*uTexel),s=texture2D(uScene,vUv-vec2(0.,1.)*uTexel);
          vec4 e=texture2D(uScene,vUv+vec2(1.,0.)*uTexel),w=texture2D(uScene,vUv-vec2(1.,0.)*uTexel);
          float edge=max(max(abs(c.a-n.a),abs(c.a-s.a)),max(abs(c.a-e.a),abs(c.a-w.a)));
          vec3 weights=vec3(.299,.587,.114);float lc=dot(c.rgb,weights),ln=dot(n.rgb,weights),ls=dot(s.rgb,weights),le=dot(e.rgb,weights),lw=dot(w.rgb,weights);
          float contrast=max(max(max(lc,ln),max(ls,le)),lw)-min(min(min(lc,ln),min(ls,le)),lw);
          edge=max(edge,smoothstep(.10,.65,contrast)*.65);
          c=mix(c,(c*4.+n+s+e+w)*.125,smoothstep(.05,.8,edge)*.5);
          vec3 bloom=bright(vec2(0.))* .2;
          bloom+=(bright(vec2(2.,0.))+bright(vec2(-2.,0.))+bright(vec2(0.,2.))+bright(vec2(0.,-2.)))*.12;
          bloom+=(bright(vec2(4.,4.))+bright(vec2(-4.,4.))+bright(vec2(4.,-4.))+bright(vec2(-4.,-4.)))*.08;
          vec3 radiance=min(c.rgb+bloom*.16,vec3(1.));float alpha=max(c.a,max(max(radiance.r,radiance.g),radiance.b));
          gl_FragColor=vec4(radiance,alpha);}`);
      gl.attachShader(postProgram,postVS);gl.attachShader(postProgram,postFS);gl.linkProgram(postProgram);
      if(!gl.getProgramParameter(postProgram,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(postProgram));
      gl.deleteShader(postVS);gl.deleteShader(postFS);
      const postPosition=gl.getAttribLocation(postProgram,'aPosition'),postScene=gl.getUniformLocation(postProgram,'uScene'),postTexel=gl.getUniformLocation(postProgram,'uTexel');
      const postBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,postBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
      const sceneFramebuffer=gl.createFramebuffer(),sceneTexture=gl.createTexture(),sceneDepth=gl.createRenderbuffer();let bloomReady=false;
      const resizeBloom=()=>{
        gl.bindTexture(gl.TEXTURE_2D,sceneTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,canvas.width,canvas.height,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
        gl.bindRenderbuffer(gl.RENDERBUFFER,sceneDepth);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,canvas.width,canvas.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER,sceneFramebuffer);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,sceneTexture,0);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,sceneDepth);
        bloomReady=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;gl.bindFramebuffer(gl.FRAMEBUFFER,null);
      };
      let phase=0,last=performance.now(),frame=0,inView=true,hover=false,speed=1,burstTime=-10000,active=true;
      let tiltX=.06,tiltY=-.10,targetX=.06,targetY=-.10;
      let manualX=0,manualY=0,dragging=false,dragDistance=0,dragLastX=0,dragLastY=0,dragVelocityX=0,dragVelocityY=0;
      const render=now=>{
        if(!active)return;
        const dt=Math.min((now-last)/1000,.045);last=now;
        speed+=((hover||dragging?3.2:1)-speed)*.035;
        if(!motionOff){phase+=dt*.062*speed;tiltX+=(targetX-tiltX)*.045;tiltY+=(targetY-tiltY)*.045;
          if(!dragging){manualX+=dragVelocityX;manualY+=dragVelocityY;dragVelocityX*=.91;dragVelocityY*=.91;}}
        const elapsed=(now-burstTime)/1300,burst=!motionOff&&elapsed>=0&&elapsed<1?Math.sin(elapsed*Math.PI):0;
        gl.bindFramebuffer(gl.FRAMEBUFFER,bloomReady?sceneFramebuffer:null);gl.useProgram(program);gl.enable(gl.DEPTH_TEST);
        gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,markTexture);gl.uniform1i(uniforms.CoreMark,1);gl.activeTexture(gl.TEXTURE0);
        gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniform1f(uniforms.Aspect,canvas.width/canvas.height);
        const global=matrix(tiltX+manualX,tiltY+manualY+phase*.10,-.06);
        const axes=[[.76+Math.sin(phase*.65)*.13,-.58+phase*.19,-.48+phase*.14],[1.06+phase*.16,.38+Math.sin(phase*.7)*.17,.64-phase*.11],[.30+Math.sin(phase*.5)*.2,1.12-phase*.16,-.20+phase*.08],[.81,.19+phase*.18,-.79-phase*.15]];
        const ringModels=axes.map(angles=>mul(global,matrix(...angles)));
        const ringOffsets=ringModels.map((model,i)=>{const sign=i%2?1:-1;return[model[6]*burst*.22*sign,model[7]*burst*.22*sign,model[8]*burst*.22*sign];});
        const inverseData=[];ringModels.slice(0,3).forEach(m=>inverseData.push(m[0],m[3],m[6],m[1],m[4],m[7],m[2],m[5],m[8]));
        gl.uniformMatrix3fv(uniforms.RingInverse,false,new Float32Array(inverseData));gl.uniform3fv(uniforms.RingOffset,new Float32Array(ringOffsets.slice(0,3).flat()));gl.uniform3fv(uniforms.RingRadii,new Float32Array([1.13,.9,.67].map(value=>value*(1+burst*.025))));
        ringModels.forEach((model,i)=>draw(rings[i],model,ringOffsets[i],1+burst*.025,i===3?0:1,1,i));
        draw(ball,global,[0,0,0],.30,0,hover&&!motionOff?1.04+Math.sin(now*.004)*.04:1,4);
        draw(coreOrbit,mul(global,matrix(.95,.28,-.42+phase*.3)),[0,0,0],1,3);
        for(let i=0;i<2;i++){
          const orbitMatrix=mul(global,matrix(i? .48:1.1,i?.82:-.3,i?1.0:-.2));
          draw(orbit,orbitMatrix,[0,0,0],i?.93:1,2);
          for(let j=0;j<(i?1:2);j++){
            const angle=phase*(i?-1.5:1.1)+j*2.4+i*1.6+.45;
            const p=apply(orbitMatrix,[Math.cos(angle)*1.29*(i?.93:1),Math.sin(angle)*1.29*(i?.93:1),0]);
            draw(ball,global,p,j?.027:.042,0);
          }
        }
        if(bloomReady){gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.disable(gl.DEPTH_TEST);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(postProgram);
          for(const key of Object.keys(attributes))gl.disableVertexAttribArray(attributes[key]);
          gl.bindBuffer(gl.ARRAY_BUFFER,postBuffer);gl.enableVertexAttribArray(postPosition);gl.vertexAttribPointer(postPosition,2,gl.FLOAT,false,0,0);
          gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,sceneTexture);gl.uniform1i(postScene,0);gl.uniform2f(postTexel,1/canvas.width,1/canvas.height);gl.drawArrays(gl.TRIANGLES,0,3);}
      };
      const loop=now=>{frame=0;if(!active||motionOff||!canAnimateCore()||introClosing||!inView||document.hidden)return;render(now);frame=requestAnimationFrame(loop);};
      const resume=()=>{if(active&&!frame&&!motionOff&&canAnimateCore()&&!introClosing&&inView&&!document.hidden){last=performance.now();frame=requestAnimationFrame(loop);}};
      const stop=()=>{cancelAnimationFrame(frame);frame=0;};
      const resize=()=>{const size=stage.clientWidth||stage.getBoundingClientRect().width,dpr=innerWidth<600?Math.min(Math.max(devicePixelRatio||1,1.35),1.6):Math.min(Math.max(devicePixelRatio||1,1.75),2);canvas.width=Math.min(1280,Math.max(1,Math.round(size*dpr)));canvas.height=canvas.width;resizeBloom();render(performance.now());resume();};
      gyro={redraw(){if(motionOff){tiltX=targetX=.06;tiltY=targetY=-.10;}render(performance.now());},resume,stop};
      document.querySelector('.hero').addEventListener('pointermove',e=>{if(motionOff||dragging||!finePointer.matches||e.pointerType!=='mouse')return;const r=stage.getBoundingClientRect();targetY=(e.clientX-(r.left+r.width/2))/innerWidth*.42-.1;targetX=(e.clientY-(r.top+r.height/2))/innerHeight*.29+.06;},{passive:true});
      stage.addEventListener('pointerenter',()=>hover=true);stage.addEventListener('pointerleave',()=>hover=false);stage.addEventListener('focus',()=>hover=true);stage.addEventListener('blur',()=>hover=false);
      stage.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;dragging=true;dragDistance=0;dragLastX=e.clientX;dragLastY=e.clientY;dragVelocityX=dragVelocityY=0;stage.setPointerCapture(e.pointerId);stage.classList.add('is-dragging');ring.classList.add('is-dragging');});
      stage.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-dragLastX,dy=e.clientY-dragLastY;dragLastX=e.clientX;dragLastY=e.clientY;dragDistance+=Math.abs(dx)+Math.abs(dy);manualX+=dy*.006;manualY+=dx*.006;dragVelocityX=dy*.002;dragVelocityY=dx*.002;if(motionOff)render(performance.now());});
      const releaseDrag=e=>{if(!dragging)return;dragging=false;stage.classList.remove('is-dragging');ring.classList.remove('is-dragging');if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);if(motionOff)dragVelocityX=dragVelocityY=0;resume();};
      stage.addEventListener('pointerup',releaseDrag);stage.addEventListener('pointercancel',e=>{dragVelocityX=dragVelocityY=0;releaseDrag(e);});
      stage.addEventListener('click',()=>{if(dragDistance>5){dragDistance=0;return;}if(!motionOff){burstTime=performance.now();resume();}});
      stage.addEventListener('keydown',e=>{const directions={ArrowLeft:[0,-.18],ArrowRight:[0,.18],ArrowUp:[-.18,0],ArrowDown:[.18,0]};if(directions[e.key]){e.preventDefault();manualX+=directions[e.key][0];manualY+=directions[e.key][1];render(performance.now());}if(e.key==='Home'){e.preventDefault();manualX=manualY=dragVelocityX=dragVelocityY=0;render(performance.now());}});
      if('ResizeObserver' in window)new ResizeObserver(resize).observe(stage);else addEventListener('resize',resize);
      if('IntersectionObserver' in window)new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView)resume();else stop();},{rootMargin:'100px'}).observe(stage);
      document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else resume();});
      canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();active=false;stop();stage.classList.remove('has-webgl');});
      resize();stage.classList.add('has-webgl');
    }catch{
      // The embedded reference keeps the hero useful if graphics initialization fails.
      stage.classList.remove('has-webgl');
    }
  }
})();
