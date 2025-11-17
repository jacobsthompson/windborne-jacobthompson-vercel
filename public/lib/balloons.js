export async function fetchBalloonState(offset) {
  try {
    const res = await fetch(`/api/balloons?offset=${offset}`);
    if (!res.ok) throw new Error("Bad response " + res.status);
    const json = await res.json();

    if (!Array.isArray(json)) return [];

    return json
      .filter(x => Array.isArray(x) && x.length >= 2)
      .map((x, i) => ({
        id: `${offset}-${i}`,
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

  const byId = {};
  for (const p of flat) {
    if (!byId[p.id]) byId[p.id] = [];
    byId[p.id].push(p);
  }

  Object.values(byId).forEach(arr =>
    arr.sort((a, b) => a.timeOffsetHrs - b.timeOffsetHrs)
  );

  return byId;
}