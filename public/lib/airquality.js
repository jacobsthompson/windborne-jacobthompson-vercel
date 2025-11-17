export async function fetchAirQuality(lat, lon) {
  if (lat == null || lon == null) {
    return { pm25: null, pm10: null, co: null };
  }

  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5,pm10,carbon_monoxide&forecast_days=1`;
    const res = await fetch(url);

    if (!res.ok) throw new Error("Bad response " + res.status);
    const json = await res.json();

    return {
      pm25: json.hourly?.pm2_5?.[0] ?? null,
      pm10: json.hourly?.pm10?.[0] ?? null,
      co: json.hourly?.carbon_monoxide?.[0] ?? null
    };
  } catch (e) {
    console.warn("AQ fetch failed:", e);
    return { pm25: null, pm10: null, co: null };
  }
}