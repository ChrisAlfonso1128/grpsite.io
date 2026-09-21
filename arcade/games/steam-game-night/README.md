# Steam Game Night — Step 2

This version replaces demo libraries with live public Steam library checks.

## What works
- 2+ Steam profile URLs (`/id/name` or `/profiles/SteamID64`)
- Live owned-game lookup every time **Check Games** is pressed
- No database and no saved game libraries
- Shared ownership matching (`Everyone`, `At least N players`)
- Wheel + random spin

## One-time API setup
GitHub Pages cannot safely contain your Steam Web API key. `worker.js` is a tiny Cloudflare Worker that keeps the key secret.

1. Create a Steam Web API key.
2. Create a Cloudflare Worker and replace its code with `worker.js`.
3. In the Worker's Settings / Variables and Secrets, add a **secret** named `STEAM_API_KEY` containing your Steam key.
4. Deploy the Worker and copy its public URL, for example `https://steam-game-night-api.example.workers.dev`.
5. Open `app.js` and replace:
   `const API_BASE = 'PASTE_YOUR_WORKER_URL_HERE';`
   with your Worker URL.
6. Upload `index.html`, `style.css`, and `app.js` to your GitHub Pages `games/steam-game-night/` folder.

Do **not** upload a Steam API key to GitHub.

## Steam privacy
A player's Steam **Game details** must be public for the owned-games endpoint to return the library.

## Step 3
Add live co-op/multiplayer metadata so the wheel can exclude single-player-only games.
