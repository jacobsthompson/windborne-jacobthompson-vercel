import { fetchCurrentBalloons } from './lib/balloons.js';
import { findClosestBurgerKing } from './lib/burgerking.js';

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json',
  projection: 'globe',
  center: [-98.5795, 39.8283],
  zoom: 4
});

let balloons = [];
let burgerkings = [];
let markers = [];

// Initial load
async function init() {
  map.on('load', async () => {
    console.log('Map loaded');
    await loadData();

    // Refresh balloons every 5 min
    setInterval(loadData, 5 * 60 * 1000);
  });
}

async function loadData() {
  try {
    const res = await fetch('/burgerking_worldwide_locations.json');
    burgerkings = await res.json();
    balloons = await fetchCurrentBalloons();
    renderMap(balloons, burgerkings);
  } catch (err) {
    console.error('Failed to load Burger Kings:', err);
  }
}

function createConnections(balloons, burgerkings) {
  const usedBKs = new Set();
  const connections = balloons.map(balloon => {
    const closestBK = findClosestBurgerKing(balloon, burgerkings);
    if (closestBK) usedBKs.add(closestBK.id); // track which BKs are used
    return { balloon, burgerKing: closestBK };
  });

  // Only keep BKs that have at least one connection
  const filteredBKs = burgerkings.filter(bk => usedBKs.has(bk.id));
  return { connections, filteredBKs };
}

function renderMap(balloons, burgerkings) {
  const { connections, filteredBKs } = createConnections(balloons, burgerkings);

  // Clear old markers
  markers.forEach(m => m.remove());
  markers = [];

  // Render balloons 🎈
  balloons.forEach(balloon => {
    const el = document.createElement('div');
    el.textContent = "🎈";
    el.style.fontSize = '24px';
    el.style.cursor = 'pointer';

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([balloon.lon, balloon.lat])
      .addTo(map);

    markers.push(marker);
  });

  // Render Burger Kings 🍔 (only those used)
  filteredBKs.forEach(bk => {
    const el = document.createElement('div');
    el.textContent = "🍔";
    el.style.fontSize = '24px';
    el.style.cursor = 'pointer';

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([bk.lon, bk.lat])
      .addTo(map);

    markers.push(marker);
  });

  // Draw connections with lines
  connections.forEach(conn => {
    if (!conn.burgerKing) return;

    const lineId = `line-${conn.balloon.id}`;
    if (map.getSource(lineId)) map.removeLayer(lineId);

    map.addSource(lineId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [conn.balloon.lon, conn.balloon.lat],
            [conn.burgerKing.lon, conn.burgerKing.lat]
          ]
        }
      }
    });

    map.addLayer({
      id: lineId,
      type: 'line',
      source: lineId,
      layout: {},
      paint: {
        'line-color': '#ff0000',
        'line-width': 2
      }
    });
  });
}

init();