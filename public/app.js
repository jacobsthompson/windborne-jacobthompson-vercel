import { fetchCurrentBalloons } from "./lib/balloons.js";
import { fetchBurgerKingLocations, createBalloonBKConnections } from "./lib/burgerking.js";

const map = new maplibregl.Map({
  container: "map",
  style: "https://demotiles.maplibre.org/style.json",
  center: [-98.5795, 39.8283], // Center of USA
  zoom: 4
});

let balloons = [];
let burgerKings = [];
let connections = [];
let markers = [];
let burgerKingMarkers = [];
let connectionLines = [];
let MAX_BALLOONS = 100;

async function init() {
  map.on('load', async () => {
    console.log('Map loaded, fetching data...');
    await loadData();
    setInterval(loadData, 5 * 60 * 1000); // Refresh every 5 minutes
  });
}

async function loadData() {
  updateStatus('Loading data...');
  console.log('=== Starting data load ===');

  try {
    // Fetch both balloons and BK locations
    console.log('Fetching balloons...');
    const balloonsData = await fetchCurrentBalloons();
    console.log(`Received ${balloonsData.length} balloons`);

    console.log('Fetching Burger Kings...');
    const bkData = await fetchBurgerKingLocations();
    console.log(`Received ${bkData.length} Burger Kings`);

    balloons = balloonsData;
    burgerKings = bkData;

    console.log(`Using ${balloons.length} balloons and ${burgerKings.length} Burger Kings`);

    if (balloons.length === 0) {
      updateStatus('❌ No balloons found!');
      console.error('No balloons returned from API');
      return;
    }

    if (burgerKings.length === 0) {
      updateStatus('❌ No Burger Kings found!');
      console.error('No Burger Kings returned from API');
      return;
    }

    // Create connections
    console.log('Creating connections...');
    connections = createBalloonBKConnections(balloons, burgerKings);
    console.log(`Created ${connections.length} connections`);

    if (connections.length === 0) {
      updateStatus('❌ No connections created!');
      console.error('Failed to create any connections between balloons and BKs');
      return;
    }

    updateStatus(`✓ ${balloons.length} balloons • ${burgerKings.length} Burger Kings`);
    updateConnectionStats();

    console.log('Rendering map...');
    renderMap();

  } catch (error) {
    console.error('Error loading data:', error);
    updateStatus('❌ Error loading data');
  }
}

function clearMarkers() {
  console.log(`Clearing ${markers.length} balloon markers and ${burgerKingMarkers.length} BK markers`);

  markers.forEach(m => m.remove());
  markers = [];

  burgerKingMarkers.forEach(m => m.remove());
  burgerKingMarkers = [];

  connectionLines.forEach(lineId => {
    if (map.getLayer(lineId)) map.removeLayer(lineId);
    if (map.getSource(lineId)) map.removeSource(lineId);
  });
  connectionLines = [];
}

function renderMap() {
  if (!map.isStyleLoaded()) {
    console.log('Map style not loaded yet, waiting...');
    map.once('idle', renderMap);
    return;
  }

  console.log('=== Starting renderMap ===');
  clearMarkers();

  // Render Burger Kings first
  console.log(`Rendering ${burgerKings.length} Burger King markers...`);
  burgerKings.forEach((bk, index) => {
    try {
      const el = document.createElement('div');
      el.innerHTML = '🍔';
      el.style.fontSize = '24px';
      el.style.cursor = 'pointer';
      el.style.textShadow = '0 0 4px white';

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([bk.lng, bk.lat])
        .addTo(map);

      el.addEventListener('click', () => {
        new maplibregl.Popup({ offset: 25 })
          .setLngLat([bk.lng, bk.lat])
          .setHTML(`
            <div style="font-family: monospace; font-size: 12px;">
              <strong style="color: #d62300;">🍔 Burger King</strong><br/>
              ${bk.name}<br/>
              ${bk.address || ''}<br/>
              ${bk.lat.toFixed(4)}°, ${bk.lng.toFixed(4)}°
            </div>
          `)
          .addTo(map);
      });

      burgerKingMarkers.push(marker);
    } catch (err) {
      console.error(`Failed to render BK ${index}:`, err);
    }
  });
  console.log(`✓ Rendered ${burgerKingMarkers.length} BK markers`);

  // Render balloons and connection lines
  console.log(`Rendering ${connections.length} balloon connections...`);
  let successfulBalloons = 0;
  let successfulLines = 0;

  connections.forEach((conn, index) => {
    try {
      const balloon = conn.balloon;
      const bk = conn.burgerKing;

      if (!balloon || !bk) {
        console.warn(`Connection ${index} missing balloon or BK:`, conn);
        return;
      }

      // Draw line from balloon to closest BK
      const lineId = `line-${balloon.id}`;

      try {
        // Remove existing layer/source if present
        if (map.getLayer(lineId)) map.removeLayer(lineId);
        if (map.getSource(lineId)) map.removeSource(lineId);

        map.addSource(lineId, {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [
                [balloon.lon, balloon.lat],
                [bk.lng, bk.lat]
              ]
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
            "line-color": "#00ff00",
            "line-width": 2,
            "line-opacity": 0.4,
            "line-dasharray": [2, 2]
          }
        });

        connectionLines.push(lineId);
        successfulLines++;
      } catch (e) {
        console.error(`Failed to draw line for ${balloon.id}:`, e);
      }

      // Add balloon marker
      const el = document.createElement('div');
      el.className = 'balloon-marker';
      el.style.backgroundColor = '#ffff00';
      el.style.width = '16px';
      el.style.height = '16px';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid #ff4f4f';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.5)';

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([balloon.lon, balloon.lat])
        .addTo(map);

      // Hover effects
      el.addEventListener('mouseenter', () => {
        if (map.getLayer(lineId)) {
          map.setPaintProperty(lineId, 'line-opacity', 0.8);
          map.setPaintProperty(lineId, 'line-width', 3);
        }
      });

      el.addEventListener('mouseleave', () => {
        if (map.getLayer(lineId)) {
          map.setPaintProperty(lineId, 'line-opacity', 0.4);
          map.setPaintProperty(lineId, 'line-width', 2);
        }
      });

      // Click to show info
      el.addEventListener('click', () => {
        if (map.getLayer(lineId)) {
          map.setPaintProperty(lineId, 'line-opacity', 1);
          map.setPaintProperty(lineId, 'line-width', 4);
        }

        new maplibregl.Popup({ offset: 25 })
          .setLngLat([balloon.lon, balloon.lat])
          .setHTML(`
            <div style="font-family: monospace; font-size: 12px;">
              <strong style="color: #ffff00;">🎈 ${balloon.id}</strong><br/>
              Position: ${balloon.lat.toFixed(4)}°, ${balloon.lon.toFixed(4)}°<br/>
              Altitude: ${balloon.alt ? balloon.alt.toFixed(2) + ' km' : 'unknown'}<br/>
              <hr style="margin: 8px 0;"/>
              <strong style="color: #00ff00;">Nearest Burger King:</strong><br/>
              ${bk.name}<br/>
              Distance: ${conn.distanceMiles} miles<br/>
              (${Math.round(conn.distance)} meters)
            </div>
          `)
          .addTo(map);

        showBalloonDetails(conn);
      });

      markers.push(marker);
      successfulBalloons++;

    } catch (err) {
      console.error(`Failed to render connection ${index}:`, err);
    }
  });

  console.log(`✓ Rendered ${successfulBalloons} balloons and ${successfulLines} connection lines`);
  console.log('=== renderMap complete ===');
}

function showBalloonDetails(conn) {
  const div = document.getElementById("balloon-details");

  if (!div) {
    console.warn('balloon-details element not found');
    return;
  }

  div.textContent = `
Balloon: ${conn.balloon.id}
Position: ${conn.balloon.lat.toFixed(4)}°, ${conn.balloon.lon.toFixed(4)}°
Altitude: ${conn.balloon.alt ? conn.balloon.alt.toFixed(2) + ' km' : 'unknown'}

Nearest Burger King:
  ${conn.burgerKing.name}
  ${conn.burgerKing.address || ''}
  Distance: ${conn.distanceMiles} miles (${Math.round(conn.distance)} meters)
  `.trim();
}

function updateStatus(text) {
  const statusEl = document.getElementById('status');
  if (statusEl) statusEl.textContent = text;
  console.log('Status:', text);
}

function updateConnectionStats() {
  const statsEl = document.getElementById('connection-stats');
  if (statsEl) {
    const avgDistance = connections.reduce((sum, c) => sum + parseFloat(c.distanceMiles), 0) / connections.length;
    const minDistance = Math.min(...connections.map(c => parseFloat(c.distanceMiles)));
    const maxDistance = Math.max(...connections.map(c => parseFloat(c.distanceMiles)));

    statsEl.textContent = `${connections.length} connections | Avg: ${avgDistance.toFixed(1)}mi | Min: ${minDistance.toFixed(1)}mi | Max: ${maxDistance.toFixed(1)}mi`;
  }
}

// Event listeners
const refreshBtn = document.getElementById('refresh-now');
if (refreshBtn) {
  refreshBtn.addEventListener('click', () => {
    console.log('Manual refresh triggered');
    loadData();
  });
}

const slider = document.getElementById('max-balloons-slider');
const sliderValue = document.getElementById('max-balloons-value');

if (slider) {
  slider.addEventListener('input', () => {
    const newMax = parseInt(slider.value, 10);
    if (MAX_BALLOONS !== newMax) {
      MAX_BALLOONS = newMax;
      sliderValue.textContent = MAX_BALLOONS;
      console.log(`Max balloons changed to ${MAX_BALLOONS}`);
      loadData();
    }
  });
}

console.log('App initialized, starting...');
init();