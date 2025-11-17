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

  // Debug: Check the structure of the data
  console.log("Loaded balloons:", Object.keys(balloonTracks).length);
  const firstBalloonId = Object.keys(balloonTracks)[0];
  if (firstBalloonId) {
    console.log("First balloon ID:", firstBalloonId);
    console.log("First balloon points count:", balloonTracks[firstBalloonId].length);
    console.log("First balloon sample point:", balloonTracks[firstBalloonId][0]);
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
    console.log(`Processing balloon ${id}: ${points.length} points`);

    if (!points.length) {
      console.log(`  Skipping balloon ${id}: no points`);
      return;
    }

    const latest = points[points.length - 1];
    if (latest.lat == null || latest.lon == null) {
      console.log(`  Skipping balloon ${id}: invalid latest position`);
      return;
    }

    // Draw trail line (if there are multiple points)
    if (points.length > 1) {
      console.log(`  Attempting to draw trail for balloon ${id} with ${points.length} points`);

      const coords = points.map(p => [p.lon, p.lat]);
      console.log(`  Trail coordinates (first 3):`, coords.slice(0, 3));

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
            "line-color": "#ff6b6b",
            "line-width": 2,
            "line-opacity": 0.7
          }
        });

        lineIds.push(lineId);
        trailsDrawn++;
        console.log(`  ✓ Successfully drew trail for balloon ${id}`);
      } catch (e) {
        console.error(`  ✗ Failed to add line for balloon ${id}:`, e);
      }
    } else {
      console.log(`  Balloon ${id} has only ${points.length} point(s), skipping trail`);
    }

    // Add marker at latest position
    const el = document.createElement('div');
    el.className = 'marker';
    el.style.backgroundColor = '#ff4f4f';
    el.style.width = '12px';
    el.style.height = '12px';
    el.style.borderRadius = '50%';
    el.style.border = '2px solid white';
    el.style.cursor = 'pointer';
    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

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