# Caliper — Measurement Log

A single-file web app for tracking body/limb measurements over time. No build step, no backend — just static HTML/CSS/JS.

## Run it locally
Just double-click `index.html` and it opens in your browser. Data saves automatically to that browser's local storage.

## Host it on GitHub Pages (free, your own URL)
1. Create a new repo on GitHub (e.g. `caliper`).
2. Upload `index.html` to the repo root (drag-and-drop on the GitHub web UI works fine).
3. Go to **Settings → Pages**.
4. Under "Build and deployment," set **Source** to `Deploy from a branch`, branch `main`, folder `/ (root)`. Save.
5. Wait ~1 minute, then visit `https://<your-username>.github.io/caliper/`.

## Optional: save readings to Google Sheets (per-user, no database)
By default, data saves only to the browser you're using (localStorage) — nothing to set up, works immediately. If you'd rather each person's readings get saved straight into **their own** Google Sheet (in their own Drive — you never see or store anyone's data), set up Google sign-in:

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → create a new project (any name).
2. Go to **APIs & Services → Library**, search for and enable **Google Sheets API**.
3. Still in the Library, search for and enable **Google Drive API**.
4. Go to **APIs & Services → OAuth consent screen**. Choose **External**, fill in the required fields (app name, your email). Under **Scopes**, add:
   - `.../auth/spreadsheets`
   - `.../auth/drive.file`
   - `.../auth/userinfo.email`

   Under **Test users**, add your own Google account (and anyone else who'll use the app while it's unverified).
5. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**. Application type: **Web application**. Under **Authorized JavaScript origins**, add your GitHub Pages origin, e.g. `https://your-username.github.io`. Create it, then copy the **Client ID** it gives you.
6. Open `index.html`, find `GOOGLE_CLIENT_ID` near the top of the `<script>` section, and paste your Client ID in over the placeholder.
7. Push the updated `index.html` to your repo. Reload the page — you'll see a **Sign in with Google** button. Signing in creates a spreadsheet called "Caliper Measurements" in that user's own Google Drive and reads/writes readings there.

If you skip all of this, the app still works exactly as before — it just stays local to one browser.

### A note on the "unverified app" warning
While your OAuth consent screen is in **Testing** mode, anyone who isn't added as a test user will see a Google warning that the app isn't verified. That's fine for just you or a few friends (add their emails as test users). If you want anyone to be able to sign in without that warning, Google requires an app verification review — more setup than most personal projects need.

## Notes
- Nothing is sent to any server you control — each user's readings live only in a spreadsheet in **their own** Google Drive, created and edited by the app on their behalf. You (the site owner) have no access to it.
- The OAuth token used to talk to Google Sheets is kept in memory only and expires after about an hour — the app will prompt for sign-in again if it expires mid-session.
- Signing out revokes access but doesn't delete the spreadsheet — it stays in the user's Drive, and signing back in reconnects to it.
- The **Export backup** / **Import backup** buttons work in both modes and are a good manual safety net either way.
