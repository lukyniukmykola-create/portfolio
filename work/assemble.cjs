const fs=require('node:fs');
const path=require('node:path');
const base=__dirname;
const content=JSON.parse(fs.readFileSync(path.join(base,'portfolio-content.json'),'utf8'));
const readPath=(object,key)=>key.split('.').reduce((value,part)=>value?.[part],object);
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,character=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
})[character]);
const fillContent=template=>template.replace(/\{\{([\w.]+)\}\}/g,(_,key)=>escapeHtml(readPath(content,key)));
const optionalContacts=[];
if(content.contact.email){
  const email=String(content.contact.email).trim();
  optionalContacts.push(`<a href="mailto:${escapeHtml(email)}">Email</a>`);
}
if(content.contact.telegram){
  const telegram=String(content.contact.telegram).trim();
  const telegramUrl=/^https:\/\//i.test(telegram)?telegram:`https://t.me/${telegram.replace(/^@/,'')}`;
  optionalContacts.push(`<a href="${escapeHtml(telegramUrl)}" target="_blank" rel="noreferrer">Telegram</a>`);
}
const optionalContactsHtml=optionalContacts.length?optionalContacts.join('<span aria-hidden="true">·</span>'):'<span>Email and Telegram can be added in <code>portfolio-content.json</code>.</span>';
const css=fs.readFileSync(path.join(base,'portfolio-style.css'),'utf8');
const profilePath=path.resolve(base,content.resume.file);
if(!fs.existsSync(profilePath))throw Error(`Resume PDF not found: ${profilePath}`);
const profile=fs.readFileSync(profilePath).toString('base64');
const imageDataUri=file=>{
  const absolute=path.resolve(base,file);
  if(!fs.existsSync(absolute))throw Error(`Project screenshot not found: ${absolute}`);
  const extension=path.extname(absolute).slice(1).toLowerCase().replace('jpg','jpeg');
  return `data:image/${extension};base64,${fs.readFileSync(absolute).toString('base64')}`;
};
const steelonScreenshot=imageDataUri('assets/project-steelon.png');
const studentScreenshot=imageDataUri('assets/project-student.png');
const warrioScreenshot=imageDataUri('assets/project-warrio-showcase.png');
const body=fillContent(fs.readFileSync(path.join(base,'portfolio-body.html'),'utf8'))
  .replaceAll('__PROFILE_PDF__','data:application/pdf;base64,'+profile)
  .replaceAll('__OPTIONAL_CONTACTS__',optionalContactsHtml)
  .replaceAll('__STEELON_SCREENSHOT__',steelonScreenshot)
  .replaceAll('__STUDENT_SCREENSHOT__',studentScreenshot)
  .replaceAll('__WARRIO_SCREENSHOT__',warrioScreenshot);
const js=fs.readFileSync(path.join(base,'portfolio-app.js'),'utf8')
  .replace('// __SECTION_NIGHT__',fs.readFileSync(path.join(base,'portfolio-night.js'),'utf8'))
  .replace('// __PROJECT_PREVIEWS__',fs.readFileSync(path.join(base,'portfolio-previews.js'),'utf8'))
  .replace('// __PORTFOLIO_EXTRAS__',fs.readFileSync(path.join(base,'portfolio-extras.js'),'utf8'))
  .replace('// __PROJECT_DEMOS__',fs.readFileSync(path.join(base,'portfolio-demos.js'),'utf8'));
const fallback=fs.readFileSync(path.join(base,'reference-images/image1.png')).toString('base64');
const horizon=fs.readFileSync(path.join(base,'assets/horizon-background.png')).toString('base64');
const html=`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#030303">
<meta name="description" content="${escapeHtml(content.site.description)}">
<title>${escapeHtml(content.site.title)}</title>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23030303'/%3E%3Cpath d='M12 44V20l12 15 12-15v24M44 20v24h10' fill='none' stroke='%23ddd' stroke-width='3'/%3E%3C/svg%3E">
<script>(function(){document.documentElement.dataset.theme='dark';try{localStorage.setItem('ml-theme','dark')}catch(e){}})()</script>
<style>
${css}
.ref-fallback{background-image:url(data:image/png;base64,${fallback})}
.horizon-field{background-image:url(data:image/png;base64,${horizon})}
</style>
</head>
<body>
${body}
<script>
${js}
</script>
</body>
</html>`;
new (require('node:vm').Script)(js);
fs.writeFileSync(path.join(base,'../outputs/mykola-lukyniuk.html'),html);
console.log(`Saved self-contained HTML (${Math.round(Buffer.byteLength(html)/1024)} KB). JavaScript syntax verified.`);
