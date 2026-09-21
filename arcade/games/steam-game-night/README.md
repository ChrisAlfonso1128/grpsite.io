# Steam Game Night — Live Library Build

This build removes demo data. It checks public Steam libraries live, compares games by AppID, and builds the wheel.

## 1. Deploy the Worker
Create a Cloudflare Worker and replace its code with `worker.js`.

In the Worker settings, add a **Secret** named exactly:

`STEAM_API_KEY`

Use your Steam Web API key as its value. Never put the key in `app.js` or commit it to GitHub.

## 2. Connect the website
After deploying, Cloudflare gives you a URL such as:

`https://steam-game-night-api.your-subdomain.workers.dev`

Open `app.js` and replace:

`const WORKER_URL = 'PASTE_YOUR_WORKER_URL_HERE';`

with your Worker URL.

## 3. Test
Open the Worker URL with `/health` appended. You should see `{"ok":true}`.

Then deploy the website to GitHub Pages, paste at least two public Steam profile URLs, and press **Check Games**.

## Privacy requirement
On each Steam account, **Profile > Edit Profile > Privacy Settings > Game details** must be Public. The profile URLs can be `/profiles/STEAMID64` or `/id/customname`.

## Next step
This version finds shared owned games. Multiplayer/co-op metadata filtering should be added separately rather than guessing from the owned-games response.
