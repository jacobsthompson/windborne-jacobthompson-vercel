export async function fetchBalloonState(offset) {
  try {
    const res = await fetch(`/api/balloons?offset=${offset}`);
    if (!res.ok) throw new Error("Bad response " + res.status);
    const json = await res.json();

    if (!Array.isArray(json)) {
      console.warn(`Offset ${offset}: not an array`, json);
      return [];
    }

    // Each balloon at each time gets its position index as ID
    return json
      .filter(x => Array.isArray(x) && x.length >= 2)
      .map((x, i) => ({
        // Use index as balloon ID - assumes same order across time
        balloonIndex: i,
        lat: x[0],
        lon: x[1],
        alt: x[2] ?? null,
        timeOffsetHrs: offset
      }));
  } catch (e) {
    console.warn("Corrupted or missing file:", offset, e);
    return [];
  }
}

export async function fetch24hHistory() {
  const all = await Promise.all(
    [...Array(24).keys()].map(fetchBalloonState)
  );

  const flat = all.flat();
  console.log("Total data points collected:", flat.length);

  // Group by balloon index (assumes API returns balloons in consistent order)
  const byIndex = {};
  for (const p of flat) {
    const idx = p.balloonIndex;
    if (!byIndex[idx]) byIndex[idx] = [];
    byIndex[idx].push(p);
  }

  // Convert to ID-based structure and add IDs
  const byId = {};
  for (const idx in byIndex) {
    const id = `balloon-${idx}`;
    const points = byIndex[idx];

    // Sort by time offset
    points.sort((a, b) => a.timeOffsetHrs - b.timeOffsetHrs);

    // Add ID to each point
    points.forEach(p => p.id = id);

    byId[id] = points;
  }

  console.log(`Created ${Object.keys(byId).length} balloon tracks`);

  // Show stats
  const pointCounts = Object.values(byId).map(arr => arr.length);
  console.log(`Points per balloon - min: ${Math.min(...pointCounts)}, max: ${Math.max(...pointCounts)}, avg: ${(pointCounts.reduce((a,b)=>a+b,0)/pointCounts.length).toFixed(1)}`);

  return byId;
}