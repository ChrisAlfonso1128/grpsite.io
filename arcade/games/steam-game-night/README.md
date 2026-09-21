# Steam Game Night — V1

Static GitHub Pages prototype for comparing Steam libraries and spinning a wheel of shared co-op/multiplayer games.

## Run locally
Open `index.html` in a browser.

## GitHub Pages
Upload these files to a GitHub repository, then enable Pages from the repository Settings > Pages.

## Current state
The complete UI, player management, shared-game comparison, filtering, and wheel work using demo library data. Live Steam retrieval is intentionally not wired directly into the browser because a Steam Web API key must not be exposed in public GitHub Pages JavaScript. The integration point is `fetchSteamLibrary()` in `app.js`.
