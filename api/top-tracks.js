function getCookie(req, name) {
  const cookies = req.headers.cookie || "";
  const match = cookies.split(";").map(c => c.trim()).find(c => c.startsWith(name + "="));
  return match ? match.split("=")[1] : null;
}

export default async function handler(req, res) {
  const token = getCookie(req, "spotify_access_token");

  if (!token) {
    res.status(401).json({ authenticated: false });
    return;
  }

  try {
    const topRes = await fetch(
      "https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=short_term",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const topData = await topRes.json();

    if (!topRes.ok) {
      res.status(topRes.status).json({ authenticated: true, error: topData });
      return;
    }

    const tracks = (topData.items || []).map(t => ({
      name: t.name,
      artist: t.artists.map(a => a.name).join(", "),
      popularity: t.popularity,
    }));

    // Audio features endpoint availability has been in flux with Spotify's
    // 2026 API changes — fail gracefully if it's unavailable rather than
    // breaking the whole request.
    let audioFeatures = null;
    try {
      const ids = topData.items.map(t => t.id).join(",");
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
    res.status(500).json({ authenticated: false, error: err.message });
  }
}
