import { fetchCurrentBalloons } from './lib/balloons.js';
import { findClosestBurgerKing } from './lib/burgerking.js';

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json',
  center: [-98.5795, 39.8283],
  zoom: 4
});

let balloons = [];
let burgerkings = [];
let markers = [];

let connections = [];
let currentIndex = 0;

// Initial load
async function init() {
  map.on('load', async () => {
    console.log('Map loaded');
    await loadData();

    const result = createConnections(balloons,burgerkings);
    connections = result.connections;
    burgerkings = result.filteredBKs;

    renderMap(balloons,burgerkings);

    currentIndex = 0;
    setupUI();
    updateUI();
    flyToCurrent();

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
    const { bk, distance } = closestBK;
    if (closestBK) usedBKs.add(closestBK.id); // track which BKs are used
    return { balloon, burgerKing: bk, distance };
  }).filter(Boolean);
  // Only keep BKs that have at least one connection
  const filteredBKs = burgerkings.filter(bk => usedBKs.has(bk.id));
  connections.sort((a,b) => a.distance - b.distance);
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
    el.className = "marker";
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
    el.className = "marker";
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

//UI

export function toMiles(m) {
  return (m / 1609.34).toFixed(2);
}

function updateUI() {
  const c = connections[currentIndex];
  if (!c) return;

  document.getElementById("distance-text").textContent =
    `Balloon #${c.balloon.id} is ${toMiles(c.distance)} miles away from Burger King`;

  document.getElementById("location-text").textContent =
    `Lat ${c.balloon.lat.toFixed(3)}, Lon ${c.balloon.lon.toFixed(3)}`;
}

function flyToCurrent() {
  const c = connections[currentIndex];
  map.flyTo({
    center: [c.balloon.lon, c.balloon.lat],
    zoom: 6,
    speed: 0.8
  });
}

function setupUI() {
  document.getElementById("prev-btn").onclick = () => {
    currentIndex =
      (currentIndex - 1 + connections.length) % connections.length;
    flyToCurrent();
    updateUI();
  };

  document.getElementById("next-btn").onclick = () => {
    currentIndex = (currentIndex + 1) % connections.length;
    flyToCurrent();
    updateUI();
  };

  document.getElementById("closest-btn").onclick = () => {
    currentIndex = 0;
    flyToCurrent();
    updateUI();
  };

  document.getElementById("furthest-btn").onclick = () => {
    currentIndex = connections.length - 1;
    flyToCurrent();
    updateUI();
  };

  document.getElementById("random-btn").onclick = () => {
    currentIndex = Math.floor(Math.random() * connections.length);
    flyToCurrent();
    updateUI();
  };
}

init();