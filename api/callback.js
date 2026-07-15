export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    res.status(400).send("Missing authorization code from Spotify.");
    return;
  }

  try {
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.REDIRECT_URI,
      }),
    });

    const data = await tokenRes.json();

    if (!tokenRes.ok) {
      res.status(400).json({ error: "Spotify token exchange failed", details: data });
      return;
    }

    // Store the access token in an httpOnly cookie for this demo.
    // Good enough for a personal project; not meant for production-scale auth.
    res.setHeader(
      "Set-Cookie",
      `spotify_access_token=${data.access_token}; HttpOnly; Path=/; Max-Age=${data.expires_in}; SameSite=Lax; Secure`
    );

    res.writeHead(302, { Location: "/" });
    res.end();
  } catch (err) {
    res.status(500).json({ error: "Callback failed", details: err.message });
  }
}
