export async function fetchBalloonState(offset) {
  try {
    const res = await fetch(`/api/balloons?offset=${offset}`);
    if (!res.ok) throw new Error("Bad response " + res.status);
    const json = await res.json();

    if (!Array.isArray(json)) {
      console.warn(`Offset ${offset}: not an array`, json);
      return [];
    }

    // Return raw balloon data with offset info
    return json
      .filter(x => Array.isArray(x) && x.length >= 2)
      .map((x, i) => ({
        // Create a consistent ID based on approximate position
        // Round to 1 decimal to group nearby positions as same balloon
        positionKey: `${x[0].toFixed(1)}_${x[1].toFixed(1)}`,
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

  // Group by approximate position (balloons move, so group nearby positions)
  const byPosition = {};
  for (const p of flat) {
    if (!byPosition[p.positionKey]) byPosition[p.positionKey] = [];
    byPosition[p.positionKey].push(p);
  }

  // Now create unique IDs for each group and flatten
  const byId = {};
  let balloonCount = 0;

  for (const posKey in byPosition) {
    const points = byPosition[posKey];
    // Only keep groups with multiple time points (actual trajectories)
    if (points.length >= 2) {
      const id = `balloon-${balloonCount++}`;
      byId[id] = points.map(p => ({ ...p, id }));
    }
  }

  // Sort each balloon's points by time
  Object.values(byId).forEach(arr =>
    arr.sort((a, b) => a.timeOffsetHrs - b.timeOffsetHrs)
  );

  console.log(`Created ${Object.keys(byId).length} balloon trajectories`);
  if (Object.keys(byId).length > 0) {
    const firstId = Object.keys(byId)[0];
    console.log(`Sample: ${firstId} has ${byId[firstId].length} points`);
  }

  return byId;
}