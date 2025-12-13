import { fetchCurrentBalloons } from "./lib/balloons.js";
import { fetchBurgerKingLocations, createBalloonBKConnections } from "./lib/burgerking.js";

/* ================================
   Map setup
================================ */

const map = new maplibregl.Map({
  container: "map",
  style: "https://demotiles.maplibre.org/style.json",
  center: [-98.5795, 39.8283],
  zoom: 4
});

/* ================================
   State
================================ */

let balloons = [];
let burgerKings = [];
let connections = [];

let balloonMarkers = [];
let burgerKingMarkers = [];

/* ================================
   Init
================================ */

async function init() {
  map.on("load", async () => {
    console.log("✓ Map loaded");

    await loadBalloons();
    await loadBurgerKingsForView();

    setInterval(loadBalloons, 5 * 60 * 1000);

    map.on("moveend", async () => {
      await loadBurgerKingsForView();
    });
  });
}

console.log("App initialized");
init();

/* ================================
   Balloon loading
================================ */

async function loadBalloons() {
  updateStatus("Loading balloons...");

  try {
    const data = await fetchCurrentBalloons();
    balloons = data.slice(0, 100);

    console.log(`🎈 Loaded ${balloons.length} balloons`);

    renderBalloons();
    updateConnections();
  } catch (err) {
    console.error(err);
    updateStatus("❌ Failed to load balloons");
  }
}

/* ================================
   Burger King loading (bounded)
================================ */

async function loadBurgerKingsForView() {
  const bounds = map.getBounds();

  burgerKings = await fetchBurgerKingLocations({
    south: bounds.getSouth(),
    west: bounds.getWest(),
    north: bounds.getNorth(),
    east: bounds.getEast()
  });

  console.log(`🍔 Loaded ${burgerKings.length} Burger Kings`);

  renderBurgerKings();
  updateConnections();
}

/* ================================
   Rendering: Balloons
================================ */

function renderBalloons() {
  balloonMarkers.forEach(m => m.remove());
  balloonMarkers = [];

  balloons.forEach(balloon => {
    if (!balloon.lat || !balloon.lon) return;

    const el = document.createElement("div");
    el.style.width = "16px";
    el.style.height = "16px";
    el.style.background = "#ffff00";
    el.style.border = "3px solid #ff4f4f";
    el.style.borderRadius = "50%";
    el.style.cursor = "pointer";

    const marker = new maplibregl.Marker(el)
      .setLngLat([balloon.lon, balloon.lat])
      .addTo(map);

    el.addEventListener("click", () => {
      new maplibregl.Popup({ offset: 25 })
        .setLngLat([balloon.lon, balloon.lat])
        .setHTML(`
          <strong>🎈 ${balloon.id}</strong><br/>
          Lat: ${balloon.lat.toFixed(4)}<br/>
          Lon: ${balloon.lon.toFixed(4)}
        `)
        .addTo(map);
    });

    balloonMarkers.push(marker);
  });
}

/* ================================
   Rendering: Burger Kings
================================ */

function renderBurgerKings() {
  burgerKingMarkers.forEach(m => m.remove());
  burgerKingMarkers = [];

  burgerKings.forEach(bk => {
    const el = document.createElement("div");
    el.style.width = "14px";
    el.style.height = "14px";
    el.style.background = "black";
    el.style.border = "3px solid red";
    el.style.borderRadius = "50%";
    el.style.zIndex = "5";

    const marker = new maplibregl.Marker(el)
      .setLngLat([bk.lon, bk.lat])
      .addTo(map);

    burgerKingMarkers.push(marker);
  });
}

/* ================================
   Connections
================================ */

function updateConnections() {
  if (!balloons.length || !burgerKings.length) return;

  connections = createBalloonBKConnections(balloons, burgerKings);
  renderConnections();
}

function renderConnections() {
  const geojson = {
    type: "FeatureCollection",
    features: connections.map(conn => ({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [conn.balloon.lon, conn.balloon.lat],
          [conn.burgerKing.lon, conn.burgerKing.lat]
        ]
      },
      properties: {
        distance: conn.distance
      }
    }))
  };

  if (map.getSource("balloon-bk-lines")) {
    map.getSource("balloon-bk-lines").setData(geojson);
    return;
  }

  map.addSource("balloon-bk-lines", {
    type: "geojson",
    data: geojson
  });

  map.addLayer({
    id: "balloon-bk-layer",
    type: "line",
    source: "balloon-bk-lines",
    paint: {
      "line-color": "#ffa500",
      "line-width": 2,
      "line-opacity": 0.6
    }
  });
}

/* ================================
   UI helpers
================================ */

function updateStatus(text) {
  const el = document.getElementById("status");
  if (el) el.textContent = text;
  console.log("Status:", text);
}
