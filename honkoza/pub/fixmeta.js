(async()=>{
const sc=document.scrollingElement; for(let y=0;y<4000;y+=300){sc.scrollBy(0,300); window.dispatchEvent(new Event('scroll')); await new Promise(r=>setTimeout(r,100));} await new Promise(r=>setTimeout(r,1000));
const si=(el,v)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,v); el.dispatchEvent(new Event('input',{bubbles:true}));};
const st=(el,v)=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el,v); el.dispatchEvent(new Event('input',{bubbles:true}));};
let n=0; const out=[];
[...document.querySelectorAll('input')].filter(i=>i.name!=='title'&&/（2分）$/.test(i.value)).forEach(i=>{si(i,i.value.replace('（2分）','（1分半）'));n++;out.push(i.value);});
[...document.querySelectorAll('textarea')].forEach(t=>{const v=t.value.replace(/貼って/g,'入れて').replace(/2分で/g,'1分半で'); if(v!==t.value){st(t,v);n++;out.push(v);}});
await new Promise(r=>setTimeout(r,500)); window.confirm=()=>true;
if(n>0){const u=[...document.querySelectorAll('button')].find(x=>x.innerText.trim()==='更新'); setTimeout(()=>u.click(),200);}
return document.querySelector('input[name=title]').value.slice(0,8)+' changed '+n+' | '+out.join(' / ');
})()
