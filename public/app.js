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
let activeBKS = [];
let markers = [];

let connections = [];
let selectedConnection = null;
let currentIndex = 0;

// Initial load
async function init() {
  map.on('load', async () => {
    console.log('Map loaded');
    await loadData();

    const result = createConnections(balloons,burgerkings);
    connections = result.connections;
    console.log(burgerkings);
    activeBKS = result.filteredBKs;
    console.log(activeBKS);

    renderMap(balloons,activeBKS);

    currentIndex = 0;
    selectedConnection = connections[currentIndex];
    setupUI();
    updateUI();
    fitToConnection(selectedConnection);

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
  if (!burgerkings.length) {
    throw new Error("No Burger Kings loaded");
  }

  const usedBKs = new Set();
  const connections = balloons.map(balloon => {
    const closestBK = findClosestBurgerKing(balloon, burgerkings);
    console.log(closestBK.id);
    usedBKs.add(closestBK.id);

    return { balloon, burgerKing: closestBK.bk, distance: closestBK.distance };
  }).filter(Boolean);

  console.log(usedBKs);

  // Only keep BKs that have at least one connection

  console.log(burgerkings.filter(bk => usedBKs.has(bk.id)));
  const filteredBKs = burgerkings.filter(bk => usedBKs.has(bk.id));
  console.log(filteredBKs);
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
  el.className = "marker marker-balloon";
  el.textContent = "🎈";
  el.style.cursor = 'pointer';

  const marker = new maplibregl.Marker({
    element: el,
    anchor: 'center'
  })
    .setLngLat([balloon.lon, balloon.lat])
    .addTo(map);

  el.addEventListener('click', () => {
    const conn = connections.find(c => c.balloon.id === balloon.id);
    console.log("Clicked");
    if (!conn) return;
    console.log("Clicked 2");
    selectConnection(conn);
    fitToConnection(selectedConnection);
  });

  markers.push(marker);
});

  // Render Burger Kings 🍔 (only those used)
  filteredBKs.forEach(bk => {
  const el = document.createElement('div');
  el.className = "marker marker-bk";
  el.textContent = "🍔";

  const marker = new maplibregl.Marker({
    element: el,
    anchor: "center"
  })
    .setLngLat([bk.lon, bk.lat])
    .addTo(map);

  el.addEventListener('click', () => {
    const conn = connections.find(c => c.burgerKing.id === bk.id);
    console.log("Clicked");
    if (!conn) return;
    console.log("Clicked 2");
    selectConnection(conn);
    fitToConnection(selectedConnection);
  });

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

//HELPERS

function selectConnection(conn) {
  selectedConnection = conn;
  currentIndex = connections.findIndex(
    c => c.balloon.id === conn.balloon.id
  );

  updateUI();
  updateMarkerOpacity();
  fitToConnection(selectedConnection);
}

function updateMarkerOpacity() {
  if (!selectedConnection) return;
  
  markers.forEach(marker => {
    const el = marker.getElement();

    const isBalloon =
      marker.getLngLat().lat === selectedConnection.balloon.lat &&
      marker.getLngLat().lng === selectedConnection.balloon.lon;

    const isBK =
      marker.getLngLat().lat === selectedConnection.burgerKing.lat &&
      marker.getLngLat().lng === selectedConnection.burgerKing.lon;

    el.style.opacity = (isBalloon || isBK) ? "1" : "0.4";
  });

  connections.forEach(conn => {
    const lineId = `line-${conn.balloon.id}`;
    if (!map.getLayer(lineId)) return;

    map.setPaintProperty(
      lineId,
      'line-opacity',
      conn.balloon.id === selectedConnection.balloon.id ? 1 : 0.4
    );
  });
}

function fitToConnection(conn) {
  if (!conn || !conn.burgerKing) return;

  const b = conn.balloon;
  const bk = conn.burgerKing;

  const bounds = new maplibregl.LngLatBounds(
    [b.lon, b.lat],
    [bk.lon, bk.lat]
  );

  map.fitBounds(bounds, {
    padding: 120,     // space for UI panel
    maxZoom: 7,       // prevent zooming in too far
    duration: 1200,
    easing: t => t
  });
}


function selectByIndex(index) {
  currentIndex = index;
  selectedConnection = connections[currentIndex];
  updateUI();
  fitToConnection(selectedConnection);
}

export function toMiles(m) {
  return (m / 1609.34).toFixed(2);
}

//UI

function updateUI() {
  if (!selectedConnection) return;

  document.getElementById("distance-text").textContent =
    `${selectedConnection.balloon.id} is ${toMiles(selectedConnection.distance)} miles away from Burger King`;

  document.getElementById("location-text").textContent =
    `Lat ${selectedConnection.balloon.lat.toFixed(3)}, Lon ${selectedConnection.balloon.lon.toFixed(3)}`;
}

function setupUI() {
  document.getElementById("prev-btn").onclick = () => {
    selectByIndex((currentIndex - 1 + connections.length) % connections.length );
    console.log("Pressed Prev Button")
    fitToConnection(selectedConnection);
    updateUI();
  };

  document.getElementById("next-btn").onclick = () => {
    selectByIndex((currentIndex + 1) % connections.length);
    fitToConnection(selectedConnection);
    updateUI();
  };

  document.getElementById("closest-btn").onclick = () => {
    selectByIndex(0);
    fitToConnection(selectedConnection);
    updateUI();
  };

  document.getElementById("furthest-btn").onclick = () => {
    selectByIndex(connections.length - 1);
    fitToConnection(selectedConnection);
    updateUI();
  };

  document.getElementById("random-btn").onclick = () => {
    selectByIndex(Math.floor(Math.random() * connections.length));
    fitToConnection(selectedConnection);
    updateUI();
  };
}

init();