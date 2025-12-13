import { fetchCurrentBalloons } from './balloons.js';

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json',
  center: [-98.5795, 39.8283],
  zoom: 4
});

let balloonMarkers = [];
let bkMarkers = [];
let balloons = [];
let burgerKings = [];

async function loadBurgerKings() {
  try {
    const res = await fetch('/burgerkings_clean.json');
    burgerKings = await res.json();
    renderBKMarkers();
  } catch (err) {
    console.error('Failed to load Burger Kings:', err);
  }
}

async function loadBalloons() {
  balloons = await fetchCurrentBalloons();
  renderBalloonMarkers();
}

// Render only visible BK markers
function renderBKMarkers() {
  bkMarkers.forEach(m => m.remove());
  bkMarkers = [];

  const bounds = map.getBounds();
  burgerKings.forEach(bk => {
    if (bk.lat >= bounds.getSouth() &&
        bk.lat <= bounds.getNorth() &&
        bk.lon >= bounds.getWest() &&
        bk.lon <= bounds.getEast()) {

      const el = document.createElement('div');
      el.className = 'bk-marker';

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([bk.lon, bk.lat])
        .addTo(map);

      bkMarkers.push(marker);
    }
  });
}

// Render balloon markers
function renderBalloonMarkers() {
  balloonMarkers.forEach(m => m.remove());
  balloonMarkers = [];

  balloons.forEach(balloon => {
    if (!balloon.lat || !balloon.lon) return;

    const el = document.createElement('div');
    el.className = 'balloon-marker';
    el.style.backgroundColor = '#ffff00';
    el.style.width = '16px';
    el.style.height = '16px';
    el.style.borderRadius = '50%';
    el.style.border = '3px solid #ff4f4f';
    el.style.cursor = 'pointer';

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([balloon.lon, balloon.lat])
      .addTo(map);

    el.addEventListener('click', () => {
      new maplibregl.Popup({ offset: 25 })
        .setLngLat([balloon.lon, balloon.lat])
        .setHTML(`
          <strong>🎈 ${balloon.id}</strong><br/>
          Lat: ${balloon.lat.toFixed(4)}°<br/>
          Lon: ${balloon.lon.toFixed(4)}°<br/>
          Alt: ${balloon.alt ? balloon.alt.toFixed(2) + ' km' : 'unknown'}
        `)
        .addTo(map);
    });

    balloonMarkers.push(marker);
  });
}

// Re-render on map move
map.on('moveend', () => {
  renderBKMarkers();
  renderBalloonMarkers();
});

// Initial load
map.on('load', async () => {
  await loadBurgerKings();
  await loadBalloons();
  // Refresh balloons every 5 min
  setInterval(loadBalloons, 5 * 60 * 1000);
});
