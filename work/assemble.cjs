const fs=require('node:fs');
const path=require('node:path');
const base=__dirname;
const css=fs.readFileSync(path.join(base,'portfolio-style.css'),'utf8');
const profile=fs.readFileSync(path.join(base,'../outputs/Mykola-Lukyniuk-Resume.pdf')).toString('base64');
const body=fs.readFileSync(path.join(base,'portfolio-body.html'),'utf8').replaceAll('__PROFILE_PDF__','data:application/pdf;base64,'+profile);
const js=fs.readFileSync(path.join(base,'portfolio-app.js'),'utf8');
const fallback=fs.readFileSync(path.join(base,'reference-images/image1.png')).toString('base64');
const horizon=fs.readFileSync(path.join(base,'assets/horizon-background.png')).toString('base64');
const html=`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#030303">
<meta name="description" content="Mykola Lukyniuk — Automation & Software Solutions Developer. Practical software, Telegram systems, API-driven tools and engineering visualization.">
<title>Mykola Lukyniuk — Software & Automation</title>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23030303'/%3E%3Cpath d='M12 44V20l12 15 12-15v24M44 20v24h10' fill='none' stroke='%23ddd' stroke-width='3'/%3E%3C/svg%3E">
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
fs.writeFileSync(path.join(base,'../outputs/mykola-lukyniuk.html'),html);
new (require('node:vm').Script)(js);
console.log(`Saved self-contained HTML (${Math.round(Buffer.byteLength(html)/1024)} KB). JavaScript syntax verified.`);
