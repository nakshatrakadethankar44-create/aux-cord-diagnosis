export default function handler(req, res) {
  const scope = "user-top-read";
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope,
    redirect_uri: process.env.REDIRECT_URI,
  });

  res.writeHead(302, {
    Location: `https://accounts.spotify.com/authorize?${params.toString()}`,
  });
  res.end();
}
