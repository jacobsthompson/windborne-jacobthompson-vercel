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
let activePopup = null;
const MAX_BALLOONS = 100;

let selectedBalloonID = null;

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

  if (activePopup) {
    activePopup.remove();
    activePopup = null;
  }
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

    // Draw trail line
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
          "line-color": "#ff4f4f",
          "line-width": 3,
          "line-opacity": 0.5  // Half opacity by default
        }
      });

      lineIds.push(lineId);
      trailsDrawn++;
    } catch (e) {
      console.error(`Failed to add line for balloon ${id}:`, e);
    }

    // Add marker at latest position
    const el = document.createElement('div');
    el.className = 'marker';
    el.style.backgroundColor = '#ffff00';
    el.style.width = '16px';
    el.style.height = '16px';
    el.style.borderRadius = '50%';
    el.style.border = '3px solid #ff4f4f';
    el.style.cursor = 'pointer';
    el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.5)';
    el.style.opacity = '0.5';  // Half opacity by default
    el.style.transition = 'opacity 0.2s ease';

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([latest.lon, latest.lat])
      .addTo(map);

    // Hover effect - highlight marker and trail
    el.addEventListener("mouseenter", () => {
      el.style.opacity = '1';
      map.setPaintProperty(lineId, 'line-opacity', 1);
    });

    el.addEventListener("mouseleave", () => {
      if (selectedBalloonID === lineId){
        el.style.opacity = '1';
        map.setPaintProperty(lineId, 'line-opacity', 1);
      } else {
        el.style.opacity = '0.5';
        map.setPaintProperty(lineId, 'line-opacity', 0.5);
      }
    });

    // Click - show popup and details
    el.addEventListener("click", async () => {
      // Remove previous popup if exists
      if (activePopup) {
        activePopup.remove();
      }

      selectedBalloonID = lineId;
      el.style.opacity = '1'
      map.setPaintProperty(lineId, 'line-opacity', 1);

      lineIds.forEach(id => {
        if (id !== lineId) {
          el.style.opacity = '0.5'
          map.setPaintProperty(id, 'line-opacity', 0.5);
        }
      });

      // Create popup with balloon info
      const popupHTML = `
        <div style="font-family: monospace; font-size: 12px; min-width: 200px;">
          <strong>${latest.id}</strong><br/>
          ${latest.lat.toFixed(4)}°N, ${latest.lon.toFixed(4)}°E
        </div>
      `;

      activePopup = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: true,
        offset: 25
      })
        .setLngLat([latest.lon, latest.lat])
        .setHTML(popupHTML)
        .addTo(map);

      // Update details panel
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