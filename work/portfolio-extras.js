  // Case stories use known project behavior, without invented dates or metrics.
  const socialIcons=[...document.querySelectorAll('.social-icon')];
  const closeSocialHints=()=>socialIcons.forEach(icon=>icon.classList.remove('is-active'));
  socialIcons.forEach(icon=>{
    icon.addEventListener('blur',()=>icon.classList.remove('is-active'));
    icon.addEventListener('pointerleave',()=>{if(finePointer.matches)icon.classList.remove('is-active');});
    icon.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();icon.classList.remove('is-active');icon.blur();}});
  });
  document.addEventListener('click',event=>{if(!event.target.closest('.social-icon'))closeSocialHints();});
  const caseStories={
    vario:{
      lead:'A warranty lifecycle, connected from sale to verification.',
      steps:[
        {title:'Register the sale',tool:'Web · Supabase',text:'A dealer records the equipment, customer context and model. Role-based access and database policies keep private operational data behind authentication.'},
        {title:'Activate the warranty',tool:'RPC · PDF · Resend',text:'The activation workflow creates the warranty record, prepares a protected PDF with QR verification and connects delivery to server-side email automation.'},
        {title:'Verify and manage',tool:'Public QR · CRM',text:'Customers can verify a warranty without exposing personal data, while the internal team reviews warranties, installation status, tasks, documents and audit events.'}
      ],
      outcomes:[{title:'One lifecycle',text:'Sale, activation and installation stay connected.'},{title:'Protected access',text:'Roles and RLS separate public and private data.'},{title:'Customer proof',text:'PDF, email and QR verification complete the flow.'}]
    },
    steelon:{
      lead:'Changing rates. One connected workflow.',
      steps:[
        {title:'Collect API updates',tool:'API · Python',text:'The application brings currency information in through an API. That data becomes the input for the monitoring workflow, instead of a separate manual check.'},
        {title:'Keep the history',tool:'SQLite',text:'Persistent SQLite records keep historical values alongside the current information. The history remains part of the application’s workflow.'},
        {title:'Display and notify',tool:'Desktop · Telegram',text:'The desktop interface presents the currency information, while Telegram notifications bring updates into a messaging workflow.'}
      ],
      outcomes:[{title:'Monitoring',text:'API-driven currency information.'},{title:'History',text:'Historical values stored in SQLite.'},{title:'Notifications',text:'Updates connected to Telegram.'}]
    },
    student:{
      lead:'Student activity, organized through Telegram.',
      steps:[
        {title:'Organize the tasks',tool:'Telegram Bot API',text:'Student tasks are handled through Telegram. The messaging interface gives participants a familiar place to follow the activity workflow.'},
        {title:'Record submissions',tool:'Python · SQLite',text:'The system handles participant submissions and stores information persistently in SQLite, bringing the records into one structured workflow.'},
        {title:'Review the activity',tool:'Activity statistics',text:'Recorded activity supports statistics that help make the student workflow easier to review beyond the original messages.'}
      ],
      outcomes:[{title:'Tasks',text:'Student activity organized in Telegram.'},{title:'Records',text:'Persistent information in SQLite.'},{title:'Statistics',text:'A structured view of recorded activity.'}]
    }
  };
  const caseToolbar=document.querySelector('.case-toolbar');
  const caseTargets=[...dialog.querySelectorAll('.case-tabs [data-case-target]')];
  const workflowList=document.querySelector('#dialog-flow');
  const stepDetail=document.querySelector('#case-step-detail');
  let caseKey='steelon',caseFrame=0,caseScrollTween=null,stepAnimation=null;
  const setCaseStep=(index,animate=true)=>{
    const step=caseStories[caseKey].steps[index];
    dialog.dataset.caseStep=String(index);
    workflowList.querySelectorAll('button').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
    document.querySelector('#case-step-index').textContent=String(index+1).padStart(2,'0');
    document.querySelector('#case-step-title').textContent=step.title;
    document.querySelector('#case-step-description').textContent=step.text;
    document.querySelector('#case-step-tool').textContent=step.tool;
    stepAnimation?.cancel();
    if(animate&&!motionOff)stepAnimation=stepDetail.animate([{opacity:.45,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:280,easing:'cubic-bezier(.2,.75,.2,1)'});
  };
  const paintCaseReading=()=>{
    caseFrame=0;if(!dialog.open)return;
    if(caseScrollTween){
      const p=clamp((performance.now()-caseScrollTween.started)/caseScrollTween.duration);
      dialog.scrollTop=caseScrollTween.from+(caseScrollTween.to-caseScrollTween.from)*ease(p);
      if(p>=1)caseScrollTween=null;
    }
    const max=dialog.scrollHeight-dialog.clientHeight;
    const progress=max>0?clamp(dialog.scrollTop/max):1;
    dialog.style.setProperty('--case-read',String(progress));
    const marker=caseToolbar.getBoundingClientRect().bottom+80;
    let active='case-overview';
    for(const button of caseTargets)if(document.getElementById(button.dataset.caseTarget).getBoundingClientRect().top<=marker)active=button.dataset.caseTarget;
    if(dialog.scrollTop>=max-3)active='case-outcome';
    caseTargets.forEach(button=>{if(button.dataset.caseTarget===active)button.setAttribute('aria-current','location');else button.removeAttribute('aria-current');});
    if(caseScrollTween)caseFrame=requestAnimationFrame(paintCaseReading);
  };
  const requestCaseReading=()=>{if(dialog.open&&!caseFrame&&!document.hidden)caseFrame=requestAnimationFrame(paintCaseReading);};
  const scrollCaseTo=id=>{
    const target=document.getElementById(id);if(!target)return;
    const top=dialog.scrollTop+target.getBoundingClientRect().top-dialog.getBoundingClientRect().top-caseToolbar.getBoundingClientRect().height-30;
    const to=Math.max(0,Math.min(dialog.scrollHeight-dialog.clientHeight,top));
    if(motionOff){dialog.scrollTop=to;requestCaseReading();return;}
    caseScrollTween={from:dialog.scrollTop,to,started:performance.now(),duration:Math.min(700,Math.max(360,Math.sqrt(Math.abs(to-dialog.scrollTop))*14))};
    requestCaseReading();
  };
  dialog.querySelectorAll('[data-case-target]').forEach(button=>button.addEventListener('click',()=>scrollCaseTo(button.dataset.caseTarget)));
  dialog.addEventListener('scroll',requestCaseReading,{passive:true});
  const stopCaseTween=()=>{caseScrollTween=null;};
  dialog.addEventListener('wheel',stopCaseTween,{passive:true});dialog.addEventListener('touchstart',stopCaseTween,{passive:true});
  dialog.addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key))stopCaseTween();});
  workflowList.addEventListener('click',event=>{const button=event.target.closest('[data-case-step]');if(button)setCaseStep(Number(button.dataset.caseStep));});
  workflowList.addEventListener('keydown',event=>{
    const button=event.target.closest('[data-case-step]');if(!button||!['ArrowLeft','ArrowRight'].includes(event.key))return;
    event.preventDefault();const index=(Number(button.dataset.caseStep)+(event.key==='ArrowRight'?1:2))%3;
    workflowList.querySelectorAll('button')[index].focus({preventScroll:true});setCaseStep(index);
  });
  extras.renderCase=key=>{
    caseKey=key;caseScrollTween=null;stepAnimation?.cancel();dialog.dataset.projectCase=key;
    const index=projectKeys.indexOf(key),story=caseStories[key];
    document.querySelector('#case-index').textContent=`CASE ${String(index+1).padStart(2,'0')} / 03`;
    document.querySelector('#dialog-lead').textContent=story.lead;
    workflowList.replaceChildren(...story.steps.map((step,i)=>{
      const li=document.createElement('li'),button=document.createElement('button');button.type='button';button.dataset.caseStep=String(i);button.setAttribute('aria-controls','case-step-detail');
      const number=document.createElement('span');number.className='flow-number';number.textContent=String(i+1).padStart(2,'0');
      const title=document.createElement('span');title.className='case-flow-title';title.textContent=step.title;
      const arrow=document.createElement('span');arrow.className='case-flow-arrow';arrow.setAttribute('aria-hidden','true');arrow.textContent='↗';button.append(number,title,arrow);li.append(button);return li;
    }));
    document.querySelector('#case-outcome-grid').replaceChildren(...story.outcomes.map((item,i)=>{
      const article=document.createElement('article'),number=document.createElement('span'),h4=document.createElement('h4'),p=document.createElement('p');
      number.className='case-outcome-number';number.textContent=String(i+1).padStart(2,'0');h4.textContent=item.title;p.textContent=item.text;article.append(number,h4,p);return article;
    }));
    const previous=projects[projectKeys[(index+2)%3]].title,next=projects[projectKeys[(index+1)%3]].title;
    document.querySelector('#previous-project-name').textContent=previous;document.querySelector('#next-project-name').textContent=next;
    document.querySelector('#previous-project').setAttribute('aria-label','Previous project: '+previous);document.querySelector('#next-project').setAttribute('aria-label','Next project: '+next);
    setCaseStep(0,false);requestCaseReading();
    if(dialog.open)document.querySelector('#case-announcement').textContent=projects[key].title+' project story';
  };

  // A keyboard-accessible direction picker opens the existing factual cases.
  const finder=document.querySelector('#solution-finder'),finderTabs=[...finder.querySelectorAll('[role="tab"]')];
  const tabLight=finder.querySelector('.finder-tab-light');
  let finderVisible=false,finderAnimation=null;
  const paintTabLight=()=>{
    const active=finderTabs.find(button=>button.getAttribute('aria-selected')==='true');
    tabLight.style.width=active.offsetWidth+'px';tabLight.style.height=active.offsetHeight+'px';tabLight.style.transform=`translate(${active.offsetLeft}px,${active.offsetTop}px)`;
  };
  const updateFinderMotion=()=>finder.classList.toggle('finder-animating',finderVisible&&!motionOff&&!document.hidden&&!modalIsOpen());
  const selectDirection=key=>{
    const selected=finderTabs.find(button=>button.dataset.choice===key);if(!selected)return;
    const changed=selected.getAttribute('aria-selected')!=='true';finder.dataset.choice=key;
    finderAnimation?.cancel();
    for(const button of finderTabs){const active=button===selected;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;document.getElementById(button.getAttribute('aria-controls')).hidden=!active;}
    paintTabLight();
    if(changed&&!motionOff){const panel=document.getElementById(selected.getAttribute('aria-controls'));finderAnimation=panel.animate([{opacity:.3,transform:'translateY(9px)'},{opacity:1,transform:'translateY(0)'}],{duration:330,easing:'cubic-bezier(.2,.75,.2,1)'});}
  };
  for(const button of finderTabs){
    button.addEventListener('click',()=>selectDirection(button.dataset.choice));
    button.addEventListener('keydown',event=>{
      const i=finderTabs.indexOf(button);let next=null;
      if(event.key==='ArrowRight')next=(i+1)%finderTabs.length;if(event.key==='ArrowLeft')next=(i+finderTabs.length-1)%finderTabs.length;
      if(event.key==='Home')next=0;if(event.key==='End')next=finderTabs.length-1;
      if(next===null)return;event.preventDefault();finderTabs[next].focus({preventScroll:true});selectDirection(finderTabs[next].dataset.choice);
    });
  }
  finder.addEventListener('click',event=>{const button=event.target.closest('[data-open-project]');if(button)openProject(button.dataset.openProject,button);});
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{finderVisible=entries[0].isIntersecting;updateFinderMotion();},{threshold:.08}).observe(finder);
  else finderVisible=true;
  if('ResizeObserver' in window)new ResizeObserver(paintTabLight).observe(finder.querySelector('.finder-tabs'));
  selectDirection('automation');updateFinderMotion();

  // One quiet silver thread follows native scrolling from Work to Contact.
  const mainElement=document.querySelector('main'),thread=document.createElement('div');
  thread.className='page-thread';thread.setAttribute('aria-hidden','true');
  thread.innerHTML='<svg xmlns="http://www.w3.org/2000/svg"><path class="thread-base"/><path class="thread-trace"/><path class="thread-pulse"/><g class="thread-nodes"></g><circle class="thread-head" r="2.5"/></svg>';
  mainElement.prepend(thread);
  const threadSvg=thread.querySelector('svg'),threadBase=thread.querySelector('.thread-base'),threadTrace=thread.querySelector('.thread-trace'),threadPulse=thread.querySelector('.thread-pulse'),threadHead=thread.querySelector('.thread-head');
  const threadSections=['work','about','experience','skills','contact'].map(id=>document.getElementById(id));
  let threadLength=1,threadStart=0,threadEnd=1,threadPoints=[],threadFrame=0,threadMeasureFrame=0,threadProgress=0,threadVisible=false,threadLastScrollY=scrollY;
  const measureThread=()=>{
    threadMeasureFrame=0;
    const mainRect=mainElement.getBoundingClientRect(),width=mainElement.clientWidth,height=mainElement.scrollHeight;
    threadSvg.setAttribute('viewBox',`0 0 ${width} ${height}`);threadSvg.setAttribute('width',String(width));threadSvg.setAttribute('height',String(height));
    const gutter=Math.max(8,Math.min(28,(width-document.querySelector('#about .wrap').clientWidth)*.18));
    threadPoints=threadSections.map((section,i)=>{
      const label=section.querySelector('.section-label'),rect=(label||section).getBoundingClientRect();
      return{x:gutter+(i%2?5:0),y:rect.top-mainRect.top+rect.height*.5,id:section.id};
    });
    threadStart=threadPoints[0].y;threadEnd=threadPoints.at(-1).y;
    let d=`M${threadPoints[0].x} ${threadStart-50}`;
    for(let i=0;i<threadPoints.length;i++){
      const p=threadPoints[i];if(i===0)d+=`L${p.x} ${p.y}`;
      else{const previous=threadPoints[i-1],middle=(previous.y+p.y)/2;d+=`C${previous.x} ${middle} ${p.x} ${middle} ${p.x} ${p.y}`;}
    }
    d+=`L${threadPoints.at(-1).x} ${threadEnd+55}`;
    [threadBase,threadTrace,threadPulse].forEach(path=>path.setAttribute('d',d));threadLength=threadBase.getTotalLength();
    threadTrace.style.strokeDasharray=`${threadLength} ${threadLength}`;threadPulse.style.strokeDasharray=`65 ${threadLength+65}`;
    thread.querySelector('.thread-nodes').replaceChildren(...threadPoints.map(p=>{const node=document.createElementNS('http://www.w3.org/2000/svg','circle');node.setAttribute('cx',String(p.x));node.setAttribute('cy',String(p.y));node.setAttribute('r','2');node.dataset.section=p.id;return node;}));
    requestThread();
  };
  const paintThread=now=>{
    threadFrame=0;if(document.hidden)return;
    const mainRect=mainElement.getBoundingClientRect(),reading=innerHeight*.53-mainRect.top,currentScrollY=scrollY;
    let target=clamp((reading-(threadStart-50))/(threadEnd-threadStart+105));
    const scrollingDown=currentScrollY>=threadLastScrollY-.5;
    if(scrollingDown&&target<threadProgress)target=threadProgress;
    threadLastScrollY=currentScrollY;
    root.style.setProperty('--page-progress',clamp(currentScrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)).toFixed(4));
    threadVisible=reading>threadStart-innerHeight*.7&&mainRect.bottom>0&&!modalIsOpen();
    thread.style.opacity=threadVisible?'1':'0';
    threadProgress=target;
    const length=threadProgress*threadLength,point=threadBase.getPointAtLength(length);
    threadTrace.style.strokeDashoffset=String(threadLength-length);threadPulse.style.strokeDashoffset=String(32-length);
    threadHead.setAttribute('cx',String(point.x));threadHead.setAttribute('cy',String(point.y));
    let active='work';for(const p of threadPoints)if(reading>=p.y)active=p.id;
    thread.dataset.section=active;thread.dataset.progress=threadProgress.toFixed(3);
    thread.querySelectorAll('.thread-nodes circle').forEach(node=>node.classList.toggle('is-passed',reading>=threadPoints.find(p=>p.id===node.dataset.section).y));
    // Native scrolling drives the marker directly; there is no trailing spring to lag or snap back.
  };
  function requestThread(){if(!threadFrame&&!document.hidden)threadFrame=requestAnimationFrame(paintThread);}
  const requestThreadMeasure=()=>{if(!threadMeasureFrame)threadMeasureFrame=requestAnimationFrame(measureThread);};
  addEventListener('scroll',requestThread,{passive:true});addEventListener('resize',()=>{paintTabLight();requestThreadMeasure();requestCaseReading();});
  if('ResizeObserver' in window)new ResizeObserver(requestThreadMeasure).observe(mainElement);
  measureThread();
  let caseCloseTimer=0;
  extras.closeCase=()=>{
    if(!dialog.open||dialog.classList.contains('is-closing'))return;
    if(motionOff){dialog.close();return;}
    caseScrollTween=null;dialog.classList.add('is-closing');
    caseCloseTimer=setTimeout(()=>dialog.close(),220);
  };
  extras.caseOpened=()=>{clearTimeout(caseCloseTimer);dialog.classList.remove('is-closing');updateFinderMotion();requestCaseReading();requestThread();document.querySelector('#case-announcement').textContent='';};
  extras.caseClosed=()=>{clearTimeout(caseCloseTimer);dialog.classList.remove('is-closing');caseScrollTween=null;cancelAnimationFrame(caseFrame);caseFrame=0;updateFinderMotion();requestThread();};
  extras.updateMode=()=>{finderAnimation?.cancel();stepAnimation?.cancel();updateFinderMotion();if(motionOff)caseScrollTween=null;requestCaseReading();requestThread();};
  resumeDialog.addEventListener('close',()=>{updateFinderMotion();requestThread();});
  document.addEventListener('click',()=>queueMicrotask(()=>{updateFinderMotion();requestThread();}));
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){cancelAnimationFrame(threadFrame);threadFrame=0;cancelAnimationFrame(caseFrame);caseFrame=0;caseScrollTween=null;}
    else{requestThread();requestCaseReading();}updateFinderMotion();
  });
