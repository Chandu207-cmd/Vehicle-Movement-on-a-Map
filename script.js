let map = L.map('map').setView([17.385044, 78.486671], 18);
let routeData = [];
let marker, polyline;
let currentIndex = 0;
let isPlaying = false;

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

const vehicleIcon = L.icon({
  iconUrl: 'https://www.kindpng.com/picc/m/7-76952_cartoon-car-png-white-color-transparent-background-car.png',
  iconSize: [30, 60],     // adjust based on desired size
  iconAnchor: [30, 15],   // center the icon
});

function getDistance(p1, p2) {
  const R = 6371e3;
  const φ1 = p1.latitude * Math.PI / 180;
  const φ2 = p2.latitude * Math.PI / 180;
  const Δφ = (p2.latitude - p1.latitude) * Math.PI / 180;
  const Δλ = (p2.longitude - p1.longitude) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function updateUI(point, speed = null) {
  document.getElementById("coords").textContent = `${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}`;
  document.getElementById("timestamp").textContent = new Date(point.timestamp).toLocaleTimeString();
  document.getElementById("speed").textContent = speed ? `${speed} km/h` : "-";
}

function moveVehicle() {
  if (!isPlaying || currentIndex >= routeData.length - 1) {
    isPlaying = false;
    document.getElementById("playPauseBtn").textContent = "▶️ Play";
    return;
  }

  const current = routeData[currentIndex];
  const next = routeData[currentIndex + 1];
  const speed = parseInt(document.getElementById("speedSelect").value);
  updateUI(current, speed);

  marker.setLatLng([next.latitude, next.longitude]);
  map.panTo([next.latitude, next.longitude]);

  currentIndex++;
  const distance = getDistance(current, next);
  const speedMps = speed * 1000 / 3600;
  const delay = (distance / speedMps) * 1000;

  setTimeout(moveVehicle, delay);
}

function initializeMap() {
  const first = routeData[0];
  const last = routeData[routeData.length - 1];

  map.fitBounds([
    [first.latitude, first.longitude],
    [last.latitude, last.longitude]
  ]);

  if (marker) marker.remove();
  if (polyline) polyline.remove();

  marker = L.marker([first.latitude, first.longitude], { icon: vehicleIcon }).addTo(map);

  // Show full route path immediately
  const fullRoute = routeData.map(p => [p.latitude, p.longitude]);
  polyline = L.polyline(fullRoute, { color: "blue" }).addTo(map);

  updateUI(first);
}

// Fetch 100km realistic route
const start = [78.486671, 17.385044];
const end = [78.646671, 17.885044];

fetch(`https://router.project-osrm.org/route/v1/driving/${start.join(',')};${end.join(',')}?overview=full&geometries=geojson`)
  .then(res => res.json())
  .then(json => {
    const coords = json.routes[0].geometry.coordinates;
    routeData = coords.map((c, i) => ({
      longitude: c[0],
      latitude: c[1],
      timestamp: new Date(Date.now() + i * 5000).toISOString()
    }));
    initializeMap();
  });

// Controls
document.getElementById("speedSelect").addEventListener("change", () => {
  if (isPlaying) moveVehicle();
});

document.getElementById("playPauseBtn").addEventListener("click", () => {
  if (!isPlaying) {
    isPlaying = true;
    document.getElementById("playPauseBtn").textContent = "⏸️ Pause";
    moveVehicle();
  } else {
    isPlaying = false;
    document.getElementById("playPauseBtn").textContent = "▶️ Play";
  }
});

document.getElementById("restartBtn").addEventListener("click", () => {
  isPlaying = false;
  currentIndex = 0;
  document.getElementById("playPauseBtn").textContent = "▶️ Play";
  initializeMap();
});
