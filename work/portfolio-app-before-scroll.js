(() => {
  'use strict';
  const root=document.documentElement,body=document.body;
  const systemMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer=matchMedia('(hover: hover) and (pointer: fine)');
  let motionOff=systemMotion.matches,motionChoice=null;
  try{const savedMotion=sessionStorage.getItem('ml-motion-mode');if(savedMotion==='full'||savedMotion==='reduced'){motionOff=savedMotion==='reduced';motionChoice=!motionOff;}}catch{}
  root.dataset.motion=motionOff?'reduced':'full';
  const motionButton=document.querySelector('#motion-toggle');
  const loader=document.querySelector('.preloader');
  let introActive=false,introClosing=false,introFrames=0,introStart=0,introWord=-1,introExitTimer=0;
  let gyro={redraw(){},resume(){},stop(){}};
  let cursor={updateMode(){}};

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

  const finishIntro=()=>{
    if(!introActive)return;
    introActive=false;introClosing=true;cancelAnimationFrame(introFrames);introFrames=0;
    loader.dataset.state='closing';
    const restoreFocus=loader.contains(document.activeElement);
    body.classList.remove('intro-active');body.classList.add('intro-closing');loader.classList.add('exit');
    loader.setAttribute('aria-hidden','true');document.querySelector('.skip-intro').tabIndex=-1;
    clearTimeout(introExitTimer);introExitTimer=setTimeout(()=>{
      loader.style.display='none';loader.dataset.state='finished';introClosing=false;body.classList.remove('intro-closing');
      loader.dataset.closedAt=String(performance.now());
      window.scrollTo({top:0,behavior:'instant'});
      document.querySelector('main').inert=false;document.querySelector('header').inert=false;
      if(restoreFocus)document.querySelector('.logo').focus({preventScroll:true});
      gyro.resume();
    },motionOff?380:980);
  };
  const playIntro=()=>{
    clearTimeout(introExitTimer);resizeIntro();
    window.scrollTo({top:0,behavior:'instant'});
    introActive=true;introClosing=false;body.classList.remove('intro-closing');introStart=0;introWord=-1;gyro.stop();
    loader.style.display='';loader.classList.remove('exit');loader.setAttribute('aria-hidden','false');
    document.querySelector('.skip-intro').tabIndex=0;
    document.querySelector('main').inert=true;document.querySelector('header').inert=true;
    body.classList.add('intro-active');
    loader.dataset.state='playing';
    delete loader.dataset.closedAt;delete loader.dataset.startedAt;
    document.querySelector('#intro-motion').hidden=!motionOff;
    const greeting=document.querySelector('.greeting');
    const words=['Hello.','Привіт.','Ciao.','Bonjour.','Hola.','你好.','こんにちは.','Привіт.'];
    const language=['ENGLISH','УКРАЇНСЬКОЮ','ITALIANO','FRANÇAIS','ESPAÑOL','中文','日本語','LOADING EXPERIENCE'];
    const holds=[550,550,500,550,500,550,600,850];
    const ends=holds.map((ms,i)=>holds.slice(0,i+1).reduce((a,b)=>a+b,0));
    const duration=ends[ends.length-1];
    greeting.textContent=words[0];greeting.classList.remove('animate');
    document.querySelector('.greeting-meta').textContent=language[0];
    let lastOrbitFrame=-100;
    if(motionOff)drawIntro(0);
    const frame=now=>{
      if(!introActive)return;
      if(!introStart){introStart=now;loader.dataset.startedAt=String(now);}
      const elapsed=now-introStart,p=Math.min(elapsed/duration,1);
      let index=ends.findIndex(end=>elapsed<end);if(index<0)index=words.length-1;
      if(index!==introWord){
        introWord=index;greeting.textContent=words[index];
        document.querySelector('.greeting-meta').textContent=language[index];
        greeting.classList.remove('animate');void greeting.offsetWidth;greeting.style.animationDuration=`${holds[index]}ms`;if(!motionOff)greeting.classList.add('animate');
      }
      document.querySelector('.loader-progress').style.width=`${p*100}%`;
      if(!motionOff&&elapsed-lastOrbitFrame>30){drawIntro(elapsed/1000);lastOrbitFrame=elapsed;}
      if(p>=1){finishIntro();return;}
      introFrames=requestAnimationFrame(frame);
    };
    cancelAnimationFrame(introFrames);introFrames=requestAnimationFrame(frame);
    // Even a suspended frame loop must release navigation and scrolling.
    introExitTimer=setTimeout(finishIntro,duration+700);
  };
  document.querySelector('.skip-intro').addEventListener('click',finishIntro);
  document.querySelector('.skip').addEventListener('click',finishIntro);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')finishIntro();});
  document.addEventListener('wheel',e=>{
    if(!introActive&&!introClosing)return;
    e.preventDefault();if(introActive&&Math.abs(e.deltaY)>5)finishIntro();
  },{passive:false});
  window.addEventListener('scroll',()=>{if((introActive||introClosing)&&scrollY!==0)window.scrollTo({top:0,behavior:'instant'});},{passive:true});
  let introTouchY=0;
  document.addEventListener('touchstart',e=>{if(introActive&&e.touches.length===1)introTouchY=e.touches[0].clientY;},{passive:true});
  document.addEventListener('touchmove',e=>{
    if(!introActive&&!introClosing)return;
    if(e.touches.length!==1)return;
    e.preventDefault();if(introActive&&Math.abs(e.touches[0].clientY-introTouchY)>24)finishIntro();
  },{passive:false});
  document.addEventListener('keydown',e=>{
    if(introClosing&&['ArrowDown','PageDown',' '].includes(e.key)){e.preventDefault();return;}
    if(introActive&&(['ArrowDown','PageDown'].includes(e.key)||(!e.target.closest('button')&&[' ','Enter'].includes(e.key)))){e.preventDefault();finishIntro();}
  });
  document.addEventListener('pointermove',e=>{if(introActive&&!motionOff&&e.pointerType==='mouse'){introMouseX=(e.clientX/innerWidth-.5)*7;introMouseY=(e.clientY/innerHeight-.5)*5;}},{passive:true});
  window.addEventListener('resize',()=>{if(introActive){resizeIntro();drawIntro(motionOff?0:Math.max(0,(performance.now()-(introStart||performance.now()))/1000));}});

  const updateMotionUI=()=>{motionButton.textContent=`Motion: ${motionOff?'off':'on'}`;motionButton.setAttribute('aria-pressed',String(!motionOff));motionButton.setAttribute('aria-label',motionOff?'Enable animations':'Reduce animations');};
  const setMotion=enabled=>{
    motionChoice=enabled;motionOff=!enabled;root.dataset.motion=motionOff?'reduced':'full';
    try{sessionStorage.setItem('ml-motion-mode',enabled?'full':'reduced');}catch{}
    body.classList.toggle('motion',enabled&&'IntersectionObserver' in window);
    if(motionOff){finishIntro();gyro.stop();document.querySelectorAll('.magnetic,.project-card').forEach(el=>el.style.transform='');}
    cursor.updateMode();gyro.redraw();if(enabled)gyro.resume();updateMotionUI();
  };
  motionButton.addEventListener('click',()=>setMotion(motionOff));
  document.querySelector('#replay-intro').addEventListener('click',()=>{if(motionOff)setMotion(true);playIntro();});
  document.querySelector('#intro-motion').addEventListener('click',()=>{setMotion(true);playIntro();});
  systemMotion.addEventListener('change',()=>{if(motionChoice===null){setMotion(!systemMotion.matches);motionChoice=null;}});
  updateMotionUI();
  // The prototype always opens with its greeting scene, including reduced motion.
  playIntro();

  // Navigation and simple, one-time scroll reveals.
  const header=document.querySelector('.header');
  const updateHeader=()=>header.classList.toggle('scrolled',scrollY>30);
  addEventListener('scroll',updateHeader,{passive:true});updateHeader();
  const nav=document.querySelector('.nav'),menu=document.querySelector('.menu-toggle');
  const closeMenu=()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='Menu';};
  menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';nav.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'Close':'Menu';});
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  addEventListener('resize',()=>{if(innerWidth>760)closeMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){closeMenu();menu.focus();}});
  if('IntersectionObserver' in window){
    if(!motionOff)body.classList.add('motion');
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}}),{threshold:.08,rootMargin:'0px 0px -20px 0px'});
    document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
    const navObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)nav.querySelectorAll('a').forEach(a=>{if(a.hash==='#'+entry.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}),{rootMargin:'-12% 0px -67% 0px'});
    document.querySelectorAll('main section[id]').forEach(el=>navObserver.observe(el));
  }

  // Case studies use the project descriptions supplied in the master document.
  const projects={
    steelon:{title:'STEELON',category:'CURRENCY MONITORING / DESKTOP',problem:'Currency information changes frequently. Repeated manual checks make it harder to track historical values and respond to updates.',solution:'A Python desktop application combines API data, update logic, SQLite history and Telegram notifications in one monitoring workflow.',result:'Current values, historical data and notifications are available through a connected desktop and messaging workflow.',tags:['Python','API','SQLite','Desktop','Telegram']},
    student:{title:'Student Activity System',category:'TELEGRAM / STUDENT WORKFLOWS',problem:'Tasks and participant submissions can become difficult to organize when they are spread across messages and separate records.',solution:'A Telegram-based system handles tasks and submissions, stores information persistently in SQLite, and provides activity statistics.',result:'A structured workflow for student tasks, submissions and statistics, accessible through Telegram.',tags:['Python','Telegram Bot API','SQLite','Automation']},
    models:{title:'3D Automation Models',category:'ENGINEERING / INTERACTIVE VISUALIZATION',problem:'Automation systems can be difficult to understand from a flat description alone.',solution:'Interactive 3D models and technical visualizations make components and their relationships easier to explore.',result:'An interactive visual way to communicate and inspect automation concepts.',tags:['3D','Engineering','Visualization']}
  };
  const dialog=document.querySelector('#project-dialog');let dialogTrigger;
  document.querySelectorAll('[data-project]').forEach(button=>button.addEventListener('click',()=>{
    dialogTrigger=button;const p=projects[button.dataset.project];
    for(const [id,key] of [['title','title'],['category','category'],['problem','problem'],['solution','solution'],['result','result']])document.querySelector('#dialog-'+id).textContent=p[key];
    document.querySelector('#dialog-tags').replaceChildren(...p.tags.map(text=>{const span=document.createElement('span');span.className='tag';span.textContent=text;return span;}));
    dialog.showModal();body.style.overflow='hidden';
  }));
  document.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close();});
  dialog.addEventListener('close',()=>{body.style.overflow='';dialogTrigger?.focus({preventScroll:true});});
  document.querySelector('#year').textContent=new Date().getFullYear();
  const resumeDialog=document.querySelector('#resume-dialog'),resumeButton=document.querySelector('#resume-button');
  resumeButton.addEventListener('click',()=>{resumeDialog.showModal();body.style.overflow='hidden';});
  document.querySelector('.resume-close').addEventListener('click',()=>resumeDialog.close());
  resumeDialog.addEventListener('click',e=>{const r=resumeDialog.getBoundingClientRect();if(e.target===resumeDialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))resumeDialog.close();});
  resumeDialog.addEventListener('close',()=>{body.style.overflow='';resumeButton.focus({preventScroll:true});});

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
    el.addEventListener('pointermove',e=>{if(motionOff||!finePointer.matches||e.pointerType!=='mouse')return;const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;el.style.setProperty('--mx',`${x*100}%`);el.style.setProperty('--my',`${y*100}%`);el.style.transform=`perspective(1000px) rotateX(${(y-.5)*-2.6}deg) rotateY(${(x-.5)*2.6}deg)`;});
    el.addEventListener('pointerleave',()=>el.style.transform='');
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
        uniform float uMaterial; uniform float uPulse;
        float studioPanel(vec3 r,vec3 direction,vec2 size,float softness){
          vec3 forward=normalize(direction),right=normalize(cross(vec3(0.,1.,0.),forward)),up=cross(forward,right);
          float facing=dot(r,forward);
          vec2 uv=vec2(dot(r,right),dot(r,up))/max(facing,.001);
          vec2 edge=abs(uv)-size;
          return (1.-smoothstep(-softness,softness,max(edge.x,edge.y)))*step(.001,facing);
        }
        vec3 environment(vec3 r){
          vec3 color=vec3(.013,.014,.016)+max(r.y,0.)*vec3(.034,.033,.031);
          color+=studioPanel(r,vec3(-.58,.73,1.35),vec2(.12,1.1),.055)*vec3(3.8,3.58,3.18);
          color+=studioPanel(r,vec3(.75,.22,1.1),vec2(.52,.22),.16)*vec3(.95,.99,1.06);
          color+=studioPanel(r,vec3(-1.1,-.23,.72),vec2(.035,.86),.026)*vec3(3.1,2.67,2.05);
          color+=studioPanel(r,vec3(.15,1.,.28),vec2(.65,.13),.075)*vec3(1.8,1.75,1.65);
          color+=studioPanel(r,vec3(.9,-.45,.65),vec2(.025,.65),.02)*vec3(.9,.94,1.);
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
            col=reflection*(.68+fresnel*.27)+vec3(.074,.076,.080)*(.3+diffuse*.7);
            col+=pow(1.-facing,8.)*vec3(.16,.148,.124);
            float arcLight=pow(max(cos(vUv.x*6.283185-1.8),0.),7.);
            col+=vec3(.07,.069,.065)*diffuse*diffuse;
            col+=vec3(.12,.115,.10)*arcLight*(.2+diffuse*.8);
            float glint=pow(max(dot(reflect(-normalize(vec3(-.6,.8,1.2)),N),V),0.),55.);
            col+=glint*vec3(2.35,2.25,2.05);
          }
          if(uMaterial>1.5&&uMaterial<2.5)col=vec3(.17,.16,.145);
          if(uMaterial>2.5)col=vec3(1.25,1.07,.82);
          if(uMaterial<.5){
            vec3 r=reflect(-V,N);
            float coreRibbon=exp(-pow(r.x+r.y*.58-.12,2.)*400.)*smoothstep(.05,.85,r.z);
            float coreKey=pow(max(dot(r,normalize(vec3(-.45,.55,1.))),0.),20.);
            col=(reflection*.06+coreKey*vec3(1.2,1.16,1.05)+coreRibbon*vec3(2.4,2.2,1.86)+vec3(.007))*uPulse;
          }
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
      const uniforms={};for(const key of ['Model','Offset','Scale','Aspect','Material','Pulse'])uniforms[key]=gl.getUniformLocation(program,'u'+key);
      const makeMesh=(vertices,indices)=>{
        const vertexBuffer=gl.createBuffer(),indexBuffer=gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
        return{vertexBuffer,indexBuffer,count:indices.length};
      };
      const torus=(radius,width,depth,segments=256,sides=40,roundness=.85)=>{
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
      const rings=[torus(1.02,.092,.032),torus(.94,.083,.029),torus(.76,.06,.025),torus(.57,.018,.016,192,20,1)];
      const orbit=torus(1.29,.006,.006,256,12,1),coreOrbit=torus(.37,.009,.009,192,16,1),ball=sphere();
      const mul=(a,b)=>{const r=[];for(let col=0;col<3;col++)for(let row=0;row<3;row++){let sum=0;for(let k=0;k<3;k++)sum+=a[k*3+row]*b[col*3+k];r[col*3+row]=sum;}return r;};
      const matrix=(x,y,z)=>{const cx=Math.cos(x),sx=Math.sin(x),cy=Math.cos(y),sy=Math.sin(y),cz=Math.cos(z),sz=Math.sin(z);return mul(mul([cz,sz,0,-sz,cz,0,0,0,1],[cy,0,-sy,0,1,0,sy,0,cy]),[1,0,0,0,cx,sx,0,-sx,cx]);};
      const apply=(m,p)=>[m[0]*p[0]+m[3]*p[1]+m[6]*p[2],m[1]*p[0]+m[4]*p[1]+m[7]*p[2],m[2]*p[0]+m[5]*p[1]+m[8]*p[2]];
      const draw=(mesh,model,offset,scale,material,pulse=1)=>{
        gl.bindBuffer(gl.ARRAY_BUFFER,mesh.vertexBuffer);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.indexBuffer);
        for(const [key,size,offsetBytes] of [['position',3,0],['normal',3,12],['uv',2,24]]){gl.enableVertexAttribArray(attributes[key]);gl.vertexAttribPointer(attributes[key],size,gl.FLOAT,false,32,offsetBytes);}
        gl.uniformMatrix3fv(uniforms.Model,false,new Float32Array(model));gl.uniform3fv(uniforms.Offset,new Float32Array(offset));gl.uniform1f(uniforms.Scale,scale);gl.uniform1f(uniforms.Material,material);gl.uniform1f(uniforms.Pulse,pulse);
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
        gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniform1f(uniforms.Aspect,canvas.width/canvas.height);
        const global=matrix(tiltX+manualX,tiltY+manualY,-.06);
        const axes=[[.96,-.32,.95+phase],[.73,.44,-.66-phase*.7],[.28,1.13,.45+phase*.6],[.81,.19,-.79-phase*.5]];
        axes.forEach((angles,i)=>{const model=mul(global,matrix(...angles));const sign=i%2?1:-1;const offset=[model[6]*burst*.22*sign,model[7]*burst*.22*sign,model[8]*burst*.22*sign];draw(rings[i],model,offset,1+burst*.025,i===3?0:1);});
        draw(ball,global,[0,0,0],.30,0,hover&&!motionOff?1.04+Math.sin(now*.004)*.04:1);
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
      const loop=now=>{frame=0;if(!active||motionOff||introActive||introClosing||!inView||document.hidden)return;render(now);frame=requestAnimationFrame(loop);};
      const resume=()=>{if(active&&!frame&&!motionOff&&!introActive&&!introClosing&&inView&&!document.hidden){last=performance.now();frame=requestAnimationFrame(loop);}};
      const stop=()=>{cancelAnimationFrame(frame);frame=0;};
      const resize=()=>{const r=stage.getBoundingClientRect(),dpr=innerWidth<600?Math.min(Math.max(devicePixelRatio||1,1.35),1.6):Math.min(Math.max(devicePixelRatio||1,1.75),2);canvas.width=Math.min(1280,Math.max(1,Math.round(r.width*dpr)));canvas.height=canvas.width;resizeBloom();render(performance.now());resume();};
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
