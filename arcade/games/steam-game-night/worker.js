const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{...CORS,'Content-Type':'application/json'}});

function parseProfile(input){
  const value=(input||'').trim();
  if(/^7656119\d{10}$/.test(value)) return {steamid:value};
  let url; try{url=new URL(value);}catch{return null;}
  if(!/(^|\.)steamcommunity\.com$/i.test(url.hostname)) return null;
  const parts=url.pathname.split('/').filter(Boolean);
  if(parts[0]==='profiles' && /^7656119\d{10}$/.test(parts[1]||'')) return {steamid:parts[1]};
  if(parts[0]==='id' && parts[1]) return {vanity:parts[1]};
  return null;
}

export default {
  async fetch(request, env){
    if(request.method==='OPTIONS') return new Response(null,{headers:CORS});
    const url=new URL(request.url);
    if(url.pathname==='/health') return json({ok:true});
    if(url.pathname!=='/library') return json({error:'Not found'},404);
    if(!env.STEAM_API_KEY) return json({error:'STEAM_API_KEY secret is not configured in the Worker.'},500);
    const parsed=parseProfile(url.searchParams.get('profile'));
    if(!parsed) return json({error:'Enter a valid Steam profile URL or SteamID64.'},400);
    let steamid=parsed.steamid;
    if(!steamid){
      const r=await fetch(`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${encodeURIComponent(env.STEAM_API_KEY)}&vanityurl=${encodeURIComponent(parsed.vanity)}`);
      const d=await r.json();
      if(!r.ok || d?.response?.success!==1) return json({error:'Could not resolve that custom Steam profile URL.'},400);
      steamid=d.response.steamid;
    }
    const endpoint=`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${encodeURIComponent(env.STEAM_API_KEY)}&steamid=${encodeURIComponent(steamid)}&include_appinfo=true&include_played_free_games=true&format=json`;
    const r=await fetch(endpoint); const d=await r.json();
    if(!r.ok) return json({error:'Steam API request failed.'},502);
    const response=d?.response||{};
    if(!Array.isArray(response.games)) return json({error:'Steam did not return this library. Make sure Profile > Game details is Public.'},403);
    return json({steamid,game_count:response.game_count||response.games.length,games:response.games.map(g=>({appid:g.appid,name:g.name||`App ${g.appid}`,img_icon_url:g.img_icon_url||'',playtime_forever:g.playtime_forever||0}))});
  }
};
