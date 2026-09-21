const playersEl = document.querySelector('#players');
const gamesEl = document.querySelector('#games');
const countEl = document.querySelector('#count');
const statusEl = document.querySelector('#status');
const winnerEl = document.querySelector('#winner');
const canvas = document.querySelector('#wheel');
const ctx = canvas.getContext('2d');

// STEP 2: paste your deployed Worker URL here, with NO trailing slash.
// Example: https://steam-game-night-api.yourname.workers.dev
const API_BASE = 'PASTE_YOUR_WORKER_URL_HERE';

let matches = [];
let currentLibraries = [];
let rotation = 0;
let spinning = false;

function addPlayer(value = '') {
  const d = document.createElement('div');
  d.className = 'player';
  d.innerHTML = `<input placeholder="https://steamcommunity.com/id/username" value="${value}"><button class="remove">Remove</button>`;
  d.querySelector('.remove').onclick = () => { d.remove(); syncOwnership(); };
  playersEl.appendChild(d);
  syncOwnership();
}

function syncOwnership() {
  const n = playersEl.querySelectorAll('input').length;
  const s = document.querySelector('#ownership');
  const old = s.value;
  s.innerHTML = '<option value="all">Everyone</option>';
  for (let i = 2; i < n; i++) s.innerHTML += `<option value="${i}">At least ${i} players</option>`;
  if ([...s.options].some(o => o.value === old)) s.value = old;
}

async function fetchSteamLibrary(profileUrl) {
  if (API_BASE.includes('PASTE_YOUR_WORKER')) {
    throw new Error('API not connected yet. Paste your Worker URL into API_BASE in app.js.');
  }

  const response = await fetch(`${API_BASE}/library?profile=${encodeURIComponent(profileUrl)}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Steam request failed (${response.status}).`);
  return data;
}

function compare(libs) {
  const ownership = document.querySelector('#ownership').value;
  const needed = ownership === 'all' ? libs.length : Number(ownership);
  const map = new Map();

  libs.forEach(lib => {
    // Count each app only once per player's library.
    const seen = new Set();
    lib.games.forEach(g => {
      if (seen.has(g.appid)) return;
      seen.add(g.appid);
      const x = map.get(g.appid) || { appid: g.appid, name: g.name || `App ${g.appid}`, count: 0 };
      x.count++;
      map.set(g.appid, x);
    });
  });

  return [...map.values()]
    .filter(g => g.count >= needed)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function render() {
  gamesEl.innerHTML = matches.map(g => `<div class="game">🎮 ${escapeHtml(g.name)} <small>${g.count}/${currentLibraries.length}</small></div>`).join('');
  countEl.textContent = matches.length;
  drawWheel();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function drawWheel() {
  ctx.clearRect(0, 0, 520, 520);
  const n = Math.max(matches.length, 1), r = 245, c = 260;
  ctx.save(); ctx.translate(c, c); ctx.rotate(rotation);
  for (let i = 0; i < n; i++) {
    const a0 = i * 2 * Math.PI / n, a1 = (i + 1) * 2 * Math.PI / n;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, a0, a1); ctx.closePath();
    ctx.fillStyle = `hsl(${(i * 360 / n) % 360} 58% ${i % 2 ? 42 : 34}%)`;
    ctx.fill(); ctx.strokeStyle = '#0b1520'; ctx.stroke();
    if (matches.length) {
      ctx.save(); ctx.rotate((a0 + a1) / 2); ctx.textAlign = 'right'; ctx.fillStyle = 'white';
      ctx.font = `700 ${Math.max(11, Math.min(18, 170 / n + 9))}px system-ui`;
      let t = matches[i].name; t = t.length > 23 ? t.slice(0, 21) + '…' : t;
      ctx.fillText(t, r - 18, 6); ctx.restore();
    }
  }
  ctx.restore();
  if (!matches.length) {
    ctx.fillStyle = '#8da6b8'; ctx.font = '20px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('Check games to build the wheel', 260, 265);
  }
}

document.querySelector('#add').onclick = () => addPlayer();
document.querySelector('#ownership').onchange = () => {
  if (!currentLibraries.length) return;
  matches = compare(currentLibraries); winnerEl.textContent = ''; render();
};

document.querySelector('#check').onclick = async () => {
  const urls = [...playersEl.querySelectorAll('input')].map(x => x.value.trim()).filter(Boolean);
  if (urls.length < 2) { statusEl.textContent = 'Add at least two Steam profile links.'; return; }

  statusEl.textContent = `Checking ${urls.length} public Steam libraries…`;
  winnerEl.textContent = '';
  try {
    const results = await Promise.all(urls.map(fetchSteamLibrary));
    currentLibraries = results;
    matches = compare(currentLibraries);
    const playerSummary = results.map(r => `${r.personaName || 'Player'}: ${r.games.length}`).join(' • ');
    statusEl.textContent = `Live check complete. ${playerSummary}`;
    render();
  } catch (err) {
    currentLibraries = []; matches = []; render();
    statusEl.textContent = err.message;
  }
};

document.querySelector('#spin').onclick = () => {
  if (spinning || !matches.length) return;
  spinning = true; winnerEl.textContent = '';
  const chosen = Math.floor(Math.random() * matches.length), slice = 2 * Math.PI / matches.length;
  const target = (Math.PI * 1.5) - (chosen + .5) * slice;
  const start = rotation, end = target + Math.PI * 2 * (6 + Math.floor(Math.random() * 3));
  const t0 = performance.now(), dur = 4200;
  function anim(t) {
    const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
    rotation = start + (end - start) * e; drawWheel();
    if (p < 1) requestAnimationFrame(anim);
    else { rotation %= Math.PI * 2; spinning = false; winnerEl.textContent = `🎉 ${matches[chosen].name}`; }
  }
  requestAnimationFrame(anim);
};

addPlayer(); addPlayer(); drawWheel();
