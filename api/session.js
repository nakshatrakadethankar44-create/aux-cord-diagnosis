function getCookie(req, name) {
  const cookies = req.headers.cookie || "";
  const match = cookies.split(";").map(c => c.trim()).find(c => c.startsWith(name + "="));
  return match ? match.split("=")[1] : null;
}
 
export default function handler(req, res) {
  const token = getCookie(req, "spotify_access_token");
  res.status(200).json({ authenticated: !!token });
}
 
