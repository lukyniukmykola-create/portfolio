  // Native scroll is the timeline: the hero stays pinned for one viewport.
  // User input disarms the countdown, and scrolling back never re-arms it.
  const heroScene=document.querySelector('.hero');
  const journey=document.createElement('div'),pin=document.createElement('div');
  journey.className='intro-journey';pin.className='intro-pin';
  heroScene.before(journey);journey.append(pin);pin.append(heroScene);
  body.classList.add('intro-scroll-ready');
  const irisShell=document.createElement('div'),irisRim=document.createElement('div');
  irisShell.className='intro-iris-shell';irisShell.setAttribute('aria-hidden','true');
  irisRim.className='intro-iris-rim';irisShell.append(irisRim);body.append(irisShell);
  const headerScene=document.querySelector('.header');
  const sceneActors=[...heroScene.querySelectorAll('.hero-enter')];
  const greeting=document.querySelector('.greeting');
  const greetingMeta=document.querySelector('.greeting-meta');
  const sceneHint=document.querySelector('.intro-scroll');
  const greetingWords=['Hello.','Привіт.','Ciao.','Bonjour.','Hola.','你好.','こんにちは.','Привіт.'];
  const greetingLanguages=['ENGLISH','УКРАЇНСЬКОЮ','ITALIANO','FRANÇAIS','ESPAÑOL','中文','日本語','SCROLL TO EXPLORE'];
  const greetingHolds=[550,550,500,550,500,550,600,850];
  const greetingEnds=greetingHolds.map((_,i)=>greetingHolds.slice(0,i+1).reduce((a,b)=>a+b,0));
  const greetingDuration=greetingEnds[greetingEnds.length-1];
  let journeyRange=Math.round(innerHeight*.9),journeyProgress=0,targetProgress=0;
  let sceneFrame=0,lastSceneFrame=0,lastOrbitFrame=-100,sceneEpoch=performance.now();
  let greetingEnded=false,autoArmed=true,manualJourney=false,autoTween=null;
  let lastStage=-1,returnWasVisible=false,hiddenAt=0;
  const clamp=value=>Math.max(0,Math.min(1,value));
  const ease=value=>value<.5?4*value*value*value:1-Math.pow(-2*value+2,3)/2;
  const scrollPosition=()=>clamp(scrollY/journeyRange);

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
    const visible=p<.999,mainReady=p>=.995;
    loader.style.visibility=visible?'visible':'hidden';loader.style.display='flex';
    loader.setAttribute('aria-hidden',String(!visible));
    document.querySelector('.skip-intro').tabIndex=visible?0:-1;
    document.querySelector('#intro-motion').hidden=!motionOff||!visible;
    document.querySelector('main').inert=!mainReady;headerScene.inert=!mainReady;
    loader.dataset.progress=p.toFixed(3);loader.dataset.mode=manualJourney?'manual':autoTween?'automatic':'waiting';
    loader.dataset.state=p>=.999?'finished':p<=.001?'playing':'scrubbing';
    if(p>=.999&&!loader.dataset.closedAt)loader.dataset.closedAt=String(performance.now());
    headerScene.style.opacity=String(clamp((p-.35)/.5));
    headerScene.style.transform=motionOff?'none':`translateY(${(1-clamp(p/.85))*-10}px)`;
    heroScene.style.setProperty('--scene-scale',String(motionOff?1:.97+.03*p));
    heroScene.style.setProperty('--scene-contrast',String(motionOff?1:.86+.14*p));
    sceneActors.forEach((actor,index)=>{
      const isCore=actor.classList.contains('core-figure'),isName=actor.classList.contains('name-line');
      const start=isCore?.04:.24+Math.min(index,5)*.035;
      const end=isCore?.40:.78+Math.min(index,7)*.024;
      const reveal=clamp((p-start)/(end-start));
      actor.style.setProperty('--scene-opacity',String(reveal));
      let transform='none';
      if(!motionOff)transform=isCore?`scale(${.88+.12*reveal}) rotate(${(1-reveal)*-13}deg)`:isName?`translateY(${(1-reveal)*105}%)`:`translateY(${(1-reveal)*25}px)`;
      actor.style.setProperty('--scene-transform',transform);
    });
    loader.querySelector('.loader-center').style.opacity=String(clamp(1-p*2.1));
    loader.querySelector('.loader-center').style.transform=motionOff?'none':`translateX(${p*35}px) scale(${1-p*.16})`;
    loader.querySelectorAll('.intro-side').forEach(el=>el.style.opacity=String(.35*clamp(1-p*1.8)));
    sceneHint.textContent=p>.01?'SCROLL DOWN · SCROLL UP TO RETURN':'SCROLL TO REVEAL';
    if(motionOff){loader.style.clipPath='none';loader.style.opacity=String(1-p);irisShell.style.visibility='hidden';}
    else{
      loader.style.opacity='1';
      const box=document.querySelector('.core-stage').getBoundingClientRect();
      const cx=innerWidth<760?innerWidth*.64:box.left+box.width/2;
      const cy=innerWidth<760?innerHeight*.58:Math.max(innerHeight*.25,Math.min(innerHeight*.72,box.top+box.height/2));
      const radius=Math.max(.1,Math.max(Math.hypot(cx,cy),Math.hypot(innerWidth-cx,cy),Math.hypot(cx,innerHeight-cy),Math.hypot(innerWidth-cx,innerHeight-cy))*Math.pow(p,1.25)+p*4);
      loader.style.clipPath=p<=.001?'none':`path(evenodd, "M0 0H${innerWidth}V${innerHeight}H0Z M${cx} ${cy-radius} A${radius} ${radius} 0 1 0 ${cx} ${cy+radius} A${radius} ${radius} 0 1 0 ${cx} ${cy-radius}Z")`;
      irisShell.style.visibility=visible&&p>.005?'visible':'hidden';
      irisRim.style.left=cx+'px';irisRim.style.top=cy+'px';irisRim.style.width=radius*2+'px';irisRim.style.height=radius*2+'px';
      irisRim.style.opacity=String(Math.sin(p*Math.PI)*.32);
    }
    if(p>.25)gyro.resume();else gyro.stop();
    if(lastStage!==Math.round(p*1000)){lastStage=Math.round(p*1000);}
  };

  const ensureSceneFrame=()=>{if(!sceneFrame&&!document.hidden)sceneFrame=requestAnimationFrame(sceneLoop);};
  const moveToHero=(automatic=false)=>{
    if(scrollY>=journeyRange&&journeyProgress>=.999)return;
    autoArmed=false;
    if(!automatic)manualJourney=true;
    autoTween={start:performance.now(),from:scrollY,to:journeyRange,duration:motionOff?350:900};
    ensureSceneFrame();
  };
  const disarmAuto=()=>{manualJourney=true;autoArmed=false;autoTween=null;ensureSceneFrame();};
  function sceneLoop(now){
    sceneFrame=0;
    const dt=Math.min((now-lastSceneFrame)||16,60);lastSceneFrame=now;
    if(autoTween){
      const amount=clamp((now-autoTween.start)/autoTween.duration);
      window.scrollTo({top:autoTween.from+(autoTween.to-autoTween.from)*ease(amount),behavior:'instant'});
      if(amount===1)autoTween=null;
    }
    targetProgress=scrollPosition();
    let next=motionOff||autoTween?targetProgress:journeyProgress+(targetProgress-journeyProgress)*(1-Math.exp(-dt/65));
    if(Math.abs(next-targetProgress)<.001)next=targetProgress;
    if(next<.001)next=0;if(next>.999)next=1;
    if(next<.999||journeyProgress<.999||Math.abs(next-journeyProgress)>.0001)paintJourney(next);
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
    journey.style.height=(heroScene.offsetHeight+journeyRange)+'px';
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
    if(event.ctrlKey||Math.abs(event.deltaY)<1)return;
    const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);
    const inJourney=scrollY<journeyRange-1||journeyProgress<.999||!!autoTween;
    if(inJourney||delta<0&&scrollY<=journeyRange+2){
      disarmAuto();
      if(delta>0&&scrollY+delta>journeyRange){event.preventDefault();window.scrollTo({top:journeyRange,behavior:'instant'});ensureSceneFrame();}
    }
  },{passive:false});
  let lastTouchY=0;
  document.addEventListener('touchstart',event=>{if(event.touches.length===1)lastTouchY=event.touches[0].clientY;},{passive:true});
  document.addEventListener('touchmove',event=>{
    if(event.touches.length!==1)return;
    const y=event.touches[0].clientY,delta=lastTouchY-y;lastTouchY=y;
    if(scrollY<journeyRange||journeyProgress<.999||autoTween){
      if(Math.abs(delta)>2)disarmAuto();
      if(delta>0&&scrollY+delta>journeyRange){event.preventDefault();window.scrollTo({top:journeyRange,behavior:'instant'});ensureSceneFrame();}
    }
  },{passive:false});
  document.addEventListener('keydown',event=>{
    if(event.defaultPrevented)return;
    if(event.key==='Escape'&&journeyProgress<.999){finishIntro(event);return;}
    if(event.target.closest('input,textarea,select')||event.target.isContentEditable)return;
    const steps={ArrowDown:70,ArrowUp:-70,PageDown:journeyRange*.45,PageUp:-journeyRange*.45,' ':journeyRange*.45};
    if(event.key===' '&&event.target.closest('button,a'))return;
    let step=steps[event.key];if(step===undefined)return;if(event.shiftKey&&event.key===' ')step=-step;
    if(scrollY<journeyRange||journeyProgress<.999||step<0&&scrollY<=journeyRange+2){
      event.preventDefault();disarmAuto();window.scrollTo({top:Math.max(0,Math.min(journeyRange,scrollY+step)),behavior:'instant'});ensureSceneFrame();
    }
  });
  document.addEventListener('pointermove',event=>{if(introActive&&!motionOff&&event.pointerType==='mouse'){introMouseX=(event.clientX/innerWidth-.5)*7;introMouseY=(event.clientY/innerHeight-.5)*5;}},{passive:true});
  window.addEventListener('resize',()=>measureJourney(true));
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){hiddenAt=performance.now();cancelAnimationFrame(sceneFrame);sceneFrame=0;}
    else{if(hiddenAt){const pause=performance.now()-hiddenAt;introStart+=pause;sceneEpoch+=pause;if(autoTween)autoTween.start+=pause;hiddenAt=0;}lastSceneFrame=performance.now();ensureSceneFrame();}
  });
  measureJourney(false);
