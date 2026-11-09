  // Procedural night fields: no network, no images, and only visible scenes render.
  const nightScenes=[];
  let nightFrame=0,nightLast=0,nightClock=0;
  const randomSeed=seed=>()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const drawNight=(scene,time)=>{
    const c=scene.context;if(!c||!scene.width||!scene.height)return;
    const w=scene.width,h=scene.height,mobile=w<650;
    c.clearRect(0,0,w,h);
    const parallaxX=motionOff?0:scene.pointerX*7,parallaxY=motionOff?0:scene.pointerY*5,motionScale=mobile?.65:1;
    const drift=motionOff?0:Math.sin(time*.11+scene.index)*2.5;
    // The sky stays quiet near the main text and fades at section boundaries.
    const wash=c.createRadialGradient(w*.72,h*.46,0,w*.72,h*.46,w*.6);
    wash.addColorStop(0,'rgba(73,86,110,.07)');wash.addColorStop(.5,'rgba(41,50,68,.025)');wash.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=wash;c.fillRect(0,0,w,h);
    for(const star of scene.stars){
      const travelX=motionOff?0:time*star.speedX*motionScale,travelY=motionOff?0:time*star.speedY*motionScale;
      const x=((star.x*w+travelX+parallaxX*star.depth)%w+w)%w,y=((star.y*h+travelY+parallaxY*star.depth+drift*star.depth)%h+h)%h;
      const edge=Math.pow(Math.max(0,Math.sin(y/h*Math.PI)),.8);
      const pulse=motionOff?1:.68+.32*Math.sin(time*star.twinkle+star.phase);
      const alpha=star.alpha*edge*pulse;
      if(star.bright){const halo=c.createRadialGradient(x,y,0,x,y,8);halo.addColorStop(0,`rgba(208,220,237,${alpha*.32})`);halo.addColorStop(1,'rgba(208,220,237,0)');c.fillStyle=halo;c.fillRect(x-8,y-8,16,16);}
      c.fillStyle=`rgba(206,215,228,${alpha})`;c.beginPath();c.arc(x,y,star.size,0,Math.PI*2);c.fill();
    }
    const cross=(x,y,size,alpha)=>{c.strokeStyle=`rgba(192,204,220,${alpha})`;c.lineWidth=.65;c.beginPath();c.moveTo(x-size,y);c.lineTo(x+size,y);c.moveTo(x,y-size);c.lineTo(x,y+size);c.stroke();};
    if(scene.kind==='about'){
      const cx=w*(mobile?.83:.15)+parallaxX,cy=h*.32+drift+parallaxY;
      const r=Math.min(w*(mobile?.30:.12),135),angle=motionOff?.2:time*.024+.2;
      c.save();c.translate(cx,cy);c.rotate(angle);
      for(let i=0;i<3;i++){
        c.strokeStyle=`rgba(183,197,216,${i===0?.13:.06})`;c.lineWidth=.65;c.beginPath();c.ellipse(0,0,r*(1+i*.3),r*(.64+i*.16),i*.63,0,Math.PI*2);c.stroke();
      }
      const points=[[-.85,-.13],[-.42,-.7],[.38,-.44],[.85,.1],[.2,.75],[-.65,.48]];
      c.strokeStyle='rgba(169,186,211,.095)';c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x*r,y*r):c.moveTo(x*r,y*r));c.closePath();c.stroke();
      points.forEach(([x,y],i)=>{c.fillStyle=`rgba(231,239,248,${.38+Math.sin(time*.3+i)*.09})`;c.beginPath();c.arc(x*r,y*r,i===2?2.1:1.35,0,Math.PI*2);c.fill();});
      c.restore();cross(cx-r*1.65,cy,4,.17);cross(cx+r*1.65,cy,4,.17);
    }
    if(scene.kind==='experience'){
      const cx=w*(mobile?.76:.15)+parallaxX,cy=h*.74+parallaxY,r=Math.min(w*.13,155);
      const pulse=motionOff?.5:(time*.028)%1;
      c.strokeStyle='rgba(166,184,212,.08)';c.lineWidth=.6;
      for(let i=0;i<3;i++){c.beginPath();c.arc(cx,cy,r*(.65+i*.33),0,Math.PI*2);c.stroke();}
      c.strokeStyle='rgba(195,210,231,.12)';c.beginPath();c.moveTo(cx-r*1.7,cy);c.lineTo(cx+r*1.7,cy);c.stroke();
      cross(cx,cy,6,.24);cross(cx+r,cy,3,.16);
      const a=pulse*Math.PI*2-.6,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;
      const glow=c.createRadialGradient(x,y,0,x,y,11);glow.addColorStop(0,'rgba(238,244,253,.22)');glow.addColorStop(1,'rgba(238,244,253,0)');c.fillStyle=glow;c.fillRect(x-11,y-11,22,22);c.fillStyle='rgba(239,245,255,.6)';c.beginPath();c.arc(x,y,1.7,0,Math.PI*2);c.fill();
    }
    if(scene.kind==='skills'){
      const originX=w*.77+parallaxX,originY=h*.17+parallaxY;
      for(let row=0;row<4;row++){
        const y=originY+row*27;
        c.strokeStyle='rgba(151,177,209,.075)';c.lineWidth=.65;c.beginPath();c.moveTo(originX-w*.13,y);c.lineTo(originX+w*.15,y);c.stroke();
        const progress=motionOff?.55:(time*.022+row*.19)%1;
        const x=originX-w*.13+progress*w*.28;
        c.fillStyle='rgba(211,224,242,.42)';c.beginPath();c.arc(x,y,1.1,0,Math.PI*2);c.fill();
        cross(originX+w*.16,y,2,.14);
      }
    }
    if(scene.kind==='contact'){
      const radius=Math.max(w*.38,h*.78),cx=w*.83+parallaxX*.6,cy=h*.97+parallaxY*.5;
      const glow=c.createRadialGradient(cx,cy,radius*.86,cx,cy,radius*1.07);
      glow.addColorStop(0,'rgba(0,0,0,0)');glow.addColorStop(.48,'rgba(161,185,214,.018)');glow.addColorStop(.63,'rgba(211,226,245,.085)');glow.addColorStop(.7,'rgba(196,211,232,.025)');glow.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=glow;c.fillRect(0,0,w,h);
      c.strokeStyle='rgba(215,226,241,.12)';c.lineWidth=.7;c.beginPath();c.arc(cx,cy,radius,Math.PI,Math.PI*2);c.stroke();
      const angle=-2.15+(motionOff?0:Math.sin(time*.09)*.12);
      cross(cx+Math.cos(angle)*radius,cy+Math.sin(angle)*radius,4,.4);
    }
    scene.canvas.dataset.frame=String(Math.floor(time*30));
  };
  const requestNight=()=>{if(!nightFrame&&!motionOff&&!document.hidden&&nightScenes.some(scene=>scene.visible))nightFrame=requestAnimationFrame(tickNight);};
  function tickNight(now){
    nightFrame=0;if(motionOff||document.hidden)return;
    if(now-nightLast>=32){
      const elapsed=Math.min((now-nightLast)||32,60);nightLast=now;nightClock+=elapsed/1000;
      for(const scene of nightScenes){
        if(!scene.visible)continue;
        scene.pointerX+=(scene.aimX-scene.pointerX)*.075;scene.pointerY+=(scene.aimY-scene.pointerY)*.075;
        drawNight(scene,nightClock);
      }
    }
    requestNight();
  }
  ['about','experience','skills','contact'].forEach((kind,index)=>{
    const section=document.getElementById(kind),host=kind==='contact'?section.querySelector('.contact-panel'):section;
    host.classList.add('night-section');host.dataset.night=kind;
    const field=document.createElement('canvas');field.className='night-canvas';field.setAttribute('aria-hidden','true');host.prepend(field);
    const random=randomSeed(1047+index*579);
    const scene={kind,index,host,canvas:field,context:field.getContext('2d'),width:0,height:0,visible:false,pointerX:0,pointerY:0,aimX:0,aimY:0,stars:Array.from({length:kind==='contact'?68:96},()=>({x:random(),y:random(),size:.35+random()*.8,alpha:.11+random()*.31,depth:.3+random()*.7,phase:random()*Math.PI*2,bright:random()>.93,speedX:(random()-.5)*(kind==='contact'?3.2:2.2),speedY:(random()-.5)*(kind==='contact'?1.5:1.1),twinkle:.32+random()*.48}))};
    nightScenes.push(scene);
    const resize=()=>{
      const r=host.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.25);
      scene.width=r.width;scene.height=r.height;
      field.width=Math.max(1,Math.round(r.width*dpr));field.height=Math.max(1,Math.round(r.height*dpr));scene.context?.setTransform(dpr,0,0,dpr,0,0);
      drawNight(scene,motionOff?0:nightClock);requestNight();
    };
    if('ResizeObserver' in window)new ResizeObserver(resize).observe(host);else addEventListener('resize',resize);
    host.addEventListener('pointermove',event=>{if(motionOff||!finePointer.matches||event.pointerType!=='mouse')return;const r=host.getBoundingClientRect();scene.aimX=(event.clientX-r.left)/r.width-.5;scene.aimY=(event.clientY-r.top)/r.height-.5;},{passive:true});
    host.addEventListener('pointerleave',()=>{scene.aimX=scene.aimY=0;});
    resize();
  });
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{for(const entry of entries){const scene=nightScenes.find(scene=>scene.host===entry.target);scene.visible=entry.isIntersecting;scene.host.classList.toggle('night-visible',entry.isIntersecting);scene.canvas.dataset.active=String(entry.isIntersecting&&!motionOff);if(entry.isIntersecting&&motionOff)drawNight(scene,0);}requestNight();},{rootMargin:'50px'});
    nightScenes.forEach(scene=>observer.observe(scene.host));
  }else nightScenes.forEach(scene=>{scene.visible=true;scene.host.classList.add('night-visible');});
  night.updateMode=()=>{
    cancelAnimationFrame(nightFrame);nightFrame=0;nightLast=performance.now();
    nightScenes.forEach(scene=>{scene.canvas.dataset.active=String(scene.visible&&!motionOff);if(motionOff){scene.pointerX=scene.pointerY=0;drawNight(scene,0);}});
    requestNight();
  };
  document.addEventListener('visibilitychange',night.updateMode);night.updateMode();

  // The same soft light follows the pointer across the remaining cards.
  document.querySelectorAll('.capability,.tool-group,.timeline-row,.contact-panel').forEach(card=>{
    card.addEventListener('pointermove',event=>{
      if(motionOff||!finePointer.matches||event.pointerType!=='mouse')return;
      const r=card.getBoundingClientRect();card.style.setProperty('--glow-x',((event.clientX-r.left)/r.width*100).toFixed(1)+'%');card.style.setProperty('--glow-y',((event.clientY-r.top)/r.height*100).toFixed(1)+'%');
    },{passive:true});
  });

  // Small explanatory diagrams keep hover effects connected to the content.
  const capabilityArt=[
    '<svg viewBox="0 0 112 48"><path class="diagram-wire" d="M19 24h28m18 0h25"/><circle cx="15" cy="24" r="8"/><rect x="48" y="15" width="17" height="18" rx="5"/><circle cx="95" cy="24" r="8"/><circle class="diagram-pulse" cx="19" cy="24" r="2"/></svg>',
    '<svg viewBox="0 0 112 48"><ellipse cx="56" cy="12" rx="22" ry="7"/><path d="M34 12v24c0 9 44 9 44 0V12M34 24c0 9 44 9 44 0"/><path class="diagram-wire" d="M12 24h22m44 0h22"/><circle class="diagram-pulse" cx="17" cy="24" r="2"/></svg>',
    '<svg viewBox="0 0 112 56"><g class="diagram-cube"><path d="m56 5 22 12v22l-22 12-22-12V17zM34 17l22 12 22-12M56 29v22"/></g><path class="diagram-wire" d="M10 27h17m58 0h17"/><circle class="diagram-pulse" cx="13" cy="27" r="2"/></svg>'
  ];
  document.querySelectorAll('.capability').forEach((card,index)=>{const art=document.createElement('span');art.className='capability-art';art.setAttribute('aria-hidden','true');art.innerHTML=capabilityArt[index];card.prepend(art);});
  const toolArt=[
    '<svg viewBox="0 0 240 56"><path class="signal-wire" d="M12 28h57c19 0 19-17 39-17h25c20 0 20 34 39 34h55"/><circle cx="12" cy="28" r="3"/><circle cx="228" cy="45" r="3"/><path class="signal-run" d="M12 28h57c19 0 19-17 39-17h25c20 0 20 34 39 34h55"/></svg>',
    '<svg viewBox="0 0 240 56"><path class="signal-wire" d="M13 28h37m27 0h26m33 0h24m29 0h38"/><g class="signal-bars"><path d="M57 16v24M65 9v38M73 20v16M111 18v20M120 7v42M129 14v28M168 15v26M177 11v34M186 19v18"/></g></svg>',
    '<svg viewBox="0 0 240 56"><path class="signal-wire" d="M28 28h68m48 0h68"/><g class="signal-orbits"><ellipse cx="120" cy="28" rx="27" ry="17"/><ellipse cx="120" cy="28" rx="27" ry="17" transform="rotate(60 120 28)"/><ellipse cx="120" cy="28" rx="27" ry="17" transform="rotate(-60 120 28)"/></g><circle cx="120" cy="28" r="3"/></svg>'
  ];
  document.querySelectorAll('.tool-group').forEach((card,index)=>{const art=document.createElement('div');art.className='tool-visual';art.setAttribute('aria-hidden','true');art.innerHTML=toolArt[index];card.querySelector('.tags').before(art);});
