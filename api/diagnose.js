export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST" });
    return;
  }

  const { tracks, audioFeatures } = req.body;

  if (!tracks || !tracks.length) {
    res.status(400).json({ error: "No track data provided" });
    return;
  }

  const trackList = tracks
    .slice(0, 15)
    .map(t => `- ${t.name} by ${t.artist}`)
    .join("\n");

  const featuresBlock = audioFeatures
    ? `Average audio features across these tracks:
- Energy: ${audioFeatures.energy.toFixed(2)} (0=calm, 1=intense)
- Valence (mood positivity): ${audioFeatures.valence.toFixed(2)} (0=sad/dark, 1=happy)
- Danceability: ${audioFeatures.danceability.toFixed(2)}
- Acousticness: ${audioFeatures.acousticness.toFixed(2)}
- Tempo: ${audioFeatures.tempo.toFixed(0)} BPM`
    : "Audio feature data wasn't available for this request — base the read purely on the track/artist list.";

  const systemPrompt = `You are the writer for "Aux Cord Diagnosis," a comedic app that reads someone's Spotify listening data and "diagnoses" them like a mock medical report. Voice: poetic-but-memey, warm, a little roast-y, never mean-spirited. Think: a witty friend who's unreasonably good at reading vibes.

You must respond with ONLY valid JSON, no markdown fences, no preamble, matching this exact shape:

{
  "playlistNickname": "a short evocative 3-6 word nickname for this listening era, in title case",
  "symptoms": ["4 short punchy phrases, each under 8 words, can include one emoji"],
  "vitals": [
    {"label": "Basic-ness", "percent": 0-100},
    {"label": "Genre Chaos", "percent": 0-100},
    {"label": "Delulu Nostalgia", "percent": 0-100},
    {"label": "Red Flag Density", "percent": 0-100}
  ],
  "diagnosis": "2-3 sentences, poetic-memey voice, specific to this actual data — reference real patterns you notice, not generic filler",
  "rx": "one short funny 'prescription' line",
  "secondOpinions": ["3 alternate diagnosis paragraphs in the same voice, for a 'reroll' button, each 1-2 sentences"]
}

Base the vitals percentages and tone on genuine patterns in the data given — don't just default to the same numbers every time.`;

  const userPrompt = `Here is the listening data to diagnose:

Top tracks:
${trackList}

${featuresBlock}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      res.status(500).json({ error: "Claude API error", details: data });
      return;
    }

    const rawText = data.content.map(b => b.text || "").join("");
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    res.status(200).json(parsed);
  } catch (err) {
    res.status(500).json({ error: "Diagnosis generation failed", details: err.message });
  }
}
