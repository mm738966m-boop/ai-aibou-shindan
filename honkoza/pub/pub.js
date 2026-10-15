(async()=>{const id=location.pathname.split('/chapters/')[1];const P=await (await fetch('https://mm738966m-boop.github.io/ai-aibou-shindan/honkoza/pub/pub.json?t='+Date.now())).json();const j=P[id];if(!j)return 'nomap';const n=j.f.split('/').pop().slice(0,2)+j.f[0];
const tb=[...document.querySelectorAll('*')].filter(e=>e.children.length==0&&/^#\d+ テキスト/.test(e.textContent)).length;const pms=[...document.querySelectorAll('.ProseMirror')];const eds=pms.map(e=>e.editor?e.editor.getHTML().length:0);
if(eds.length!==1||tb!==1||eds[0]<100)return 'GUARD '+n+' tb'+tb+' eds'+eds.join(',');
const ed=pms[0].editor;const oldImg=(ed.getHTML().match(/<img/g)||[]).length;
if(j.mode==='img'){if(oldImg!==j.nimg)return 'IMGCNT '+n+' old'+oldImg+' md'+j.nimg;if(window.__PHASE==='check')return 'check img '+n+' '+oldImg;const d=new DOMParser().parseFromString(ed.getHTML(),'text/html');const im=d.querySelectorAll('img');for(const [i,u] of j.swap){im[i].setAttribute('src',u);}ed.commands.setContent(d.body.innerHTML,true);await new Promise(r=>setTimeout(r,800));const ni2=(ed.getHTML().match(/<img/g)||[]).length;if(ni2!==j.nimg)return 'POSTIMG '+n+' '+ni2;window.confirm=()=>true;const u2=[...document.querySelectorAll('button')].find(b=>b.innerText.trim()=='更新');setTimeout(()=>u2.click(),300);return 'saved img '+n+' swapped'+j.swap.length;}
if(oldImg>j.nimg)return 'IMG '+n+' old'+oldImg+' new'+j.nimg;
if(window.__PHASE==='check')return 'check '+n+' len'+eds[0]+' img'+oldImg;
ed.commands.setContent(j.html,true);await new Promise(r=>setTimeout(r,800));
const t=document.querySelector('input[name=title]');if(t&&t.value!==j.title){Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(t,j.title);t.dispatchEvent(new Event('input',{bubbles:true}));}
const after=ed.getHTML();const ni=(after.match(/<img/g)||[]).length;if(after.length<j.html.length*0.7||ni!==j.nimg)return 'POSTCHK '+n+' len'+after.length+' img'+ni;
window.confirm=()=>true;const u=[...document.querySelectorAll('button')].find(b=>b.innerText.trim()=='更新');setTimeout(()=>u.click(),300);return 'saved '+n+' len'+after.length+' img'+ni;})()
