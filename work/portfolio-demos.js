  const demoRoot=document.querySelector('#project-demo');
  const demoScreenshot=(assetId,title)=>{
    const source=document.querySelector(assetId)?.src;
    return source?`<details class="demo-reference"><summary><span>Real project screen</span><strong>View screenshot ↘</strong></summary><figure><img src="${source}" alt="${title}" loading="lazy"><figcaption>Screen captured from the original project build.</figcaption></figure></details>`:'';
  };
  const demoShowcase=(assetId,title)=>{
    const source=document.querySelector(assetId)?.src;
    return source?`<figure class="demo-showcase"><div class="demo-showcase-label"><span>WARRIO / REAL PROJECT SCREEN</span><strong>Dashboard showcase</strong></div><img src="${source}" alt="${title}" loading="lazy"><figcaption>Original interface presented in a refined portfolio frame.</figcaption></figure>`:'';
  };
  const demoFrame=(label,content)=>`<div class="demo-frame"><div class="demo-frame-bar"><span><i></i>${label}</span><small>INTERACTIVE DEMO · SAMPLE DATA</small></div>${content}</div>`;
  const steelonDemo=()=>demoScreenshot('#asset-steelon','STEELON currency monitoring interface')+demoFrame('STEELON Exchange',`
    <div class="demo-app demo-steelon">
      <aside><b>STEELON</b><button class="active" type="button">Rates</button><button type="button">Compare</button><button type="button">History</button><span class="demo-online">● Sources online</span></aside>
      <main><div class="demo-app-head"><div><small>CURRENCY MONITORING</small><h4>EUR / UAH</h4></div><button class="demo-action" type="button" data-demo-action="refresh-rates">Refresh rates</button></div>
      <div class="demo-kpis"><article><small>NBU official</small><strong data-rate="nbu">50.53</strong><span>Current</span></article><article><small>Best sell rate</small><strong data-rate="best">50.60</strong><span>GANT</span></article><article><small>Sources</small><strong>7</strong><span>6 current</span></article></div>
      <svg class="demo-chart" viewBox="0 0 620 100" role="img" aria-label="Sample seven day currency trend"><defs><linearGradient id="demo-rate-fill" x2="0" y2="1"><stop stop-color="#77a7d9" stop-opacity=".25"/><stop offset="1" stop-color="#77a7d9" stop-opacity="0"/></linearGradient></defs><path d="M0 80 70 64 135 72 205 35 270 51 340 29 410 44 482 18 550 33 620 13V100H0Z" fill="url(#demo-rate-fill)"/><path data-demo-chart d="M0 80 70 64 135 72 205 35 270 51 340 29 410 44 482 18 550 33 620 13" fill="none" stroke="#93b9df" stroke-width="3"/></svg>
      <div class="demo-rate-table"><div class="head"><span>Source</span><span>EUR / UAH</span><span>Status</span></div><div><b>NBU · Official</b><strong data-rate="nbu">50.53</strong><span class="ok">● Current</span></div><div><b>GANT</b><strong data-rate="best">50.60</strong><span class="ok">● Current</span></div><div><b>Stankor</b><strong>50.67</strong><span>Previous date</span></div></div>
      <div class="demo-app-foot"><span data-demo-status>Last update: just now</span><button type="button" data-demo-action="telegram">Send sample update to Telegram</button></div></main>
    </div>`);
  const studentDemo=()=>demoScreenshot('#asset-student','Student Activity dashboard')+demoFrame('Student Activity',`
    <div class="demo-app demo-student">
      <aside><b>ACTIVITY<br>SYSTEM</b><button class="active" type="button">Dashboard</button><button type="button">Tasks</button><button type="button">People</button><span class="demo-online">● Bot connected</span></aside>
      <main><div class="demo-app-head"><div><small>ACTIVE TASK</small><h4>Faculty Day</h4></div><span class="demo-chip">Telegram workflow</span></div>
      <div class="student-progress"><strong><span data-student-count>3</span>/8</strong><div><span>Participation recorded</span><i><b data-student-progress style="width:37.5%"></b></i><small>Click a participant to update the sample.</small></div></div>
      <div class="student-layout"><section><h5>Participants</h5><div class="student-list"><button type="button" class="done" data-student-person><span>ОМ</span><b>Olena Melnyk</b><em>Done</em></button><button type="button" class="done" data-student-person><span>МШ</span><b>Mariia Shevchuk</b><em>Done</em></button><button type="button" class="done" data-student-person><span>ТГ</span><b>Taras Hnatiuk</b><em>Done</em></button><button type="button" data-student-person><span>ДЛ</span><b>Daryna Lys</b><em>Mark done</em></button><button type="button" data-student-person><span>МТ</span><b>Maksym Tkach</b><em>Mark done</em></button></div></section><section class="student-stat"><h5>Today</h5><strong data-student-percent>38%</strong><span>completion</span><div><small>Photos</small><b data-student-count>3</b></div><div><small>Remaining</small><b data-student-remaining>5</b></div></section></div></main>
    </div>`);
  const warrioDemo=()=>demoFrame('Warrio · Warranty platform',`
    <div class="demo-app demo-warrio">
      <aside><b>WARRIO</b><button class="active" type="button">Overview</button><button type="button">Sales</button><button type="button">Warranties</button><button type="button">Documents</button><span class="demo-online">● Supabase connected</span></aside>
      <main><div class="demo-app-head"><div><small>WARRANTY LIFECYCLE</small><h4>Operations overview</h4></div><span class="demo-chip">Role: Owner</span></div>
      <div class="demo-kpis"><article><small>Registered sales</small><strong>248</strong><span>+18 this month</span></article><article><small>Active warranties</small><strong>195</strong><span>79% of records</span></article><article><small>Awaiting action</small><strong>18</strong><span>Activation / PDF</span></article></div>
      <section class="warrio-lookup"><div><small>PUBLIC VERIFICATION DEMO</small><h5>Check a warranty</h5><p>Try the sample serial number or enter another value.</p></div><form data-warrio-form><label for="warrio-demo-code">Serial number</label><div><input id="warrio-demo-code" value="N1000-26-00094" autocomplete="off"><button type="submit">Verify</button></div></form><article data-warrio-result><span>✓</span><div><small>WARRANTY CONFIRMED</small><h5>NAVI 1000</h5><p><b>WRR-2026-00195</b> · Active warranty · Dealer: Climate Plus</p></div></article></section>
      <div class="demo-app-foot"><span>Protected public result · no customer data exposed</span><button type="button" data-demo-action="warrio-reset">Use sample code</button></div></main>
    </div>`)+demoShowcase('#asset-warrio','Warrio warranty management dashboard');
  const bindSteelon=()=>{
    let tick=0;
    demoRoot.querySelector('[data-demo-action="refresh-rates"]')?.addEventListener('click',event=>{
      tick=(tick+1)%4;const nbu=(50.53+tick*.01).toFixed(2),best=(50.60+tick*.02).toFixed(2);
      demoRoot.querySelectorAll('[data-rate="nbu"]').forEach(node=>node.textContent=nbu);
      demoRoot.querySelectorAll('[data-rate="best"]').forEach(node=>node.textContent=best);
      demoRoot.querySelector('[data-demo-status]').textContent='Updated now · 7 sources checked';
      event.currentTarget.textContent='Rates updated ✓';setTimeout(()=>{if(event.currentTarget.isConnected)event.currentTarget.textContent='Refresh rates';},1200);
    });
    demoRoot.querySelector('[data-demo-action="telegram"]')?.addEventListener('click',event=>{event.currentTarget.textContent='Sample notification sent ✓';demoRoot.querySelector('[data-demo-status]').textContent='Telegram preview updated · sample only';});
  };
  const bindStudent=()=>demoRoot.querySelectorAll('[data-student-person]').forEach(button=>button.addEventListener('click',()=>{
    button.classList.toggle('done');button.querySelector('em').textContent=button.classList.contains('done')?'Done':'Mark done';
    const total=8,count=demoRoot.querySelectorAll('[data-student-person].done').length,percent=Math.round(count/total*100);
    demoRoot.querySelectorAll('[data-student-count]').forEach(node=>node.textContent=count);
    demoRoot.querySelector('[data-student-remaining]').textContent=total-count;demoRoot.querySelector('[data-student-percent]').textContent=percent+'%';demoRoot.querySelector('[data-student-progress]').style.width=percent+'%';
  }));
  const bindWarrio=()=>{
    const form=demoRoot.querySelector('[data-warrio-form]'),input=form?.querySelector('input'),result=demoRoot.querySelector('[data-warrio-result]');
    const verify=()=>{const valid=input.value.trim().toUpperCase()==='N1000-26-00094';result.classList.toggle('not-found',!valid);result.querySelector('span').textContent=valid?'✓':'!';result.querySelector('small').textContent=valid?'WARRANTY CONFIRMED':'NO PUBLIC MATCH';result.querySelector('h5').textContent=valid?'NAVI 1000':'Check the serial number';result.querySelector('p').innerHTML=valid?'<b>WRR-2026-00195</b> · Active warranty · Dealer: Climate Plus':'This demo only recognizes the sample serial <b>N1000-26-00094</b>.';};
    form?.addEventListener('submit',event=>{event.preventDefault();verify();});
    demoRoot.querySelector('[data-demo-action="warrio-reset"]')?.addEventListener('click',()=>{input.value='N1000-26-00094';verify();input.focus();});
  };
  demos={
    render(key){
      if(!demoRoot)return;
      demoRoot.innerHTML=key==='steelon'?steelonDemo():key==='student'?studentDemo():warrioDemo();
      if(key==='steelon')bindSteelon();else if(key==='student')bindStudent();else bindWarrio();
    },
    reset(){if(demoRoot)demoRoot.replaceChildren();}
  };
