/**
 * Enhanced map module with multi-color routes and draggable markers
 */

// Global variables for map
let map;
let mapLayers = {
  route: new L.LayerGroup(),
  waypoints: new L.LayerGroup(),
  routeSegments: new L.LayerGroup(), // New layer for colored route segments
  debug: {
    nodes: new L.LayerGroup(),
    edges: new L.LayerGroup(),
    cells: new L.LayerGroup(),
    turns: new L.LayerGroup(),
    speed: new L.LayerGroup(),
    names: new L.LayerGroup(),
  },
};

// Layer markers for all waypoints
let waypointMarkers = {
  start: null,
  end: null,
  via: [], // Array to store via point markers
};

// Layer for route
let routeLines = [];
let routeSegments = []; // Array to store colored segments

// Colors for route segments (enhanced color palette)
const segmentColors = [
  "#3498db", // Blue
  "#e74c3c", // Red
  "#2ecc71", // Green
  "#9b59b6", // Purple
  "#f39c12", // Orange
  "#1abc9c", // Turquoise
  "#d35400", // Pumpkin
  "#2980b9", // Dark Blue
  "#c0392b", // Dark Red
  "#27ae60", // Dark Green
];

/**
 * Initialize map with enhanced features
 */
function initMap() {
  // Create map with Leaflet
  map = L.map("map", {
    center: CONFIG.map.center,
    zoom: CONFIG.map.zoom,
    maxZoom: CONFIG.map.maxZoom,
    minZoom: CONFIG.map.minZoom,
    zoomControl: false, // We'll create custom zoom controls
  });

  // Add base tile layer
  L.tileLayer(
    CONFIG.map.tileProvider ||
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution:
        CONFIG.map.tileAttribution ||
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | OSRM Inspector',
    }
  ).addTo(map);

  // Add all layers to map
  mapLayers.route.addTo(map);
  mapLayers.routeSegments.addTo(map); // Add the new segments layer
  mapLayers.waypoints.addTo(map);

  // Add debug layers
  Object.values(mapLayers.debug).forEach((layer) => layer.addTo(map));

  // Update coordinates when mouse moves
  map.on("mousemove", updateCoordinatesDisplay);

  // Add event for map clicks
  map.on("click", handleMapClick);

  // Setup map zoom controls
  document
    .getElementById("btn-zoom-in")
    .addEventListener("click", () => map.zoomIn());
  document
    .getElementById("btn-zoom-out")
    .addEventListener("click", () => map.zoomOut());

  // Setup sidebar toggle
  document
    .getElementById("btn-sidebar-toggle")
    .addEventListener("click", toggleSidebar);

  console.log("Map initialized successfully");

  return map;
}

/**
 * Toggle sidebar visibility
 */
function toggleSidebar() {
  document.getElementById("app").classList.toggle("sidebar-collapsed");
  // Trigger resize event so the map adjusts its size
  setTimeout(() => {
    map.invalidateSize();
  }, 300);
}

/**
 * Update coordinates display when mouse moves over map
 */
function updateCoordinatesDisplay(e) {
  const { lat, lng } = e.latlng;
  const displayFormat = `Lat: ${FormatUtils.formatCoordinate(
    lat
  )}, Lng: ${FormatUtils.formatCoordinate(lng)}`;
  const coordElement = document.getElementById("coordinates-display");
  coordElement.textContent = displayFormat;
}

/**
 * Handle click on map to determine start or end point
 */
function handleMapClick(e) {
  const latlng = e.latlng;
  const osrmFormat = [latlng.lng, latlng.lat]; // OSRM format [lng, lat]
  const coordString = FormatUtils.formatCoordinateString(osrmFormat);

  // Determine which input is active or empty to fill
  const startInput = document.getElementById("start-point");
  const endInput = document.getElementById("end-point");

  if (document.activeElement === startInput || startInput.value === "") {
    startInput.value = coordString;
    addStartMarker(latlng);
  } else if (document.activeElement === endInput || endInput.value === "") {
    endInput.value = coordString;
    addEndMarker(latlng);
  } else {
    // If both inputs are filled, replace start point
    startInput.value = coordString;
    addStartMarker(latlng);
  }
}

/**
 * Add marker for start point with draggable capability
 */
function addStartMarker(latlng) {
  // Remove old marker if exists
  if (waypointMarkers.start) {
    mapLayers.waypoints.removeLayer(waypointMarkers.start);
  }

  // Create new marker with custom icon
  waypointMarkers.start = L.marker(latlng, {
    icon: L.divIcon({
      className: "custom-div-icon start-icon",
      html: `<div style="background-color:${CONFIG.routing.colors.driving}; width:12px; height:12px; border-radius:50%; border: 2px solid white;"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    }),
    draggable: true, // Make marker draggable
    waypoint: "start",
  });

  // Add drag events for auto-routing
  waypointMarkers.start.on("dragend", function (event) {
    const marker = event.target;
    const position = marker.getLatLng();
    const osrmFormat = [position.lng, position.lat];
    const coordString = FormatUtils.formatCoordinateString(osrmFormat);

    // Update input field
    document.getElementById("start-point").value = coordString;

    // Update waypoints list
    updateWaypointsList();

    // If auto-routing is enabled, find new route
    if (
      document.getElementById("auto-route-toggle") &&
      document.getElementById("auto-route-toggle").checked
    ) {
      findRouteWithMultipleWaypoints();
    }
  });

  // Add marker to layer
  mapLayers.waypoints.addLayer(waypointMarkers.start);
}

/**
 * Add marker for end point with draggable capability
 */
function addEndMarker(latlng) {
  // Remove old marker if exists
  if (waypointMarkers.end) {
    mapLayers.waypoints.removeLayer(waypointMarkers.end);
  }

  // Create new marker with custom icon
  waypointMarkers.end = L.marker(latlng, {
    icon: L.divIcon({
      className: "custom-div-icon end-icon",
      html: `<div style="background-color:#e74c3c; width:12px; height:12px; border-radius:50%; border: 2px solid white;"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    }),
    draggable: true, // Make marker draggable
    waypoint: "end",
  });

  // Add drag events for auto-routing
  waypointMarkers.end.on("dragend", function (event) {
    const marker = event.target;
    const position = marker.getLatLng();
    const osrmFormat = [position.lng, position.lat];
    const coordString = FormatUtils.formatCoordinateString(osrmFormat);

    // Update input field
    document.getElementById("end-point").value = coordString;

    // Update waypoints list
    updateWaypointsList();

    // If auto-routing is enabled, find new route
    if (
      document.getElementById("auto-route-toggle") &&
      document.getElementById("auto-route-toggle").checked
    ) {
      findRouteWithMultipleWaypoints();
    }
  });

  // Add marker to layer
  mapLayers.waypoints.addLayer(waypointMarkers.end);
}

/**
 * Add a marker for via points with draggable capability
 */
function addViaMarker(latlng, inputId) {
  // Extract index from input ID (like "via-point-1")
  const index = inputId.split("-").pop();

  // Create a unique marker ID
  const markerId = `via-marker-${index}`;

  // Check if a marker with this ID already exists
  let existingMarkerIndex = waypointMarkers.via.findIndex(
    (m) => m.options.markerId === markerId
  );

  // Remove existing marker if found
  if (existingMarkerIndex !== -1) {
    mapLayers.waypoints.removeLayer(waypointMarkers.via[existingMarkerIndex]);
    waypointMarkers.via.splice(existingMarkerIndex, 1);
  }

  // Create a new marker with custom icon
  const viaMarker = L.marker(latlng, {
    markerId: markerId, // Store ID in marker options for easier retrieval
    icon: L.divIcon({
      className: "custom-div-icon via-icon",
      html: `<div style="background-color:#f39c12; width:12px; height:12px; border-radius:50%; border: 2px solid white;"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    }),
    draggable: true, // Make marker draggable
    waypoint: "via",
    waypointIndex: index,
  });

  // Add drag events for auto-routing
  viaMarker.on("dragend", function (event) {
    const marker = event.target;
    const position = marker.getLatLng();
    const osrmFormat = [position.lng, position.lat];
    const coordString = FormatUtils.formatCoordinateString(osrmFormat);

    // Update input field
    document.getElementById(`via-point-${marker.options.waypointIndex}`).value =
      coordString;

    // Update waypoints list
    updateWaypointsList();

    // If auto-routing is enabled, find new route
    if (
      document.getElementById("auto-route-toggle") &&
      document.getElementById("auto-route-toggle").checked
    ) {
      findRouteWithMultipleWaypoints();
    }
  });

  // Add to waypoints layer
  mapLayers.waypoints.addLayer(viaMarker);
  waypointMarkers.via.push(viaMarker);

  console.log(
    `Added via marker ${markerId} at coordinates: ${latlng.lat},${latlng.lng}`
  );
}

/**
 * Display route on map with multi-color segments between waypoints
 */
function displayRoute(routeData, profile = "driving") {
  clearRoute();

  if (!routeData || !routeData.routes || routeData.routes.length === 0) return;

  const route = routeData.routes[0];

  // If no legs are present, display the entire route as a single line
  if (!route.legs || route.legs.length === 0) {
    const geometry = route.geometry;
    // Get color based on profile
    const color =
      CONFIG.routing.colors[profile] || CONFIG.routing.colors.driving;

    // Add main polyline
    const routeLine = L.geoJSON(geometry, {
      style: {
        color: color,
        weight: CONFIG.routing.lineWeight,
        opacity: CONFIG.routing.lineOpacity,
        lineJoin: "round",
        lineCap: "round",
      },
    });

    mapLayers.route.addLayer(routeLine);
    routeLines.push(routeLine);

    // Zoom to route
    map.fitBounds(routeLine.getBounds(), {
      padding: [50, 50],
    });

    return routeLine;
  }

  // Process each leg as a separate segment with different colors
  route.legs.forEach((leg, index) => {
    if (!leg.geometry) return;

    // Get color for this segment (cycle through colors)
    const color = segmentColors[index % segmentColors.length];

    // Create a polyline for this leg
    const segmentLine = L.geoJSON(leg.geometry, {
      style: {
        color: color,
        weight: CONFIG.routing.lineWeight,
        opacity: CONFIG.routing.lineOpacity,
        lineJoin: "round",
        lineCap: "round",
      },
    });

    // Add segment to map
    mapLayers.routeSegments.addLayer(segmentLine);
    routeSegments.push(segmentLine);

    // Add hover highlight effect
    if (leg.steps) {
      leg.steps.forEach((step) => {
        if (step.geometry) {
          const stepLine = L.geoJSON(step.geometry, {
            style: {
              color: color,
              weight: CONFIG.routing.lineWeight + 2,
              opacity: 0,
              lineJoin: "round",
              lineCap: "round",
            },
          });

          // Add hover effect
          stepLine.on("mouseover", function () {
            this.setStyle({
              opacity: CONFIG.routing.highlightOpacity,
            });
          });

          stepLine.on("mouseout", function () {
            this.setStyle({
              opacity: 0,
            });
          });

          mapLayers.routeSegments.addLayer(stepLine);
          routeSegments.push(stepLine);
        }
      });
    }
  });

  // Add waypoint dots at each segment junction for better visibility
  if (route.legs.length > 0) {
    // Start point should already be marked

    // Mark via points where legs meet
    for (let i = 0; i < route.legs.length - 1; i++) {
      if (route.legs[i].steps && route.legs[i].steps.length > 0) {
        const lastStep = route.legs[i].steps[route.legs[i].steps.length - 1];
        if (lastStep.maneuver && lastStep.maneuver.location) {
          const location = lastStep.maneuver.location;
          const leafletLocation = FormatUtils.toLeafletCoordinates(location);

          // Create a small circular marker at the junction
          const junctionMarker = L.circleMarker(leafletLocation, {
            radius: 4,
            color: "white",
            fillColor: segmentColors[(i + 1) % segmentColors.length],
            fillOpacity: 1,
            weight: 1,
          });

          mapLayers.routeSegments.addLayer(junctionMarker);
          routeSegments.push(junctionMarker);
        }
      }
    }

    // End point should already be marked
  }

  // Create a line for the full route (for zooming purposes)
  const fullRouteLine = L.geoJSON(route.geometry, {
    style: {
      opacity: 0, // Invisible, just for bounding
    },
  });

  // Zoom to entire route
  map.fitBounds(fullRouteLine.getBounds(), {
    padding: [50, 50],
  });

  return routeSegments;
}

/**
 * Clear all routes from map
 */
function clearRoute() {
  // Clear main route lines
  routeLines.forEach((line) => {
    mapLayers.route.removeLayer(line);
  });
  routeLines = [];

  // Clear colored segments
  routeSegments.forEach((segment) => {
    mapLayers.routeSegments.removeLayer(segment);
  });
  routeSegments = [];
}

/**
 * Clear all waypoint markers
 */
function clearWaypoints() {
  mapLayers.waypoints.clearLayers();
  waypointMarkers.start = null;
  waypointMarkers.end = null;
  waypointMarkers.via = [];
}

/**
 * Clear all debug visualizations
 */
function clearAllDebugLayers() {
  Object.values(mapLayers.debug).forEach((layer) => {
    layer.clearLayers();
  });
}

/**
 * Clear specific debug visualization
 */
function clearDebugLayer(layerName) {
  if (mapLayers.debug[layerName]) {
    mapLayers.debug[layerName].clearLayers();
  }
}

// Make functions globally accessible
window.initMap = initMap;
window.displayRoute = displayRoute;
window.clearRoute = clearRoute;
window.clearWaypoints = clearWaypoints;
window.addStartMarker = addStartMarker;
window.addEndMarker = addEndMarker;
window.addViaMarker = addViaMarker;
window.clearAllDebugLayers = clearAllDebugLayers;
window.clearDebugLayer = clearDebugLayer;
