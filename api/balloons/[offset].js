import fetch from "node-fetch";

export default async function handler(req, res) {
  const { offset } = req.query; // Vercel gives the URL param here
  const paddedOffset = String(offset).padStart(2, "0");
  const url = `https://a.windbornesystems.com/treasure/${paddedOffset}.json`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Bad response ${response.status}`);
    const json = await response.json();

    // Convert array of [lat, lon, alt] to objects
    const balloons = json.map((row, i) => ({
      id: i,
      lat: row[0],
      lon: row[1],
      alt: row[2]
    }));

    res.status(200).json(balloons);
  } catch (err) {
    console.error("Error fetching balloon:", err);
    res.status(500).json({ error: "Failed to fetch balloon data" });
  }
}
