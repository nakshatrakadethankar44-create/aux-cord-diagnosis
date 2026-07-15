# Aux Cord Diagnosis

Reads your real Spotify top tracks and has Claude generate a personalized,
funny "diagnosis" of your listening habits.

## What's in here
- `public/index.html` — the animated frontend (parchment card, doodle stickers, etc.)
- `api/login.js` — sends you to Spotify to log in
- `api/callback.js` — handles the login redirect, stores your access token
- `api/top-tracks.js` — fetches your top tracks + audio features from Spotify
- `api/diagnose.js` — sends your track data to Claude, gets back the diagnosis

## Setup (one-time)

### 1. Spotify app
1. Go to developer.spotify.com/dashboard → **Create app**
   (requires Spotify Premium as of Feb 2026)
2. Add a Redirect URI: `https://YOUR-VERCEL-URL.vercel.app/api/callback`
   (you'll fill in the real URL after step 3 below, then come back and update this)
3. Copy your **Client ID** and **Client Secret**

### 2. Anthropic API key
1. Go to console.anthropic.com → API Keys → Create Key
2. Copy it (this is separate from your Spotify keys)

### 3. Deploy
1. Push this folder to a new GitHub repo
2. Go to vercel.com → **Add New Project** → import that repo
3. Before deploying, add these Environment Variables in Vercel's project settings:
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
   - `REDIRECT_URI` → `https://YOUR-VERCEL-URL.vercel.app/api/callback`
   - `ANTHROPIC_API_KEY`
4. Deploy. Vercel gives you a live URL.
5. Go back to your Spotify app dashboard and make sure the Redirect URI matches
   your real Vercel URL exactly (update it if you guessed wrong in step 1).

### 4. Try it
Visit your live URL → click "Connect Spotify" → log in → click "Run Diagnosis."

## Notes
- Spotify's Development Mode currently limits you to 5 authorized users on
  your account — fine for personal use and sharing with friends, not for
  a public launch without requesting an extended quota.
- If Spotify's audio-features endpoint is unavailable (their API has been
  changing), the app still works — Claude just reads the track/artist list
  without the mood/energy metrics.
