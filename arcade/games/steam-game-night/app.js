const WORKER_URL = 'PASTE_YOUR_WORKER_URL_HERE';

const playersEl = document.querySelector('#players');
const gamesEl = document.querySelector('#games');
const countEl = document.querySelector('#count');
const statusEl = document.querySelector('#status');
const winnerEl = document.querySelector('#winner');
const canvas = document.querySelector('#wheel');
const ctx = canvas.getContext('2d');
let matches = [], rotation = 0, spinning = false, lastLibraries = [];

function esc(s=''){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function addPlayer(value=''){
  const d=document.createElement('div'); d.className='player';
  d.innerHTML=`<input aria-label="Steam profile URL" placeholder="https://steamcommunity.com/profiles/7656119..." value="${esc(value)}"><button class="remove" type="button">Remove</button>`;
  d.querySelector('.remove').onclick=()=>{d.remove();syncOwnership();};
  playersEl.appendChild(d); syncOwnership();
}
function syncOwnership(){
  const n=playersEl.querySelectorAll('input').length, s=document.querySelector('#ownership');
  const old=s.value; s.innerHTML='<option value="all">Everyone</option>';
  for(let i=2;i<n;i++) s.innerHTML+=`<option value="${i}">At least ${i} players</option>`;
  if([...s.options].some(o=>o.value===old)) s.value=old;
}
function compare(libs){
  const needed=document.querySelector('#ownership').value==='all'?libs.length:+document.querySelector('#ownership').value;
  const map=new Map();
  libs.forEach(lib=>lib.games.forEach(g=>{
    const x=map.get(g.appid)||{appid:g.appid,name:g.name,count:0,img_icon_url:g.img_icon_url||''};
    x.count++; map.set(g.appid,x);
  }));
  return [...map.values()].filter(g=>g.count>=needed).sort((a,b)=>a.name.localeCompare(b.name));
}
function render(){
  gamesEl.innerHTML=matches.map(g=>`<div class="game">🎮 ${esc(g.name)} <small>${g.count}/${lastLibraries.length}</small></div>`).join('');
  countEl.textContent=matches.length; drawWheel();
}
function drawWheel(){
  ctx.clearRect(0,0,520,520); const n=Math.max(matches.length,1),r=245,c=260;
  ctx.save();ctx.translate(c,c);ctx.rotate(rotation);
  for(let i=0;i<n;i++){
    const a0=i*2*Math.PI/n,a1=(i+1)*2*Math.PI/n;
    ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r,a0,a1);ctx.closePath();
    ctx.fillStyle=`hsl(${(i*360/n)%360} 58% ${i%2?42:34}%)`;ctx.fill();ctx.strokeStyle='#0b1520';ctx.stroke();
    if(matches.length){ctx.save();ctx.rotate((a0+a1)/2);ctx.textAlign='right';ctx.fillStyle='white';ctx.font=`700 ${Math.max(11,Math.min(18,170/n+9))}px system-ui`;let t=matches[i].name;t=t.length>23?t.slice(0,21)+'…':t;ctx.fillText(t,r-18,6);ctx.restore();}
  }
  ctx.restore();
  if(!matches.length){ctx.fillStyle='#8da6b8';ctx.font='20px system-ui';ctx.textAlign='center';ctx.fillText('Check games to build the wheel',260,265);}
}
async function fetchLibrary(profile){
  const base=WORKER_URL.replace(/\/$/,'');
  const res=await fetch(`${base}/library?profile=${encodeURIComponent(profile)}`);
  let data={}; try{data=await res.json();}catch{}
  if(!res.ok) throw new Error(data.error||`Worker returned ${res.status}`);
  return data;
}

document.querySelector('#add').onclick=()=>addPlayer();
document.querySelector('#ownership').onchange=()=>{if(lastLibraries.length){matches=compare(lastLibraries);render();}};
document.querySelector('#check').onclick=async()=>{
  const urls=[...playersEl.querySelectorAll('input')].map(x=>x.value.trim()).filter(Boolean);
  if(urls.length<2){statusEl.textContent='Add at least two Steam profile links.';return;}
  if(WORKER_URL.includes('PASTE_YOUR')){statusEl.textContent='Connect your Cloudflare Worker URL at the top of app.js first.';return;}
  const btn=document.querySelector('#check'); btn.disabled=true; winnerEl.textContent=''; gamesEl.innerHTML=''; countEl.textContent='0';
  try{
    lastLibraries=[];
    for(let i=0;i<urls.length;i++){
      statusEl.textContent=`Checking player ${i+1} of ${urls.length}…`;
      lastLibraries.push(await fetchLibrary(urls[i]));
    }
    matches=compare(lastLibraries); render();
    statusEl.textContent=`Compared ${urls.length} live public Steam libraries. Found ${matches.length} matching games.`;
  }catch(err){lastLibraries=[];matches=[];render();statusEl.textContent=`Could not check libraries: ${err.message}`;}
  finally{btn.disabled=false;}
};
document.querySelector('#spin').onclick=()=>{
  if(spinning||!matches.length)return; spinning=true;winnerEl.textContent='';
  const chosen=Math.floor(Math.random()*matches.length),slice=2*Math.PI/matches.length,target=(Math.PI*1.5)-(chosen+.5)*slice;
  const start=rotation,end=target+Math.PI*2*(6+Math.floor(Math.random()*3)),t0=performance.now(),dur=4200;
  function anim(t){const p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,4);rotation=start+(end-start)*e;drawWheel();if(p<1)requestAnimationFrame(anim);else{rotation%=Math.PI*2;spinning=false;winnerEl.textContent=`🎉 ${matches[chosen].name}`;}}
  requestAnimationFrame(anim);
};
addPlayer();addPlayer();drawWheel();
