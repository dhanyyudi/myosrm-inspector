/**
 * Minimal map module for OSRM Inspector
 */

// Global variables for map
window.map = null;
window.mapLayers = {
  route: null,
  waypoints: null,
  routeSegments: null,
  debug: {
    nodes: null,
    edges: null,
    cells: null,
    turns: null,
    speed: null,
    names: null,
  },
};

// Waypoint markers
window.waypointMarkers = {
  start: null,
  end: null,
  via: [],
};

// Route lines
window.routeLines = [];
window.routeSegments = [];

/**
 * Initialize map
 */
function initMap() {
  console.log("Initializing map...");

  try {
    // Check if map is already initialized
    if (window.map && typeof window.map.getContainer === "function") {
      console.log("Map already initialized, reusing existing map");

      // Still need to create layers if they don't exist
      initializeLayers();

      // Setup map controls
      setupMapControls();

      return window.map;
    }

    // Create map with Leaflet
    const mapElement = document.getElementById("map");
    if (!mapElement) {
      throw new Error("Map container element not found");
    }

    // Check if map container has already been initialized
    if (mapElement._leaflet_id) {
      console.log(
        "Map container already has Leaflet instance, removing it first"
      );
      mapElement._leaflet_id = null;
    }

    window.map = L.map("map", {
      center: CONFIG.map.center || [-6.2, 106.8],
      zoom: CONFIG.map.zoom || 12,
      maxZoom: CONFIG.map.maxZoom || 19,
      minZoom: CONFIG.map.minZoom || 2,
      zoomControl: false,
    });

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | OSRM Inspector',
    }).addTo(window.map);

    // Initialize layers
    initializeLayers();

    // Setup map controls
    setupMapControls();

    console.log("Map initialized successfully");
    return window.map;
  } catch (error) {
    console.error("Error initializing map:", error);
    throw new Error("Map initialization failed: " + error.message);
  }
}

/**
 * Initialize map layers
 */
function initializeLayers() {
  // Initialize main layers if needed
  if (!window.mapLayers.route) {
    window.mapLayers.route = new L.LayerGroup();
    window.mapLayers.waypoints = new L.LayerGroup();
    window.mapLayers.routeSegments = new L.LayerGroup();
  }

  // Initialize debug layers if needed
  Object.keys(window.mapLayers.debug).forEach((key) => {
    if (!window.mapLayers.debug[key]) {
      window.mapLayers.debug[key] = new L.LayerGroup();
    }
  });

  // Add all layers to map
  window.mapLayers.route.addTo(window.map);
  window.mapLayers.routeSegments.addTo(window.map);
  window.mapLayers.waypoints.addTo(window.map);

  // Add debug layers
  Object.values(window.mapLayers.debug).forEach((layer) => {
    if (layer) layer.addTo(window.map);
  });
}

/**
 * Setup map control buttons
 */
function setupMapControls() {
  const zoomInBtn = document.getElementById("btn-zoom-in");
  const zoomOutBtn = document.getElementById("btn-zoom-out");
  const sidebarToggleBtn = document.getElementById("btn-sidebar-toggle");

  if (zoomInBtn) {
    zoomInBtn.addEventListener("click", () => window.map.zoomIn());
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener("click", () => window.map.zoomOut());
  }

  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener("click", toggleSidebar);
  }
}

/**
 * Toggle sidebar visibility
 */
function toggleSidebar() {
  document.getElementById("app").classList.toggle("sidebar-collapsed");
  setTimeout(() => {
    if (window.map) window.map.invalidateSize();
  }, 300);
}

/**
 * Display route on map (simplified version)
 */
function displayRoute(routeData, profile = "driving") {
  if (!routeData || !routeData.routes || routeData.routes.length === 0) {
    console.warn("No route data to display");
    return null;
  }

  // Clear existing route
  clearRoute();

  const route = routeData.routes[0];
  if (!route.geometry) {
    console.warn("Route has no geometry");
    return null;
  }

  // Get color based on profile
  const color =
    (CONFIG.routing &&
      CONFIG.routing.colors &&
      CONFIG.routing.colors[profile]) ||
    "#3498db";

  try {
    // Create a simple route line
    const routeLine = L.geoJSON(route.geometry, {
      style: {
        color: color,
        weight: 6,
        opacity: 0.8,
        lineJoin: "round",
        lineCap: "round",
      },
    });

    // Add to layer and store reference
    window.mapLayers.route.addLayer(routeLine);
    window.routeLines.push(routeLine);

    // Zoom map to route
    window.map.fitBounds(routeLine.getBounds(), {
      padding: [50, 50],
    });

    return routeLine;
  } catch (error) {
    console.error("Error displaying route:", error);
    return null;
  }
}

/**
 * Clear route display
 */
function clearRoute() {
  // Clear main route lines
  window.routeLines.forEach((line) => {
    if (window.mapLayers.route) {
      window.mapLayers.route.removeLayer(line);
    }
  });
  window.routeLines = [];

  // Clear colored segments
  window.routeSegments.forEach((segment) => {
    if (window.mapLayers.routeSegments) {
      window.mapLayers.routeSegments.removeLayer(segment);
    }
  });
  window.routeSegments = [];
}

/**
 * Clear all waypoint markers
 */
function clearWaypoints() {
  if (window.mapLayers.waypoints) {
    window.mapLayers.waypoints.clearLayers();
  }
  window.waypointMarkers.start = null;
  window.waypointMarkers.end = null;
  window.waypointMarkers.via = [];
}

/**
 * Clear all debug layers
 */
function clearAllDebugLayers() {
  Object.values(window.mapLayers.debug).forEach((layer) => {
    if (layer && typeof layer.clearLayers === "function") {
      layer.clearLayers();
    }
  });
}

/**
 * Clear specific debug layer
 */
function clearDebugLayer(layerName) {
  if (
    window.mapLayers.debug[layerName] &&
    typeof window.mapLayers.debug[layerName].clearLayers === "function"
  ) {
    window.mapLayers.debug[layerName].clearLayers();
  }
}

// Export functions to global scope
window.initMap = initMap;
window.displayRoute = displayRoute;
window.clearRoute = clearRoute;
window.clearWaypoints = clearWaypoints;
window.clearAllDebugLayers = clearAllDebugLayers;
window.clearDebugLayer = clearDebugLayer;
window.toggleSidebar = toggleSidebar;
