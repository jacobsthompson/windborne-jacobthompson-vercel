export async function fetchBalloonState(offset) {
  const res = await fetch(`/api/balloons/${String(offset).padStart(2, "0")}`);
  if (!res.ok) throw new Error(`Bad response ${res.status}`);
  return res.json();
}

export async function fetch24hHistory() {
  const all = await Promise.all(
    [...Array(24).keys()].map(fetchBalloonState)
  );

  const byId = {};
  all.forEach(points =>
    points.forEach(p => {
      if (!byId[p.id]) byId[p.id] = [];
      byId[p.id].push(p);
    })
  );

  Object.values(byId).forEach(arr =>
    arr.sort((a, b) => a.id - b.id)
  );

  return byId;
}
