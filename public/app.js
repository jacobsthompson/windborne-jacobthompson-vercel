import { fetch24hHistory } from "./lib/balloons.js";
import { fetchAirQuality } from "./lib/airquality.js";

const map = new maplibregl.Map({
  container: "map",
  style: "https://demotiles.maplibre.org/style.json",
  center: [0, 20],
  zoom: 2
});

let balloonTracks = {};
let markers = [];
let lineIds = [];
const MAX_BALLOONS = 100;

async function init() {
  map.on('load', async () => {
    console.log('Map loaded, now fetching data');
    await loadData();
    setInterval(loadData, 5 * 60 * 1000);
  });
}

async function loadData() {
  updateStatus('Refreshing data…');
  console.log("Refreshing data...");

  const data = await fetch24hHistory();
  balloonTracks = data;

  console.log("Loaded balloons:", Object.keys(balloonTracks).length);
  const firstBalloonId = Object.keys(balloonTracks)[0];
  if (firstBalloonId) {
    console.log("Sample balloon:", firstBalloonId, "has", balloonTracks[firstBalloonId].length, "points");
  }

  updateStatus(`Loaded ${Object.keys(balloonTracks).length} balloons`);
  renderTracks(balloonTracks);
}

function clearOldMarkers() {
  markers.forEach(m => m.remove());
  markers = [];

  lineIds.forEach(id => {
    if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource(id)) map.removeSource(id);
  });
  lineIds = [];
}

function renderTracks(byId) {
  if (!map.isStyleLoaded()) {
    console.warn('Map style not loaded yet, waiting...');
    map.once('idle', () => renderTracks(byId));
    return;
  }

  clearOldMarkers();

  const balloonEntries = Object.entries(byId).slice(0, MAX_BALLOONS);
  console.log(`Rendering ${balloonEntries.length} balloons`);

  let trailsDrawn = 0;
  let markersDrawn = 0;

  balloonEntries.forEach(([id, points]) => {
    if (!points.length) return;

    const latest = points[points.length - 1];
    if (latest.lat == null || latest.lon == null) return;

    // Draw trail line for ALL points (even if just 1)
    const coords = points.map(p => [p.lon, p.lat]);
    const lineId = `line-${id}`;

    try {
      if (map.getSource(lineId)) {
        map.removeLayer(lineId);
        map.removeSource(lineId);
      }

      map.addSource(lineId, {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: coords
          }
        }
      });

      map.addLayer({
        id: lineId,
        type: "line",
        source: lineId,
        layout: {
          "line-join": "round",
          "line-cap": "round"
        },
        paint: {
          "line-color": "#ff4f4f",  // Bright red
          "line-width": 3,           // Thicker line
          "line-opacity": 1          // Fully opaque
        }
      });

      lineIds.push(lineId);
      trailsDrawn++;

      if (trailsDrawn <= 3) {
        console.log(`Trail ${trailsDrawn}: ${points.length} points from (${coords[0][1].toFixed(2)}, ${coords[0][0].toFixed(2)}) to (${coords[coords.length-1][1].toFixed(2)}, ${coords[coords.length-1][0].toFixed(2)})`);
      }
    } catch (e) {
      console.error(`Failed to add line for balloon ${id}:`, e);
    }

    // Add marker at latest position
    const el = document.createElement('div');
    el.className = 'marker';
    el.style.backgroundColor = '#ffff00';  // Yellow marker
    el.style.width = '16px';
    el.style.height = '16px';
    el.style.borderRadius = '50%';
    el.style.border = '3px solid #ff4f4f';
    el.style.cursor = 'pointer';
    el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.5)';
    el.style.zIndex = '1000';

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([latest.lon, latest.lat])
      .addTo(map);

    marker.getElement().addEventListener("click", async () => {
      if (!latest.air) {
        latest.air = await fetchAirQuality(latest.lat, latest.lon);
      }
      showBalloonDetails(points);
    });

    markers.push(marker);
    markersDrawn++;
  });

  console.log(`FINAL: Drew ${trailsDrawn} trails and ${markersDrawn} markers`);
  updateStatus(`Showing ${markersDrawn} balloons with ${trailsDrawn} trails`);
}

function showBalloonDetails(points) {
  const latest = points[points.length - 1];
  const div = document.getElementById("balloon-details");

  div.textContent = `
Balloon ID: ${latest.id}
Latest Position: ${latest.lat.toFixed(4)}°N, ${latest.lon.toFixed(4)}°E
Altitude: ${latest.alt ? latest.alt.toFixed(0) + 'm' : 'unknown'}

Air Quality at Latest Position:
  PM2.5: ${latest.air?.pm25 ?? 'Loading...'}
  PM10:  ${latest.air?.pm10 ?? 'Loading...'}
  CO:    ${latest.air?.co ?? 'Loading...'}

Flight History: ${points.length} data points over 24 hours
  `.trim();
}

function updateStatus(text) {
  const statusEl = document.getElementById('status');
  if (statusEl) statusEl.textContent = text;
}

const refreshBtn = document.getElementById('refresh-now');
if (refreshBtn) {
  refreshBtn.addEventListener('click', () => {
    updateStatus('Manual refresh…');
    loadData();
  });
}

init();