// Cloudflare Worker for Steam Game Night Step 2.
// Add a Worker secret named STEAM_API_KEY. Never paste the key into this file.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function parseProfile(input) {
  let url;
  try { url = new URL(input); } catch { throw new Error('Enter a valid Steam profile URL.'); }
  if (!['steamcommunity.com', 'www.steamcommunity.com'].includes(url.hostname.toLowerCase())) {
    throw new Error('That is not a Steam Community profile URL.');
  }
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts[0] === 'profiles' && /^\d{17}$/.test(parts[1] || '')) return { steamid: parts[1] };
  if (parts[0] === 'id' && parts[1]) return { vanity: parts[1] };
  throw new Error('Use a steamcommunity.com/id/... or /profiles/... link.');
}

async function resolveSteamId(profile, key) {
  if (profile.steamid) return profile.steamid;
  const u = new URL('https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/');
  u.searchParams.set('key', key);
  u.searchParams.set('vanityurl', profile.vanity);
  const r = await fetch(u);
  const d = await r.json();
  if (!r.ok || d?.response?.success !== 1 || !d?.response?.steamid) throw new Error('Could not resolve that Steam custom URL.');
  return d.response.steamid;
}

async function getOwnedGames(steamid, key) {
  const u = new URL('https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/');
  u.searchParams.set('key', key);
  u.searchParams.set('steamid', steamid);
  u.searchParams.set('include_appinfo', 'true');
  u.searchParams.set('include_played_free_games', 'true');
  const r = await fetch(u);
  const d = await r.json();
  if (!r.ok) throw new Error('Steam did not return this library.');
  const games = d?.response?.games;
  if (!Array.isArray(games)) throw new Error('No public game library was returned. Make sure Game details are Public on Steam.');
  return games.map(g => ({ appid: g.appid, name: g.name, playtime_forever: g.playtime_forever || 0 }));
}

async function getPersonaName(steamid, key) {
  const u = new URL('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/');
  u.searchParams.set('key', key); u.searchParams.set('steamids', steamid);
  const r = await fetch(u); const d = await r.json();
  return d?.response?.players?.[0]?.personaname || 'Player';
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
    const url = new URL(request.url);
    if (url.pathname === '/') return json({ ok: true, service: 'Steam Game Night API' });
    if (url.pathname !== '/library') return json({ error: 'Not found.' }, 404);
    if (!env.STEAM_API_KEY) return json({ error: 'Server is missing STEAM_API_KEY.' }, 500);

    try {
      const raw = url.searchParams.get('profile');
      if (!raw) return json({ error: 'Missing profile URL.' }, 400);
      const profile = parseProfile(raw);
      const steamid = await resolveSteamId(profile, env.STEAM_API_KEY);
      const [games, personaName] = await Promise.all([
        getOwnedGames(steamid, env.STEAM_API_KEY),
        getPersonaName(steamid, env.STEAM_API_KEY),
      ]);
      return json({ steamid, personaName, games });
    } catch (e) {
      return json({ error: e.message || 'Steam lookup failed.' }, 400);
    }
  },
};
