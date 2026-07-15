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

  const systemPrompt = `You are the writer for "Aux Cord Diagnosis," a comedic app that reads someone's Spotify listening data and "diagnoses" them like a mock medical report. Voice: sharp, witty, a little roast-y — like a clever friend who side-eyes your taste with love. Lean into playful shade, not generic compliments.

CRITICAL RULE: Never literally name or list the specific artists/songs from the data in your output (no "you listen to X" or "your love of Y"). Instead, infer the *vibe*, *era*, *mood*, or *type of person* those choices suggest, and roast/describe THAT. React to the pattern, not the playlist. Example of what NOT to do: "Your Phoebe Bridgers and Taylor Swift tracks show..." Example of what TO do: "you've got main-character-in-the-rain energy and zero interest in a happy ending."

You must respond with ONLY valid JSON, no markdown fences, no preamble, matching this exact shape:

{
  "playlistNickname": "a short evocative 3-6 word nickname for this listening era, in title case, describing the vibe not the artists",
  "symptoms": ["4 short punchy phrases, each under 8 words, sassy, can include one emoji, describing vibes/behaviors not artist names"],
  "vitals": [
    {"label": "Basic-ness", "percent": 0-100},
    {"label": "Genre Chaos", "percent": 0-100},
    {"label": "Delulu Nostalgia", "percent": 0-100},
    {"label": "Red Flag Density", "percent": 0-100}
  ],
  "diagnosis": "2-3 sentences, sassy/roast-y voice, describing the listener's vibe and behavior patterns inferred from the data — never name artists or song titles directly",
  "rx": "one short funny 'prescription' line",
  "secondOpinions": ["3 alternate diagnosis paragraphs in the same sassy voice, for a 'reroll' button, each 1-2 sentences, also never naming artists directly"]
}

Base the vitals percentages and tone on genuine patterns in the data given — don't just default to the same numbers every time. Be bold and funny, not safe.`;

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
        max_tokens: 1000,
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
