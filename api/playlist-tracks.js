function getCookie(req, name) {
  const cookies = req.headers.cookie || "";
  const match = cookies.split(";").map(c => c.trim()).find(c => c.startsWith(name + "="));
  return match ? match.split("=")[1] : null;
}

function extractPlaylistId(input) {
  // Accepts a raw ID, or a full Spotify URL/URI
  const urlMatch = input.match(/playlist[\/:]([a-zA-Z0-9]+)/);
  if (urlMatch) return urlMatch[1];
  return input.trim();
}

export default async function handler(req, res) {
  const token = getCookie(req, "spotify_access_token");
  const { playlist } = req.query;

  if (!token) {
    res.status(401).json({ authenticated: false });
    return;
  }
  if (!playlist) {
    res.status(400).json({ error: "Missing playlist URL or ID" });
    return;
  }

  const playlistId = extractPlaylistId(playlist);

  try {
    const plRes = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50&fields=items(track(id,name,popularity,artists(name)))`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const plData = await plRes.json();

    if (!plRes.ok) {
      res.status(plRes.status).json({ authenticated: true, error: plData });
      return;
    }

    const items = (plData.items || []).filter(i => i.track);
    const tracks = items.map(i => ({
      name: i.track.name,
      artist: i.track.artists.map(a => a.name).join(", "),
      popularity: i.track.popularity,
    }));

    let audioFeatures = null;
    try {
      const ids = items.map(i => i.track.id).filter(Boolean).join(",");
      const afRes = await fetch(`https://api.spotify.com/v1/audio-features?ids=${ids}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (afRes.ok) {
        const afData = await afRes.json();
        const valid = (afData.audio_features || []).filter(Boolean);
        if (valid.length) {
          const avg = key => valid.reduce((s, f) => s + f[key], 0) / valid.length;
          audioFeatures = {
            energy: avg("energy"),
            valence: avg("valence"),
            danceability: avg("danceability"),
            acousticness: avg("acousticness"),
            tempo: avg("tempo"),
          };
        }
      }
    } catch {
      audioFeatures = null;
    }

    res.status(200).json({ authenticated: true, tracks, audioFeatures });
  } catch (err) {
    res.status(500).json({ authenticated: true, error: err.message });
  }
}
