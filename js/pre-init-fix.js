/**
 * OSRM Inspector Pre-Initialization Fix
 * This script runs before any other components initialize
 * to ensure the map object is properly created
 */

// Execute immediately to fix map before other components initialize
(function () {
  console.log("🛠️ OSRM Pre-Initialization Fix - Running ASAP");

  // Override the map initialization function
  window.originalInitMap = window.initMap;

  // Replace with our fixed version
  window.initMap = function () {
    console.log("Running fixed map initialization");

    try {
      // Create proper map object
      const mapContainer = document.getElementById("map");
      if (!mapContainer) {
        console.error("Map container not found");
        return null;
      }

      // Check if Leaflet is loaded
      if (typeof L === "undefined") {
        console.error("Leaflet not loaded, cannot initialize map");
        return null;
      }

      // Clear existing references
      if (window.map) {
        console.log("Clearing existing map reference");
        window.map = null;
      }

      // If the container was already initialized, clean it up
      if (mapContainer._leaflet_id) {
        console.log("Removing existing Leaflet initialization from container");
        delete mapContainer._leaflet_id;
      }

      // Create a new proper map
      window.map = L.map("map", {
        center:
          CONFIG && CONFIG.map && CONFIG.map.center
            ? CONFIG.map.center
            : [0, 0],
        zoom: CONFIG && CONFIG.map && CONFIG.map.zoom ? CONFIG.map.zoom : 12,
        maxZoom:
          CONFIG && CONFIG.map && CONFIG.map.maxZoom ? CONFIG.map.maxZoom : 19,
        minZoom:
          CONFIG && CONFIG.map && CONFIG.map.minZoom ? CONFIG.map.minZoom : 2,
        zoomControl: false,
      });

      // Add base tile layer
      L.tileLayer(
        CONFIG && CONFIG.map && CONFIG.map.tileProvider
          ? CONFIG.map.tileProvider
          : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            CONFIG && CONFIG.map && CONFIG.map.tileAttribution
              ? CONFIG.map.tileAttribution
              : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | OSRM Inspector',
        }
      ).addTo(window.map);

      // Initialize map layers
      window.mapLayers = {
        route: L.layerGroup().addTo(window.map),
        waypoints: L.layerGroup().addTo(window.map),
        routeSegments: L.layerGroup().addTo(window.map),
        debug: {
          nodes: L.layerGroup().addTo(window.map),
          edges: L.layerGroup().addTo(window.map),
          cells: L.layerGroup().addTo(window.map),
          turns: L.layerGroup().addTo(window.map),
          speed: L.layerGroup().addTo(window.map),
          names: L.layerGroup().addTo(window.map),
        },
      };

      // Initialize waypointMarkers
      window.waypointMarkers = {
        start: null,
        end: null,
        via: [],
      };

      // Initialize route arrays
      window.routeLines = [];
      window.routeSegments = [];

      console.log("Map initialized properly");

      // Return the map
      return window.map;
    } catch (error) {
      console.error("Error in fixed map initialization:", error);

      // If original initMap exists, try to call it as fallback
      if (
        window.originalInitMap &&
        typeof window.originalInitMap === "function"
      ) {
        console.log("Trying original map initialization as fallback");
        return window.originalInitMap();
      }

      return null;
    }
  };

  // Make sure our map override is registered early
  console.log("Map initialization function overridden");

  // Add pre-binding for numbered markers to avoid the error
  if (typeof initNumberedMarkers !== "function") {
    window.initNumberedMarkers = function () {
      console.log("Pre-init numbered markers placeholder called");

      // Wait for actual map to exist
      if (!window.map || typeof window.map.on !== "function") {
        console.log(
          "Map not ready for numbered markers, adding default handler"
        );

        // We'll add a proper handler later when map is ready
        return true;
      }

      // Clear any existing markers
      if (window.numberedMarkers && window.numberedMarkers.length > 0) {
        window.numberedMarkers.forEach((marker) => {
          if (window.map) {
            window.map.removeLayer(marker);
          }
        });
        window.numberedMarkers = [];
      }

      // Initialize numbered markers array
      if (!window.numberedMarkers) {
        window.numberedMarkers = [];
      }

      // Add map click handler
      console.log("Adding map click handler for numbered markers");
      window.map.on("click", function (e) {
        console.log("Map clicked, using numbered marker handler");

        // Check if we have a better addNumberedMarker function
        if (typeof window.addNumberedMarker === "function") {
          window.addNumberedMarker(e.latlng);
        } else {
          // Simple click handler
          handleSimpleMapClick(e);
        }
      });

      console.log("Numbered markers initialized");
      return true;
    };
  }

  // Simple map click handler
  function handleSimpleMapClick(e) {
    const latlng = e.latlng;
    const coordString = `${latlng.lng.toFixed(6)},${latlng.lat.toFixed(6)}`;

    // Find which input to fill
    const startInput = document.getElementById("start-point");
    const endInput = document.getElementById("end-point");

    if (!startInput.value) {
      startInput.value = coordString;
    } else if (!endInput.value) {
      endInput.value = coordString;
    } else {
      // Try to add via point
      if (typeof window.addNewWaypoint === "function") {
        const waypoint = window.addNewWaypoint();
        if (waypoint) {
          const input = waypoint.querySelector(".waypoint-input");
          if (input) {
            input.value = coordString;
          }
        }
      }
    }

    // Update waypoints list if function available
    if (typeof window.updateWaypointsList === "function") {
      window.updateWaypointsList();
    }
  }

  // Ensure this runs immediately
  console.log("Pre-init fix applied");

  // Override the displayRoute function to ensure it works with our map
  window.originalDisplayRoute = window.displayRoute;
  window.displayRoute = function (routeData, profile = "driving") {
    console.log("Using fixed displayRoute function");

    // Clear any existing routes
    if (window.mapLayers && window.mapLayers.route) {
      window.mapLayers.route.clearLayers();
    }

    if (window.mapLayers && window.mapLayers.routeSegments) {
      window.mapLayers.routeSegments.clearLayers();
    }

    // Reset route arrays
    window.routeLines = [];
    window.routeSegments = [];

    // Check for valid route data
    if (!routeData || !routeData.routes || routeData.routes.length === 0) {
      console.warn("No valid route data to display");
      return null;
    }

    try {
      const route = routeData.routes[0];

      // Make sure we have a valid map and layers
      if (!window.map || !window.mapLayers || !window.mapLayers.route) {
        console.error("Map or layers not properly initialized");
        // Try to call original function as fallback
        if (
          window.originalDisplayRoute &&
          typeof window.originalDisplayRoute === "function"
        ) {
          return window.originalDisplayRoute(routeData, profile);
        }
        return null;
      }

      // Create route line
      const routeLine = L.geoJSON(route.geometry, {
        style: {
          color: getRouteColor(profile),
          weight: 6,
          opacity: 0.8,
          lineJoin: "round",
          lineCap: "round",
        },
      });

      // Add to map
      window.mapLayers.route.addLayer(routeLine);
      window.routeLines.push(routeLine);

      // Zoom to fit route bounds
      window.map.fitBounds(routeLine.getBounds(), {
        padding: [50, 50],
      });

      return routeLine;
    } catch (error) {
      console.error("Error displaying route:", error);
      return null;
    }
  };

  // Helper to get route color
  function getRouteColor(profile) {
    const defaultColors = {
      driving: "#3498db",
      walking: "#2ecc71",
      cycling: "#9b59b6",
      van_scpa: "#e67e22",
      van_2022: "#16a085",
    };

    // Use CONFIG colors if available
    if (
      CONFIG &&
      CONFIG.routing &&
      CONFIG.routing.colors &&
      CONFIG.routing.colors[profile]
    ) {
      return CONFIG.routing.colors[profile];
    }

    return defaultColors[profile] || "#3498db";
  }
})();
