(() => {
  'use strict';
  const root=document.documentElement,body=document.body;
  // Reload starts the greeting at the top rather than restoring a mid-page offset.
  if('scrollRestoration' in history)history.scrollRestoration='manual';
  const systemMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer=matchMedia('(hover: hover) and (pointer: fine)');
  // Every page entry begins with the full intro. The compact settings menu can
  // still reduce motion for the current visit.
  let motionOff=false,motionChoice=true;
  root.dataset.motion=motionOff?'reduced':'full';
  const motionButton=document.querySelector('#motion-toggle');
  const settings=document.querySelector('.site-settings');
  const settingsPanel=document.querySelector('#settings-panel');
  const settingsToggle=document.querySelector('#settings-toggle');
  settingsToggle.setAttribute('aria-label','Open settings');
  const settingsClose=document.querySelector('#settings-close');
  const theme='dark';
  const loader=document.querySelector('.preloader');
  const skipButton=document.querySelector('.skip-intro');
  let introActive=false,introClosing=false,introFrames=0,introStart=0,introWord=-1,introExitTimer=0;
  let gyro={redraw(){},resume(){},stop(){},scene(){}};
  let cursor={updateMode(){}};
  let ambient={updateMode(){}};
  let night={updateMode(){}};
  let previews={updateMode(){},casePreview(){}};
  let extras={updateMode(){},renderCase(){},caseOpened(){},caseClosed(){},closeCase(){document.querySelector('#project-dialog').close();}};
  let demos={render(){},reset(){}};

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
    for(let k=0;k<count&&(!body.classList.contains('shared-core-ready')||motionOff);k++){
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
  // Manual input pauses the handoff without cancelling the initial countdown.
  // Returning after reaching the hero still allows exploring the greeting freely.
  const heroScene=document.querySelector('.hero');
  const journey=document.createElement('div'),pin=document.createElement('div');
  journey.className='intro-journey';pin.className='intro-pin';
  heroScene.before(journey);journey.append(pin);pin.append(heroScene);
  const atmosphere=document.createElement('div');atmosphere.className='hero-atmosphere';atmosphere.setAttribute('aria-hidden','true');
  const horizonField=document.createElement('div');horizonField.className='horizon-field';atmosphere.append(horizonField);pin.prepend(atmosphere);
  body.classList.add('intro-scroll-ready');
  const introCurtain=document.createElement('div');introCurtain.className='intro-curtain';introCurtain.setAttribute('aria-hidden','true');body.append(introCurtain);
  const irisShell=document.createElement('div');
  irisShell.className='intro-iris-shell';irisShell.setAttribute('aria-hidden','true');
  const waveSvg=document.createElementNS('http://www.w3.org/2000/svg','svg'),waveStroke=document.createElementNS('http://www.w3.org/2000/svg','path');
  waveSvg.setAttribute('preserveAspectRatio','none');waveStroke.setAttribute('fill','none');waveStroke.setAttribute('stroke','rgba(234,225,208,.3)');waveStroke.setAttribute('stroke-width','.8');waveSvg.append(waveStroke);irisShell.append(waveSvg);body.append(irisShell);
  const headerScene=document.querySelector('.header');
  const sceneActors=[...heroScene.querySelectorAll('.hero-enter')];
  const greeting=document.querySelector('.greeting');
  const greetingMeta=document.querySelector('.greeting-meta');
  const sceneHint=document.querySelector('.intro-scroll');
  const greetingWords=['Hello.','Привіт.','Ciao.','Bonjour.','Hola.','你好.','こんにちは.'];
  const greetingLanguages=['ENGLISH','УКРАЇНСЬКОЮ','ITALIANO','FRANÇAIS','ESPAÑOL','中文','日本語'];
  const greetingHolds=[380,420,280,300,280,300,420];
  const greetingEnds=greetingHolds.map((_,i)=>greetingHolds.slice(0,i+1).reduce((a,b)=>a+b,0));
  const greetingDuration=greetingEnds[greetingEnds.length-1];
  const irisSupported=typeof CSS!=='undefined'&&CSS.supports('clip-path','path("M0 0H10V10H0Z")');
  let journeyRange=Math.round(innerHeight*.9),journeyProgress=0,targetProgress=0;
  let sceneFrame=0,lastSceneFrame=0,lastOrbitFrame=-100,sceneEpoch=performance.now();
  let greetingEnded=false,autoArmed=true,manualJourney=false,autoTween=null;
  let heroVisited=false,lastJourneyInput=0;
  let lastStage=-1,returnWasVisible=false,hiddenAt=0;
  const clamp=value=>Math.max(0,Math.min(1,value));
  const ease=value=>value<.5?4*value*value*value:1-Math.pow(-2*value+2,3)/2;
  const smoothRange=(start,end,value)=>{const t=clamp((value-start)/(end-start));return t*t*(3-2*t);};
  const scrollPosition=()=>clamp(scrollY/journeyRange);
  const canAnimateCore=()=>!document.hidden;
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
    if(p>=.999)heroVisited=true;
    const visible=p<.999,mainReady=p>=.92,headerReady=p>=.975;
    const contentSkip=document.activeElement?.classList.contains('skip');
    const restoreFocus=headerReady&&headerScene.hasAttribute('inert')&&(loader.contains(document.activeElement)||document.activeElement===skipButton||contentSkip);
    loader.style.visibility=visible?'visible':'hidden';loader.style.display='flex';
    introCurtain.style.visibility=visible?'visible':'hidden';
    loader.setAttribute('aria-hidden',String(!visible));
    skipButton.hidden=!visible;skipButton.disabled=!visible;skipButton.tabIndex=visible?0:-1;
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
      const start=isCore?.72:.18+Math.min(index,6)*.025;
      const end=isCore?.99:.62+Math.min(index,8)*.025;
      const reveal=clamp((p-start)/(end-start));
      actor.style.setProperty('--scene-opacity',String(reveal));
      let transform='none';
      if(!motionOff&&!isCore)transform=isName?`translateY(${(1-reveal)*105}%)`:`translateY(${(1-reveal)*25}px)`;
      actor.style.setProperty('--scene-transform',transform);
    });
    loader.querySelector('.loader-center').style.opacity=String(1-smoothRange(.05,.39,p));
    loader.querySelector('.loader-center').style.transform=motionOff?'none':`translateY(${-smoothRange(0,.6,p)*innerHeight*.18}px) scale(${1-smoothRange(0,.6,p)*.12})`;
    loader.querySelector('.loader-bottom').style.opacity=String(1-smoothRange(.03,.25,p));
    loader.querySelector('.loader-bottom').style.transform=motionOff?'none':`translateY(${-p*innerHeight*.16}px)`;
    introCanvas.style.transform=motionOff?'none':`translateY(${-p*innerHeight*.22}px) scale(${1-p*.05})`;
    introCanvas.style.opacity=String(1-smoothRange(.04,.5,p));
    loader.querySelectorAll('.intro-side').forEach(el=>{el.style.opacity=String(.35*clamp(1-p*1.8));el.style.transform=motionOff?'none':`translateY(${-p*innerHeight*.35}px)`;});
    sceneHint.textContent=p>.01?'SCROLL DOWN · SCROLL UP TO RETURN':'SCROLL TO REVEAL';
    if(motionOff||!irisSupported){loader.style.clipPath='none';introCurtain.style.clipPath='none';loader.style.opacity=String(1-p);introCurtain.style.opacity=String(1-p);irisShell.style.visibility='hidden';}
    else{
      loader.style.opacity='1';
      introCurtain.style.opacity='1';
      const edge=innerHeight*(1-p),curve=Math.sin(p*Math.PI)*innerHeight*.12;
      loader.style.clipPath=p<=.001?'none':`path("M0 0H${innerWidth}V${edge}Q${innerWidth/2} ${edge+curve} 0 ${edge}Z")`;
      introCurtain.style.clipPath=loader.style.clipPath;
      irisShell.style.visibility=visible&&p>.005?'visible':'hidden';
      waveSvg.setAttribute('viewBox',`0 0 ${innerWidth} ${innerHeight}`);waveStroke.setAttribute('d',`M0 ${edge}Q${innerWidth/2} ${edge+curve} ${innerWidth} ${edge}`);waveSvg.style.opacity=String(Math.sin(p*Math.PI)*.4);
    }
    gyro.scene(p);
    if(canAnimateCore())gyro.resume();else gyro.stop();
    if(lastStage!==Math.round(p*1000)){lastStage=Math.round(p*1000);}
  };

  const ensureSceneFrame=()=>{if(!sceneFrame&&!document.hidden)sceneFrame=requestAnimationFrame(sceneLoop);};
  const moveToHero=(automatic=false)=>{
    if(scrollY>=journeyRange&&journeyProgress>=.999)return;
    autoArmed=false;
    manualJourney=!automatic;
    autoTween={start:performance.now(),from:scrollY,to:journeyRange,duration:motionOff?200:900};
    ensureSceneFrame();
  };
  const takeManualControl=()=>{
    manualJourney=true;lastJourneyInput=performance.now();
    if(autoTween&&!heroVisited)autoArmed=true;
    autoTween=null;loader.dataset.mode='manual';ensureSceneFrame();
  };
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
      if(elapsed>=greetingDuration){greetingEnded=true;greeting.classList.remove('animate');greetingMeta.textContent='SCROLL TO EXPLORE';}
    }
    if(greetingEnded&&autoArmed&&!autoTween&&!modalIsOpen()&&scrollY<journeyRange-1&&now-lastJourneyInput>180)moveToHero(true);
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
    if(autoTween&&!heroVisited)autoArmed=true;
    autoTween=null;targetProgress=scrollPosition();paintJourney(targetProgress);ensureSceneFrame();
  };
  const playIntro=()=>{
    autoTween=null;manualJourney=false;returnWasVisible=false;autoArmed=true;heroVisited=false;lastJourneyInput=0;
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
    if(target<.005&&returnWasVisible&&!autoTween){returnWasVisible=false;manualJourney=true;if(!heroVisited)restartGreetings(true);}
    targetProgress=target;ensureSceneFrame();
  },{passive:true});
  document.addEventListener('wheel',event=>{
    if(modalIsOpen()||event.ctrlKey||Math.abs(event.deltaY)<1)return;
    const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);
    const inJourney=scrollY<journeyRange-1||journeyProgress<.999||!!autoTween;
    if(inJourney||delta<0&&scrollY<=journeyRange+2){
      takeManualControl();
    }
  },{passive:true});
  let lastTouchY=0;
  document.addEventListener('touchstart',event=>{if(event.touches.length===1)lastTouchY=event.touches[0].clientY;},{passive:true});
  document.addEventListener('touchmove',event=>{
    if(modalIsOpen()||event.touches.length!==1)return;
    const y=event.touches[0].clientY,delta=lastTouchY-y;lastTouchY=y;
    if(scrollY<journeyRange||journeyProgress<.999||autoTween){
      if(Math.abs(delta)>2)takeManualControl();
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
      event.preventDefault();takeManualControl();window.scrollTo({top:Math.max(0,scrollY+step),behavior:'instant'});ensureSceneFrame();
    }
  });
  document.addEventListener('pointermove',event=>{if(introActive&&!motionOff&&event.pointerType==='mouse'){introMouseX=(event.clientX/innerWidth-.5)*7;introMouseY=(event.clientY/innerHeight-.5)*5;}},{passive:true});
  let measuredViewportWidth=innerWidth,journeyResizeFrame=0;
  const handleJourneyResize=()=>{
    journeyResizeFrame=0;
    const widthChanged=Math.abs(innerWidth-measuredViewportWidth)>2;
    measuredViewportWidth=innerWidth;
    // Mobile browser chrome changes the viewport height while the page is moving.
    // Re-measuring the intro in that moment used to shift the document back upward.
    if(widthChanged||scrollY<=journeyRange+2)measureJourney(true);
    else{resizeIntro();lastOrbitFrame=-100;ensureSceneFrame();}
  };
  window.addEventListener('resize',()=>{if(!journeyResizeFrame)journeyResizeFrame=requestAnimationFrame(handleJourneyResize);});
  window.addEventListener('load',()=>{if(scrollY<2&&autoArmed&&!manualJourney&&(!location.hash||location.hash==='#home')){targetProgress=0;paintJourney(0);ensureSceneFrame();}});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){hiddenAt=performance.now();cancelAnimationFrame(sceneFrame);sceneFrame=0;}
    else{if(hiddenAt){const pause=performance.now()-hiddenAt;introStart+=pause;sceneEpoch+=pause;if(autoTween)autoTween.start+=pause;hiddenAt=0;}lastSceneFrame=performance.now();ensureSceneFrame();}
  });
  measureJourney(false);

  const updateMotionUI=()=>{motionButton.querySelector('strong').textContent=motionOff?'Off':'On';motionButton.setAttribute('aria-pressed',String(!motionOff));motionButton.setAttribute('aria-label',motionOff?'Turn animations on':'Turn animations off');};
  const setMotion=enabled=>{
    motionChoice=enabled;motionOff=!enabled;root.dataset.motion=motionOff?'reduced':'full';
    try{localStorage.setItem('ml-motion-mode',enabled?'full':'reduced');}catch{}
    body.classList.toggle('motion',enabled&&'IntersectionObserver' in window);
    if(motionOff){finishIntro();gyro.stop();document.querySelectorAll('.magnetic').forEach(el=>el.style.transform='');document.querySelectorAll('.project-card').forEach(el=>{el.style.setProperty('--tilt-x','0deg');el.style.setProperty('--tilt-y','0deg');});}
    cursor.updateMode();ambient.updateMode();night.updateMode();previews.updateMode();extras.updateMode();gyro.scene(journeyProgress);gyro.redraw();if(enabled)gyro.resume();updateMotionUI();
  };
  motionButton.addEventListener('click',()=>setMotion(motionOff));
  document.querySelector('#replay-intro').addEventListener('click',playIntro);
  systemMotion.addEventListener('change',()=>{if(motionChoice===null){setMotion(!systemMotion.matches);motionChoice=null;}});
  updateMotionUI();
  const setSettings=open=>{
    settings.dataset.open=String(open);settingsToggle.setAttribute('aria-expanded',String(open));settingsToggle.setAttribute('aria-label',open?'Close settings':'Open settings');settingsPanel.hidden=!open;
    if(open)settingsPanel.querySelector('button').focus({preventScroll:true});
  };
  settingsToggle.addEventListener('click',()=>setSettings(settings.dataset.open!=='true'));
  settingsClose.addEventListener('click',()=>{setSettings(false);settingsToggle.focus({preventScroll:true});});
  document.addEventListener('click',event=>{if(settings.dataset.open==='true'&&!event.target.closest('.site-settings'))setSettings(false);});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&settings.dataset.open==='true'){setSettings(false);settingsToggle.focus({preventScroll:true});}});

  // Native scrolling stays uninterrupted; every reveal is a bounded local effect.
  const header=document.querySelector('.header');
  const updateHeader=()=>header.classList.toggle('scrolled',scrollY>journeyRange+30);
  addEventListener('scroll',updateHeader,{passive:true});updateHeader();
  const nav=document.querySelector('.nav'),menu=document.querySelector('.menu-toggle');
  const closeMenu=()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='Menu';};
  menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';nav.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'Close':'Menu';});
  const navLinks=[...nav.querySelectorAll('a')];
  const pageSections=[...document.querySelectorAll('main section[id]')];
  let navLock=null,navFrame=0;
  const markNavigation=id=>navLinks.forEach(link=>{if(link.hash==='#'+id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
  const updateNavigation=()=>{
    navFrame=0;
    if(navLock){
      const progress=motionOff?1:clamp((performance.now()-navLock.started)/navLock.duration);
      window.scrollTo({top:navLock.from+(navLock.top-navLock.from)*ease(progress),behavior:'instant'});
      if(progress>=1){navLock=null;nav.dataset.scrolling='false';}
      else{markNavigation(navLock.id);navFrame=requestAnimationFrame(updateNavigation);return;}
    }
    const marker=header.getBoundingClientRect().height+Math.min(innerHeight*.22,170);
    let active='home';
    for(const section of pageSections)if(section.getBoundingClientRect().top<=marker)active=section.id;
    if(scrollY+innerHeight>=document.documentElement.scrollHeight-5)active='contact';
    markNavigation(active);
  };
  const requestNavigation=()=>{if(!navFrame)navFrame=requestAnimationFrame(updateNavigation);};
  const navigateSection=(id,push=true)=>{
    const target=document.getElementById(id);if(!target)return;
    closeMenu();takeManualControl();autoArmed=false;
    const offset=header.getBoundingClientRect().height+(innerWidth<=760?10:14);
    const desired=id==='home'?0:scrollY+target.getBoundingClientRect().top-offset;
    const top=Math.max(0,Math.min(document.documentElement.scrollHeight-innerHeight,desired));
    // A direct menu jump exposes its content immediately; scrolling reveals later rows.
    target.querySelectorAll('.reveal').forEach(element=>{if(scrollY+element.getBoundingClientRect().top<top+innerHeight+110)element.classList.add('visible','via-navigation');});
    navLock={id,top,from:scrollY,started:performance.now(),duration:Math.min(1000,Math.max(500,Math.sqrt(Math.abs(top-scrollY))*14))};markNavigation(id);
    nav.dataset.scrolling='true';
    if(push&&location.hash!=='#'+id)history.pushState(null,'','#'+id);
    requestNavigation();
  };
  document.addEventListener('click',e=>{
    const link=e.target.closest('a[href^="#"]');
    if(!link||link.classList.contains('skip')||e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
    const id=link.getAttribute('href').slice(1);if(!document.getElementById(id))return;
    e.preventDefault();navigateSection(id);
  });
  const unlockNavigation=()=>{navLock=null;nav.dataset.scrolling='false';requestNavigation();};
  addEventListener('scroll',requestNavigation,{passive:true});
  addEventListener('wheel',unlockNavigation,{passive:true});addEventListener('touchstart',unlockNavigation,{passive:true});
  addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key))unlockNavigation();});
  addEventListener('resize',()=>{if(navLock)navigateSection(navLock.id,false);else requestNavigation();});
  addEventListener('popstate',()=>navigateSection(location.hash.slice(1)||'home',false));
  requestNavigation();
  addEventListener('resize',()=>{if(innerWidth>760)closeMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){closeMenu();menu.focus();}});
  if('IntersectionObserver' in window){
    if(!motionOff)body.classList.add('motion');
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}}),{threshold:.05,rootMargin:'0px 0px 110px 0px'});
    document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
  }

  // The graphite horizon follows the pointer with gentle inertia and idle drift.
  // Both the planet and work window stop rendering when outside the viewport.
  let ambientFrame=0,ambientVisible=true,ambientLast=0,planetX=0,planetY=0,planetAimX=0,planetAimY=0;
  let workVisible=false,workFrame=0,workProgress=1;
  const workSection=document.querySelector('#work');
  const workOffset=()=>workSection.getBoundingClientRect().top;
  const paintWork=()=>{
    workFrame=0;
    // Keep the section in document flow. Only its border response is animated;
    // moving the full section here used to fight reveal transforms and resize.
    workSection.style.removeProperty('--work-shift');workSection.dataset.shift='0';
    if(motionOff)return;
    const target=clamp((innerHeight-workOffset())/(innerHeight*.65));
    workProgress+=(target-workProgress)*.16;
    if(Math.abs(target-workProgress)<.002)workProgress=target;
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

  // __PROJECT_DEMOS__

  // Case studies use verified behavior from the original project chats and files.
  const projects={
    vario:{title:'Warrio',category:'WARRANTY PLATFORM / WEB',problem:'Sales, warranty activation, installation confirmation and customer documents often live in separate tools, making the lifecycle harder to control.',solution:'A role-based web platform connects sales registration, protected warranty activation, installation records, PDF documents, email delivery and public QR verification.',result:'A connected warranty workflow for teams, dealers and customers, backed by Supabase and server-side automation.',flow:['Register a sale','Activate the warranty','Verify & manage'],tags:['Web','Supabase','RLS','Resend','PDF']},
    steelon:{title:'STEELON',category:'CURRENCY MONITORING / WINDOWS DESKTOP',problem:'Exchange rates arrive from several sources and can change throughout the day. Repeated manual checks make comparison, history and timely updates difficult.',solution:'A PySide6 desktop application collects official and channel rates, keeps a local history, marks stale sources and connects rate changes to local and Telegram notifications.',result:'One Windows workspace for current quotes, source comparison, historical trends and notification-ready updates.',flow:['Collect live sources','Compare & store history','Display & notify'],tags:['Python','PySide6','API','OCR','Telegram']},
    student:{title:'Student Activity',category:'STUDENT WORKFLOWS / WINDOWS + TELEGRAM',problem:'Tasks, participant responses and statistics become difficult to manage when the information is scattered across messages and separate records.',solution:'A Windows administration interface works with a Python, Telegram Bot API and SQLite backend to manage tasks, people, submissions, workspaces and activity history.',result:'A structured control center for assigning tasks, recording completion and reviewing student participation.',flow:['Create a task','Record participation','Review statistics'],tags:['Python','Telegram Bot API','SQLite','Windows']}
  };
  const dialog=document.querySelector('#project-dialog');let dialogTrigger,currentProject=0;
  const projectKeys=Object.keys(projects);
  const showProject=key=>{
    const p=projects[key];currentProject=projectKeys.indexOf(key);
    for(const [id,key] of [['title','title'],['category','category'],['problem','problem'],['solution','solution'],['result','result']])document.querySelector('#dialog-'+id).textContent=p[key];
    document.querySelector('#dialog-tags').replaceChildren(...p.tags.map(text=>{const span=document.createElement('span');span.className='tag';span.textContent=text;return span;}));
    document.querySelector('#dialog-flow').replaceChildren(...p.flow.map((text,i)=>{const li=document.createElement('li'),number=document.createElement('span'),label=document.createElement('span');number.className='flow-number';number.textContent=String(i+1).padStart(2,'0');label.textContent=text;li.append(number,label);return li;}));
    extras.renderCase(key);
    demos.render(key);
    const preview=document.querySelector(`[data-project="${key}"] .project-art svg`).cloneNode(true);
    const idMap=new Map();preview.querySelectorAll('[id]').forEach(el=>{const id=el.id,newId='case-'+id;idMap.set(id,newId);el.id=newId;});
    preview.querySelectorAll('*').forEach(el=>{for(const attribute of [...el.attributes]){let value=attribute.value;for(const [oldId,newId]of idMap)value=value.replaceAll(`url(#${oldId})`,`url(#${newId})`);if(value!==attribute.value)el.setAttribute(attribute.name,value);}});
    document.querySelector('#dialog-preview').replaceChildren(preview);
    if(dialog.open)previews.casePreview(document.querySelector('#dialog-preview'),key);
    document.querySelector('#project-count').textContent=String(currentProject+1).padStart(2,'0')+' / '+String(projectKeys.length).padStart(2,'0');
    dialog.scrollTop=0;
  };
  const openProject=(key,trigger)=>{
    if(!projects[key])return;
    unlockNavigation();
    dialogTrigger=trigger;showProject(key);
    dialog.showModal();body.style.overflow='hidden';
    previews.casePreview(document.querySelector('#dialog-preview'),key);extras.caseOpened();
  };
  document.querySelectorAll('.project-card[data-project]').forEach(button=>button.addEventListener('click',()=>openProject(button.dataset.project,button)));
  document.querySelector('#previous-project').addEventListener('click',()=>showProject(projectKeys[(currentProject+2)%3]));
  document.querySelector('#next-project').addEventListener('click',()=>showProject(projectKeys[(currentProject+1)%3]));
  document.querySelector('.dialog-close').addEventListener('click',()=>extras.closeCase());
  dialog.addEventListener('cancel',event=>{event.preventDefault();extras.closeCase();});
  dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))extras.closeCase();});
  dialog.addEventListener('close',()=>{body.style.overflow='';extras.caseClosed();dialogTrigger?.focus({preventScroll:true});});
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

  // A light orbit cursor with inertia, velocity stretch and contextual labels.
  const dot=document.querySelector('.cursor-dot'),ring=document.querySelector('.cursor-ring');
  const cursorLabel=document.createElement('span');cursorLabel.className='cursor-label';cursorLabel.setAttribute('aria-hidden','true');body.append(cursorLabel);
  let mouseX=-100,mouseY=-100,ringX=-100,ringY=-100,cursorRaf=0,pointerLast=0,cursorScale=1,cursorTargetScale=1;
  const pointerFrame=now=>{
    cursorRaf=0;if(motionOff||!finePointer.matches)return;
    const dt=Math.min(64,(now-pointerLast)||16);pointerLast=now;
    const dx=mouseX-ringX,dy=mouseY-ringY,amount=1-Math.exp(-dt/65);
    ringX+=dx*amount;ringY+=dy*amount;cursorScale+=(cursorTargetScale-cursorScale)*amount;
    const stretch=Math.min(.2,Math.hypot(dx,dy)*.003),angle=Math.atan2(dy,dx);
    dot.style.transform=`translate3d(${mouseX-2.5}px,${mouseY-2.5}px,0)`;
    ring.style.transform=`translate3d(${ringX-18}px,${ringY-18}px,0) rotate(${angle}rad) scale(${cursorScale*(1+stretch)},${cursorScale*(1-stretch*.55)})`;
    cursorLabel.style.transform=`translate3d(${ringX+27}px,${ringY-13}px,0)`;
    if(Math.hypot(dx,dy)>.15||Math.abs(cursorScale-cursorTargetScale)>.005)cursorRaf=requestAnimationFrame(pointerFrame);
  };
  cursor.updateMode=()=>{body.classList.toggle('has-cursor',finePointer.matches&&!motionOff);if(motionOff||!finePointer.matches){cancelAnimationFrame(cursorRaf);cursorRaf=0;cursorLabel.classList.remove('is-visible');}};
  cursor.updateMode();finePointer.addEventListener('change',()=>cursor.updateMode());
  document.addEventListener('pointermove',e=>{
    if(e.pointerType!=='mouse'||motionOff||!finePointer.matches)return;
    const firstMove=mouseX<0||dot.classList.contains('is-hidden');
    mouseX=e.clientX;mouseY=e.clientY;dot.classList.remove('is-hidden');ring.classList.remove('is-hidden');
    if(firstMove){ringX=mouseX;ringY=mouseY;pointerLast=performance.now();}
    const interactive=e.target.closest('a,button:not(:disabled)'),core=e.target.closest('.core-stage'),project=e.target.closest('[data-project]');
    ring.classList.toggle('is-hover',!!interactive);ring.classList.toggle('is-core',!!core);
    cursorTargetScale=core?1.85:interactive?1.45:1;
    const label=core?'DRAG':project?'VIEW':e.target.closest('.profile-open,#resume-button')?'PROFILE':e.target.closest('.resume-download')?'PDF':'';
    if(cursorLabel.textContent!==label)cursorLabel.textContent=label;
    cursorLabel.classList.toggle('is-visible',!!label&&!modalIsOpen());
    if(!cursorRaf)cursorRaf=requestAnimationFrame(pointerFrame);
  },{passive:true});
  const hideCursor=()=>{dot.classList.add('is-hidden');ring.classList.add('is-hidden');cursorLabel.classList.remove('is-visible');};
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

  // __SECTION_NIGHT__
  // __PROJECT_PREVIEWS__
  // __PORTFOLIO_EXTRAS__

  // The gyro is real geometry with reflective gunmetal shading, not a flat image.
  // Everything is inline; the embedded reference remains the WebGL fallback.
  const stage=document.querySelector('.core-stage'),canvas=document.querySelector('.core-canvas');
  let corePortal=null,corePortalHost=null;
  const restoreCoreFallback=()=>{
    gyro.stop();if(canvas.parentElement!==stage)stage.append(canvas);corePortalHost?.remove();
    body.classList.remove('shared-core-ready');stage.classList.remove('has-webgl');
    gyro={redraw(){},resume(){},stop(){},scene(){}};
  };
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true,powerPreference:'low-power',premultipliedAlpha:true});
  if(gl){
    try{
      const vertexSource=`
        attribute vec3 aPosition; attribute vec3 aNormal; attribute vec2 aUv;
        uniform mat3 uModel; uniform vec3 uOffset; uniform float uScale; uniform float uAspect;
        uniform float uBuild; uniform float uMesh;
        varying vec3 vPosition; varying vec3 vNormal; varying vec3 vLocalPosition; varying vec2 vUv;
        void main(){
          vec3 local=aPosition,normal=aNormal;
          if(uMesh>=0.&&uMesh<3.5){
            float radius=uMesh<.5?1.:uMesh<1.5?1.36:uMesh<2.5?1.08:1.55;
            float angle=aUv.x*6.283185,side=aUv.y*6.283185;
            vec3 wire=vec3(cos(angle)*(radius+cos(side)*.0042),sin(angle)*(radius+cos(side)*.0042),sin(side)*.0042);
            vec3 wireNormal=vec3(cos(angle)*cos(side),sin(angle)*cos(side),sin(side));
            local=mix(wire,aPosition,uBuild);normal=normalize(mix(wireNormal,aNormal,uBuild));
          }
          vec3 p=uModel*(local*uScale)+uOffset;
          vPosition=p;vNormal=normalize(uModel*normal);vLocalPosition=local;vUv=aUv;
          float cameraScale=mix(1.95,2.35,uBuild);
          gl_Position=vec4(p.x*cameraScale/uAspect,p.y*cameraScale,-p.z,3.7-p.z);
        }`;
      const fragmentSource=`
        precision highp float;
        varying vec3 vPosition; varying vec3 vNormal; varying vec3 vLocalPosition; varying vec2 vUv;
        uniform float uMaterial; uniform float uPulse; uniform float uMesh; uniform float uBuild; uniform float uTheme;
        uniform mat3 uModel;
        uniform mat3 uRingInverse[3]; uniform vec3 uRingOffset[3]; uniform vec3 uRingRadii;
        uniform sampler2D uCoreMark;
        vec3 smoothBandNormal(){
          float radius=uMesh<.5?1.13:uMesh<1.5?.90:uMesh<2.5?.67:.43;
          float width=uMesh<.5?.078:uMesh<1.5?.065:uMesh<2.5?.045:.015;
          float depth=uMesh<.5?.033:uMesh<1.5?.030:uMesh<2.5?.025:.016;
          float power=uMesh<2.5?2./.42:2.;
          float radial=max(length(vLocalPosition.xy),.0001);
          vec2 q=vec2((radial-radius)/width,vLocalPosition.z/depth);
          vec2 gradient=sign(q)*pow(abs(q),vec2(power-1.))/vec2(width,depth);
          vec3 localNormal=normalize(vec3(vLocalPosition.xy/radial*gradient.x,gradient.y));
          return normalize(uModel*localNormal);
        }
        float sceneDistance(vec3 position){
          float distanceValue=10.;
          for(int i=0;i<3;i++){
            if(abs(float(i)-uMesh)<.25)continue;
            vec3 q=uRingInverse[i]*(position-uRingOffset[i]);
            float radius=i==0?uRingRadii.x:i==1?uRingRadii.y:uRingRadii.z;
            float width=mix(.0042,i==0?.078:i==1?.065:.045,uBuild);
            float depth=mix(.0042,i==0?.033:i==1?.030:.025,uBuild);
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
          vec3 darkBase=vec3(.022,.023,.025)+max(r.y,0.)*vec3(.045,.045,.046);
          vec3 lightBase=vec3(.12,.135,.15)+max(r.y,0.)*vec3(.24,.255,.27);
          vec3 color=mix(darkBase,lightBase,uTheme);
          color+=pow(max(dot(r,normalize(vec3(-.5,.22,-1.))),0.),4.)*mix(vec3(.20,.21,.23),vec3(.58,.62,.67),uTheme);
          color+=studioPanel(r,vec3(-.58,.73,1.35),vec2(.18,1.1),.105)*mix(vec3(2.7,2.66,2.58),vec3(2.15,2.20,2.24),uTheme);
          color+=studioPanel(r,vec3(.75,.22,1.1),vec2(.52,.22),.16)*mix(vec3(.95,.99,1.06),vec3(1.30,1.38,1.48),uTheme);
          color+=studioPanel(r,vec3(-1.1,-.23,.72),vec2(.065,.86),.052)*mix(vec3(2.2,2.13,1.99),vec3(1.78,1.82,1.88),uTheme);
          color+=studioPanel(r,vec3(.15,1.,.28),vec2(.65,.13),.075)*mix(vec3(1.8,1.75,1.65),vec3(1.34,1.38,1.44),uTheme);
          color+=studioPanel(r,vec3(.9,-.45,.65),vec2(.075,.65),.055)*mix(vec3(.75,.78,.82),vec3(.92,.99,1.08),uTheme);
          color+=studioPanel(r,vec3(-.65,.55,-1.2),vec2(.19,.9),.065)*mix(vec3(1.65,1.54,1.34),vec3(1.30,1.25,1.16),uTheme);
          color+=studioPanel(r,vec3(.8,.3,-1.1),vec2(.45,.17),.08)*mix(vec3(1.25,1.29,1.35),vec3(1.12,1.19,1.29),uTheme);
          float ribbon=exp(-pow(r.x+r.y*.58-.12,2.)*260.)*smoothstep(.15,.8,r.z);
          color+=ribbon*vec3(1.5,1.37,1.14);
          return color;
        }
        void main(){
          vec3 N=normalize(vNormal),V=normalize(vec3(0.,0.,3.7)-vPosition);
          // Evaluate the curved surface per pixel instead of exposing triangle normals.
          if(uMesh>=0.&&uMesh<3.5&&uBuild>.7)N=normalize(mix(N,smoothBandNormal(),smoothstep(.7,1.,uBuild)));
          if(dot(N,V)<0.)N=-N;
          float facing=max(dot(N,V),0.);
          vec3 reflection=environment(reflect(-V,N));
          float fresnel=pow(1.-facing,3.);
          vec3 col=reflection*(.76+fresnel*.24)+vec3(.008);
          float diffuse=max(dot(N,normalize(vec3(-.7,1.,1.))),0.);
          if(uMaterial>0.5&&uMaterial<1.5){
            vec3 metalBase=mix(vec3(.062,.064,.069),vec3(.22,.235,.255),uTheme);
            col=reflection*(mix(.64,.52,uTheme)+fresnel*.19)+metalBase*(.4+diffuse*.8);
            col+=uTheme*vec3(.10,.11,.12)*(.65+diffuse*.45);
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
          if(uMesh>=0.&&uMesh<3.5){
            vec3 wireLight=vec3(.09,.094,.10)+reflection*.29+fresnel*vec3(.075);
            col=mix(wireLight,col,smoothstep(.03,.9,uBuild));
          }
          if(uMaterial<1.5)col*=mix(1.,softOcclusion(vPosition,N),uBuild*uBuild);
          col=vec3(1.)-exp(-col*mix(1.3,1.08,uTheme));
          col=pow(col,vec3(.78));
          gl_FragColor=vec4(col,1.);
        }`;
      const compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(message);}return s;};
      const program=gl.createProgram(),vs=compile(gl.VERTEX_SHADER,vertexSource),fs=compile(gl.FRAGMENT_SHADER,fragmentSource);
      gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
      gl.deleteShader(vs);gl.deleteShader(fs);gl.useProgram(program);
      const attributes={position:gl.getAttribLocation(program,'aPosition'),normal:gl.getAttribLocation(program,'aNormal'),uv:gl.getAttribLocation(program,'aUv')};
      const uniforms={};for(const key of ['Model','Offset','Scale','Aspect','Material','Pulse','Mesh','CoreMark','RingRadii','Build','Theme'])uniforms[key]=gl.getUniformLocation(program,'u'+key);
      uniforms.RingInverse=gl.getUniformLocation(program,'uRingInverse[0]');uniforms.RingOffset=gl.getUniformLocation(program,'uRingOffset[0]');
      const markCanvas=document.createElement('canvas');markCanvas.width=1024;markCanvas.height=512;
      const markContext=markCanvas.getContext('2d');markContext.clearRect(0,0,1024,512);markContext.font='500 108px -apple-system, Segoe UI, sans-serif';markContext.fillStyle='#fff';markContext.textAlign='center';markContext.textBaseline='middle';markContext.fillText('ML',256,256);
      const markTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,markTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,markCanvas);
      gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.activeTexture(gl.TEXTURE0);
      const makeMesh=(vertices,indices)=>{
        const vertexBuffer=gl.createBuffer(),indexBuffer=gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
        return{vertexBuffer,indexBuffer,count:indices.length};
      };
      const torus=(radius,width,depth,segments=384,sides=128,roundness=.42)=>{
        const vertices=[],indices=[];
        for(let i=0;i<=segments;i++)for(let j=0;j<=sides;j++){
          const a=i/segments*Math.PI*2,quarter=j/sides*4,part=quarter-Math.floor(quarter);
          // Concentrate samples around the rounded bevels; keep every mesh below 65k vertices.
          const exponent=roundness<1?1/roundness:1,lo=Math.pow(part,exponent),hi=Math.pow(1-part,exponent);
          const b=(Math.floor(quarter)+lo/(lo+hi))*Math.PI*.5,c=Math.cos(b),s=Math.sin(b);
          const rr=radius+Math.sign(c)*Math.pow(Math.abs(c),roundness)*width;
          const z=Math.sign(s)*Math.pow(Math.abs(s),roundness)*depth;
          const nr=Math.sign(c)*Math.pow(Math.abs(c),2-roundness)/width,nz=Math.sign(s)*Math.pow(Math.abs(s),2-roundness)/depth,l=Math.hypot(nr,nz);
          vertices.push(rr*Math.cos(a),rr*Math.sin(a),z,nr/l*Math.cos(a),nr/l*Math.sin(a),nz/l,i/segments,j/sides);
          if(i<segments&&j<sides){const n=i*(sides+1)+j;indices.push(n,n+sides+1,n+1,n+1,n+sides+1,n+sides+2);}
        }
        return makeMesh(vertices,indices);
      };
      const sphere=()=>{
        const vertices=[],indices=[],lat=64,lon=96;
        for(let i=0;i<=lat;i++)for(let j=0;j<=lon;j++){
          const a=i/lat*Math.PI,b=j/lon*Math.PI*2,x=Math.sin(a)*Math.cos(b),y=Math.cos(a),z=Math.sin(a)*Math.sin(b);
          vertices.push(x,y,z,x,y,z,j/lon,i/lat);
          if(i<lat&&j<lon){const n=i*(lon+1)+j;indices.push(n,n+1,n+lon+1,n+1,n+lon+2,n+lon+1);}
        }
        return makeMesh(vertices,indices);
      };
      const rings=[torus(1.13,.078,.033),torus(.90,.065,.030),torus(.67,.045,.025),torus(.43,.015,.016,256,32,1)];
      const orbit=torus(1.29,.006,.006,384,16,1),coreOrbit=torus(.37,.009,.009,256,24,1),ball=sphere();
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
      const postFS=compile(gl.FRAGMENT_SHADER,`precision highp float;varying vec2 vUv;uniform sampler2D uScene;uniform vec2 uTexel;
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
      const sceneFramebuffer=gl.createFramebuffer(),sceneTexture=gl.createTexture(),sceneDepth=gl.createRenderbuffer();let bloomReady=false,sceneSize=1;
      const maxSceneSize=Math.min(2560,gl.getParameter(gl.MAX_TEXTURE_SIZE),gl.getParameter(gl.MAX_RENDERBUFFER_SIZE));
      const resizeBloom=()=>{
        // Context antialiasing does not cover an offscreen framebuffer. Render at
        // twice the output resolution and downsample before the browser composites it.
        sceneSize=Math.min(maxSceneSize,canvas.width*2);
        gl.bindTexture(gl.TEXTURE_2D,sceneTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,sceneSize,sceneSize,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
        gl.bindRenderbuffer(gl.RENDERBUFFER,sceneDepth);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,sceneSize,sceneSize);
        gl.bindFramebuffer(gl.FRAMEBUFFER,sceneFramebuffer);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,sceneTexture,0);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,sceneDepth);
        bloomReady=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;gl.bindFramebuffer(gl.FRAMEBUFFER,null);
        canvas.dataset.surface='smooth';canvas.dataset.antialias=bloomReady?'supersampled':'native';canvas.dataset.renderSize=String(bloomReady?sceneSize:canvas.width);
      };
      corePortalHost=document.createElement('div');corePortalHost.className='core-portal-viewport';corePortalHost.setAttribute('aria-hidden','true');
      corePortal=document.createElement('div');corePortal.className='core-portal';corePortalHost.append(corePortal);body.append(corePortalHost);
      let phase=0,last=performance.now(),frame=0,inView=true,hover=false,speed=1,burstTime=-10000,active=true;
      let sceneProgress=journeyProgress,sceneBuild=1,floating=false,bufferSize=0;
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
        const renderSize=bloomReady?sceneSize:canvas.width;
        gl.viewport(0,0,renderSize,renderSize);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniform1f(uniforms.Aspect,canvas.width/canvas.height);
        gl.uniform1f(uniforms.Build,sceneBuild);gl.uniform1f(uniforms.Theme,theme==='light'?1:0);
        const global=matrix((tiltX+manualX)*sceneBuild,(tiltY+manualY+phase*.10)*sceneBuild,-.06*sceneBuild);
        const heroAxes=[[.76+Math.sin(phase*.65)*.13,-.58+phase*.19,-.48+phase*.14],[1.06+phase*.16,.38+Math.sin(phase*.7)*.17,.64-phase*.11],[.30+Math.sin(phase*.5)*.2,1.12-phase*.16,-.20+phase*.08],[.81,.19+phase*.18,-.79-phase*.15]];
        const axes=heroAxes.map((angles,i)=>angles.map((angle,j)=>{
          const introAngle=introOrbits[i].angles[j]+(j===0?phase*introOrbits[i].rate/.062:0);
          return introAngle+(angle-introAngle)*sceneBuild;
        }));
        const ringModels=axes.map(angles=>mul(global,matrix(...angles)));
        const ringOffsets=ringModels.map((model,i)=>{const sign=i%2?1:-1;return[model[6]*burst*.22*sign,model[7]*burst*.22*sign,model[8]*burst*.22*sign];});
        const inverseData=[];ringModels.slice(0,3).forEach(m=>inverseData.push(m[0],m[3],m[6],m[1],m[4],m[7],m[2],m[5],m[8]));
        gl.uniformMatrix3fv(uniforms.RingInverse,false,new Float32Array(inverseData));gl.uniform3fv(uniforms.RingOffset,new Float32Array(ringOffsets.slice(0,3).flat()));gl.uniform3fv(uniforms.RingRadii,new Float32Array([1.13,.9,.67].map((value,i)=>(introOrbits[i].radius+(value-introOrbits[i].radius)*sceneBuild)*(1+burst*.025))));
        ringModels.forEach((model,i)=>draw(rings[i],model,ringOffsets[i],1+burst*.025,i===3?0:1,1,i));
        const centerReveal=motionOff?1:smoothRange(.15,.76,sceneProgress),detailsReveal=motionOff?1:smoothRange(.24,.82,sceneProgress);
        if(centerReveal>.001)draw(ball,global,[0,0,0],.30*centerReveal,0,hover&&!motionOff?1.04+Math.sin(now*.004)*.04:1,4);
        if(centerReveal>.001)draw(coreOrbit,mul(global,matrix(.95,.28,-.42+phase*.3)),[0,0,0],centerReveal,3);
        // Orbit satellites stay attached as their wire paths become the mechanism.
        for(let i=0;i<3&&sceneBuild<.999;i++){
          const radius=introOrbits[i].radius+([1.13,.9,.67][i]-introOrbits[i].radius)*sceneBuild;
          const angle=phase*(.9+i*.17)+i*2.25+.5,p=apply(ringModels[i],[Math.cos(angle)*radius,Math.sin(angle)*radius,0]);
          draw(ball,global,p,(i===1?.043:.026)*(1-sceneBuild),0);
        }
        for(let i=0;i<2&&detailsReveal>.001;i++){
          const orbitMatrix=mul(global,matrix(i? .48:1.1,i?.82:-.3,i?1.0:-.2));
          draw(orbit,orbitMatrix,[0,0,0],(i?.93:1)*detailsReveal,2);
          for(let j=0;j<(i?1:2);j++){
            const angle=phase*(i?-1.5:1.1)+j*2.4+i*1.6+.45;
            const p=apply(orbitMatrix,[Math.cos(angle)*1.29*(i?.93:1)*detailsReveal,Math.sin(angle)*1.29*(i?.93:1)*detailsReveal,0]);
            draw(ball,global,p,(j?.027:.042)*detailsReveal,0);
          }
        }
        if(bloomReady){gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,canvas.width,canvas.height);gl.disable(gl.DEPTH_TEST);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(postProgram);
          for(const key of Object.keys(attributes))gl.disableVertexAttribArray(attributes[key]);
          gl.bindBuffer(gl.ARRAY_BUFFER,postBuffer);gl.enableVertexAttribArray(postPosition);gl.vertexAttribPointer(postPosition,2,gl.FLOAT,false,0,0);
          gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,sceneTexture);gl.uniform1i(postScene,0);gl.uniform2f(postTexel,1/sceneSize,1/sceneSize);gl.drawArrays(gl.TRIANGLES,0,3);}
      };
      const loop=now=>{frame=0;if(!active||motionOff||!canAnimateCore()||introClosing||!introActive&&!inView||document.hidden)return;render(now);frame=requestAnimationFrame(loop);};
      const resume=()=>{if(active&&!frame&&!motionOff&&canAnimateCore()&&!introClosing&&(introActive||inView)&&!document.hidden){last=performance.now();frame=requestAnimationFrame(loop);}};
      const stop=()=>{cancelAnimationFrame(frame);frame=0;};
      const syncScene=(p,force=false)=>{
        sceneProgress=clamp(p);sceneBuild=motionOff?1:smoothRange(.035,.88,sceneProgress);
        const nextFloating=!motionOff&&sceneProgress<.999,r=stage.getBoundingClientRect();
        const viewportWidth=document.documentElement.clientWidth||innerWidth;
        const introSize=Math.min(innerHeight*1.14,viewportWidth*1.40,1120);
        if(nextFloating){
          if(canvas.parentElement!==corePortal)corePortal.append(canvas);
          const travel=smoothRange(.09,.985,sceneProgress),size=introSize+(r.width-introSize)*travel;
          const x=viewportWidth*.5+(r.left+r.width*.5-viewportWidth*.5)*travel;
          const y=innerHeight*.5+(r.top+r.height*.5-innerHeight*.5)*travel-Math.sin(travel*Math.PI)*Math.min(30,innerHeight*.035);
          corePortal.style.visibility='visible';corePortal.style.width=size+'px';corePortal.style.height=size+'px';corePortal.style.transform=`translate3d(${x-size*.5}px,${y-size*.5}px,0)`;
          corePortal.dataset.state=sceneProgress<.01?'intro':'morph';
        }else{
          if(canvas.parentElement!==stage)stage.append(canvas);
          corePortal.style.visibility='hidden';corePortal.dataset.state=motionOff?'reduced':'docked';
        }
        const size=nextFloating?Math.max(introSize,stage.clientWidth):stage.clientWidth||r.width;
        const dpr=nextFloating?1.6:Math.min(Math.max(devicePixelRatio||1,innerWidth<600?1.65:2),2.25);
        const resolution=Math.min(1536,Math.max(1,Math.round(size*dpr)));
        const changed=force||floating!==nextFloating||bufferSize!==resolution;
        floating=nextFloating;canvas.dataset.build=sceneBuild.toFixed(3);canvas.dataset.scene=corePortal.dataset.state;
        if(changed){bufferSize=resolution;canvas.width=canvas.height=resolution;resizeBloom();render(performance.now());}
        else if(motionOff)render(performance.now());
        resume();
      };
      const resize=()=>syncScene(journeyProgress,true);
      gyro={scene:syncScene,redraw(){if(motionOff){tiltX=targetX=.06;tiltY=targetY=-.10;}syncScene(journeyProgress);render(performance.now());},resume,stop};
      document.querySelector('.hero').addEventListener('pointermove',e=>{if(motionOff||dragging||!finePointer.matches||e.pointerType!=='mouse')return;const r=stage.getBoundingClientRect();targetY=(e.clientX-(r.left+r.width/2))/innerWidth*.42-.1;targetX=(e.clientY-(r.top+r.height/2))/innerHeight*.29+.06;},{passive:true});
      stage.addEventListener('pointerenter',()=>hover=true);stage.addEventListener('pointerleave',()=>hover=false);stage.addEventListener('focus',()=>hover=true);stage.addEventListener('blur',()=>hover=false);
      stage.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;dragging=true;dragDistance=0;dragLastX=e.clientX;dragLastY=e.clientY;dragVelocityX=dragVelocityY=0;stage.setPointerCapture(e.pointerId);stage.classList.add('is-dragging');ring.classList.add('is-dragging');});
      stage.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-dragLastX,dy=e.clientY-dragLastY;dragLastX=e.clientX;dragLastY=e.clientY;dragDistance+=Math.abs(dx)+Math.abs(dy);manualX+=dy*.006;manualY+=dx*.006;dragVelocityX=dy*.002;dragVelocityY=dx*.002;if(motionOff)render(performance.now());});
      const releaseDrag=e=>{if(!dragging)return;dragging=false;stage.classList.remove('is-dragging');ring.classList.remove('is-dragging');if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);if(motionOff)dragVelocityX=dragVelocityY=0;resume();};
      stage.addEventListener('pointerup',releaseDrag);stage.addEventListener('pointercancel',e=>{dragVelocityX=dragVelocityY=0;releaseDrag(e);});
      stage.addEventListener('click',()=>{if(dragDistance>5){dragDistance=0;return;}if(!motionOff){burstTime=performance.now();resume();}});
      stage.addEventListener('keydown',e=>{const directions={ArrowLeft:[0,-.18],ArrowRight:[0,.18],ArrowUp:[-.18,0],ArrowDown:[.18,0]};if(directions[e.key]){e.preventDefault();manualX+=directions[e.key][0];manualY+=directions[e.key][1];render(performance.now());}if(e.key==='Home'){e.preventDefault();manualX=manualY=dragVelocityX=dragVelocityY=0;render(performance.now());}});
      if('ResizeObserver' in window)new ResizeObserver(resize).observe(stage);else addEventListener('resize',resize);
      if('IntersectionObserver' in window)new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView||introActive)resume();else stop();},{rootMargin:'100px'}).observe(stage);
      document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else resume();});
      canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();active=false;restoreCoreFallback();});
      stage.classList.add('has-webgl');body.classList.add('shared-core-ready');resize();
    }catch{
      // The embedded reference keeps the hero useful if graphics initialization fails.
      restoreCoreFallback();
    }
  }
  // Start the greeting clock only once the shared scene is ready to be shown.
  playIntro();
})();
