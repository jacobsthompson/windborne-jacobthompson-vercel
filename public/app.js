import { fetch24hHistory } from "./lib/balloons.js";
import { fetchAirQuality } from "./lib/airquality.js";

// Map setup (maplibregl is loaded globally from script tag)
const map = new maplibregl.Map({
  container: "map",
  style: "https://demotiles.maplibre.org/style.json",
  center: [0, 20],
  zoom: 1.8
});

let balloonTracks = {};
let markers = [];
let lines = [];
const MAX_BALLOONS = 50; // Limit for performance

async function init() {
  await loadData();
  setInterval(loadData, 5 * 60 * 1000); // Refresh every 5 min
}

async function loadData() {
  console.log("Refreshing data...");
  const data = await fetch24hHistory();
  balloonTracks = data;
  console.log("Loaded balloons:", Object.keys(balloonTracks).length);
  renderTracks(balloonTracks);
}

function clearOldMarkers() {
  markers.forEach(m => m.remove());
  markers = [];

  lines.forEach(l => {
    if (map.getLayer(l.id)) map.removeLayer(l.id);
    if (map.getSource(l.id)) map.removeSource(l.id);
  });
  lines = [];
}

function renderTracks(byId) {
  clearOldMarkers();

  const balloonEntries = Object.entries(byId).slice(0, MAX_BALLOONS);

  balloonEntries.forEach(([id, points]) => {
    if (!points.length) return;

    const latest = points[points.length - 1];
    if (latest.lat == null || latest.lon == null) return;

    // Marker
    const marker = new maplibregl.Marker({ color: "#ff4f4f" })
      .setLngLat([latest.lon, latest.lat])
      .addTo(map);

    marker.getElement().addEventListener("click", async () => {
      if (!latest.air) {
        latest.air = await fetchAirQuality(latest.lat, latest.lon);
      }
      showBalloonDetails(points);
    });

    markers.push(marker);

    // Trail
    const coords = points.map(p => [p.lon, p.lat]);
    const lineId = `line-${id}`;

    if (map.getSource(lineId)) {
      map.removeLayer(lineId);
      map.removeSource(lineId);
    }

    map.addSource(lineId, {
      type: "geojson",
      data: {
        type: "Feature",
        geometry: { type: "LineString", coordinates: coords }
      }
    });

    map.addLayer({
      id: lineId,
      type: "line",
      source: lineId,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": "#ff4f4f", "line-width": 2 }
    });

    lines.push({ id: lineId });
  });
}

function showBalloonDetails(points) {
  const latest = points[points.length - 1];
  const div = document.getElementById("balloon-details");

  div.textContent = `
Balloon ID: ${latest.id}
Latest Position: (${latest.lat.toFixed(3)}, ${latest.lon.toFixed(3)})
Altitude: ${latest.alt ?? "unknown"}

Air Quality at Last Fix:
  PM2.5: ${latest.air?.pm25 ?? "N/A"}
  PM10:  ${latest.air?.pm10 ?? "N/A"}
  CO:    ${latest.air?.co ?? "N/A"}

History Points: ${points.length}
  `.trim();
}

init();