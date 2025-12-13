export async function fetchCurrentBalloons() {
  try {
    const res = await fetch(`/api/balloons?offset=0`);
    if (!res.ok) throw new Error("Bad response " + res.status);
    const json = await res.json();

    if (!Array.isArray(json)) {
      console.warn(`Response not an array`, json);
      return [];
    }

    // Each balloon at each time gets its position index as ID
    return json
      .filter(x => Array.isArray(x) && x.length >= 2)
      .map((x, i) => ({
        // Use index as balloon ID - assumes same order across time
        id: `Balloon ${i}`,
        lat: x[0],
        lon: x[1],
        alt: x[2] ?? null
      }));
  } catch (e) {
    console.warn("Corrupted or missing file:", e);
    return [];
  }
}