/**
 * Module for map management and visual layers
 */

// Global variables for map
let map;
let mapLayers = {
  route: new L.LayerGroup(),
  waypoints: new L.LayerGroup(),
  debug: {
    nodes: new L.LayerGroup(),
    edges: new L.LayerGroup(),
    cells: new L.LayerGroup(),
    turns: new L.LayerGroup(),
    speed: new L.LayerGroup(),
    names: new L.LayerGroup(),
  },
};

// Layer markers for start and end
let markerStart = null;
let markerEnd = null;

// Layer for route
let routeLines = [];

/**
 * Initialize map
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
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | OSRM Inspector',
  }).addTo(map);

  // Add all layers to map
  mapLayers.route.addTo(map);
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
  const displayFormat = `Lat: ${formatCoordinate(lat)}, Lng: ${formatCoordinate(
    lng
  )}`;
  const coordElement = document.getElementById("coordinates-display");
  coordElement.textContent = displayFormat;
}

/**
 * Handle click on map to determine start or end point
 */
function handleMapClick(e) {
  const latlng = e.latlng;
  const osrmFormat = [latlng.lng, latlng.lat]; // OSRM format [lng, lat]
  const coordString = formatCoordinateString(osrmFormat);

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
 * Add marker for start point
 */
function addStartMarker(latlng) {
  // Remove old marker if exists
  if (markerStart) {
    mapLayers.waypoints.removeLayer(markerStart);
  }

  // Create new marker with custom icon
  markerStart = L.marker(latlng, {
    icon: L.divIcon({
      className: "custom-div-icon start-icon",
      html: `<div style="background-color:${CONFIG.routing.colors.driving}; width:12px; height:12px; border-radius:50%; border: 2px solid white;"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    }),
  });

  // Add marker to layer
  mapLayers.waypoints.addLayer(markerStart);
}

/**
 * Add marker for end point
 */
function addEndMarker(latlng) {
  // Remove old marker if exists
  if (markerEnd) {
    mapLayers.waypoints.removeLayer(markerEnd);
  }

  // Create new marker with custom icon
  markerEnd = L.marker(latlng, {
    icon: L.divIcon({
      className: "custom-div-icon end-icon",
      html: `<div style="background-color:#e74c3c; width:12px; height:12px; border-radius:50%; border: 2px solid white;"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    }),
  });

  // Add marker to layer
  mapLayers.waypoints.addLayer(markerEnd);
}

/**
 * Add a marker for via points
 */
function addViaMarker(latlng, inputId) {
  // Extract index from input ID (like "via-point-1")
  const index = inputId.split("-").pop();

  // Create a unique marker ID
  const markerId = `via-marker-${index}`;

  // Check if a marker with this ID already exists in the layer
  let existingMarker = null;
  mapLayers.waypoints.eachLayer(function (layer) {
    if (layer.options && layer.options.markerId === markerId) {
      existingMarker = layer;
    }
  });

  // Remove existing marker if found
  if (existingMarker) {
    mapLayers.waypoints.removeLayer(existingMarker);
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
  });

  // Add to waypoints layer
  mapLayers.waypoints.addLayer(viaMarker);

  console.log(
    `Added via marker ${markerId} at coordinates: ${latlng.lat},${latlng.lng}`
  );
}

/**
 * Display route on map
 */
function displayRoute(routeData, profile = "driving") {
  clearRoute();

  if (!routeData || !routeData.routes || routeData.routes.length === 0) return;

  const route = routeData.routes[0];
  const geometry = route.geometry;

  // Get color based on profile
  const color = CONFIG.routing.colors[profile] || CONFIG.routing.colors.driving;

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

  // Add hover highlight if there are steps
  if (route.legs && route.legs.length > 0) {
    route.legs.forEach((leg) => {
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

            mapLayers.route.addLayer(stepLine);
            routeLines.push(stepLine);
          }
        });
      }
    });
  }

  return routeLine;
}

/**
 * Clear all routes from map
 */
function clearRoute() {
  routeLines.forEach((line) => {
    mapLayers.route.removeLayer(line);
  });
  routeLines = [];
}

/**
 * Clear all waypoint markers
 */
function clearWaypoints() {
  mapLayers.waypoints.clearLayers();
  markerStart = null;
  markerEnd = null;
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

/**
 * Add nodes visualization for debug
 */
function addDebugNodes(nodes) {
  clearDebugLayer("nodes");

  if (!nodes || !Array.isArray(nodes)) return;

  // Limit number of nodes displayed
  const limit = Math.min(nodes.length, CONFIG.debug.maxNodes);

  for (let i = 0; i < limit; i++) {
    const node = nodes[i];

    if (!node || !node.coordinates) continue;

    const marker = L.circleMarker(toLeafletCoordinates(node.coordinates), {
      radius: CONFIG.debug.nodes.radius,
      color: CONFIG.debug.nodes.color,
      fillColor: CONFIG.debug.nodes.color,
      fillOpacity: CONFIG.debug.nodes.fillOpacity,
      weight: CONFIG.debug.nodes.weight,
    });

    // Add popup with information
    if (node.id) {
      marker.bindTooltip(`Node ID: ${node.id}`, {
        permanent: false,
        direction: "top",
      });
    }

    mapLayers.debug.nodes.addLayer(marker);
  }
}

/**
 * Add edges visualization for debug
 */
function addDebugEdges(edges) {
  clearDebugLayer("edges");

  if (!edges || !Array.isArray(edges)) return;

  // Limit number of edges displayed
  const limit = Math.min(edges.length, CONFIG.debug.maxEdges);

  for (let i = 0; i < limit; i++) {
    const edge = edges[i];

    if (!edge || !edge.geometry) continue;

    const line = L.geoJSON(edge.geometry, {
      style: {
        color: CONFIG.debug.edges.color,
        weight: CONFIG.debug.edges.weight,
        opacity: CONFIG.debug.edges.opacity,
      },
    });

    // Add popup with information
    if (edge.id || edge.weight) {
      line.bindTooltip(
        `Edge ID: ${edge.id || "N/A"}, Weight: ${edge.weight || "N/A"}`,
        {
          permanent: false,
          direction: "top",
        }
      );
    }

    mapLayers.debug.edges.addLayer(line);
  }
}

/**
 * Add cells visualization for debug
 */
function addDebugCells(cells) {
  clearDebugLayer("cells");

  if (!cells || !Array.isArray(cells)) return;

  // Limit number of cells displayed
  const limit = Math.min(cells.length, CONFIG.debug.maxCells);

  for (let i = 0; i < limit; i++) {
    const cell = cells[i];

    if (!cell || !cell.geometry) continue;

    const polygon = L.geoJSON(cell.geometry, {
      style: {
        color: CONFIG.debug.cells.color,
        fillColor: CONFIG.debug.cells.color,
        fillOpacity: CONFIG.debug.cells.fillOpacity,
        weight: CONFIG.debug.cells.weight,
        opacity: CONFIG.debug.cells.opacity,
      },
    });

    // Add popup with information
    if (cell.id || cell.level) {
      polygon.bindTooltip(
        `Cell ID: ${cell.id || "N/A"}, Level: ${cell.level || "N/A"}`,
        {
          permanent: false,
          direction: "top",
        }
      );
    }

    mapLayers.debug.cells.addLayer(polygon);
  }
}

/**
 * Display turn instructions on map
 */
function addDebugTurns(route) {
  clearDebugLayer("turns");

  if (!route || !route.legs) return;

  route.legs.forEach((leg) => {
    if (!leg.steps) return;

    leg.steps.forEach((step) => {
      if (!step.maneuver || !step.maneuver.location) return;

      const location = step.maneuver.location;
      const turnType = step.maneuver.type;
      const modifier = step.maneuver.modifier || "";

      // Create turn icon
      const turnIcon = L.divIcon({
        className: "turn-icon",
        html: `<i class="fa fa-${getTurnIcon(modifier)}"></i>`,
        iconSize: CONFIG.debug.turns.iconSize,
      });

      const marker = L.marker(toLeafletCoordinates(location), {
        icon: turnIcon,
      });

      // Add tooltip with turn description
      marker.bindTooltip(
        getReadableInstruction({ type: turnType, modifier: modifier }),
        {
          permanent: false,
          direction: "top",
        }
      );

      mapLayers.debug.turns.addLayer(marker);
    });
  });
}

/**
 * Enhanced speed visualization function with minimal styling
 */
function addDebugSpeed(route) {
  clearDebugLayer("speed");

  if (!route || !route.legs) {
    console.log("No route data for speed visualization");
    return;
  }

  console.log("Processing route for speed visualization");

  // Flag to track if we've successfully displayed any speed data
  let hasDisplayedSpeed = false;

  try {
    // Processing approach 1: Use speed annotations if available
    route.legs.forEach((leg, legIndex) => {
      if (
        leg.annotation &&
        leg.annotation.speed &&
        leg.annotation.speed.length > 0 &&
        leg.geometry &&
        leg.geometry.coordinates &&
        leg.geometry.coordinates.length > 0
      ) {
        console.log(`Found speed annotations in leg ${legIndex}`);

        // Get coordinates from geometry
        const coordinates = leg.geometry.coordinates;

        // Display speed for each segment (or every few segments to avoid crowding)
        for (
          let i = 0;
          i < Math.min(coordinates.length - 1, leg.annotation.speed.length);
          i++
        ) {
          // Display every 3rd point to avoid cluttering
          if (i % 3 !== 0) continue;

          const speed = leg.annotation.speed[i];
          if (speed === undefined || speed === null) continue;

          // Make sure we have valid coordinates for this point and the next
          if (!coordinates[i] || !coordinates[i + 1]) continue;

          // Calculate midpoint of segment for label placement
          const midpoint = [
            (coordinates[i][0] + coordinates[i + 1][0]) / 2,
            (coordinates[i][1] + coordinates[i + 1][1]) / 2,
          ];

          // Create a minimal speed label - just text with a white border/halo
          const speedIcon = L.divIcon({
            className: "speed-label-minimal",
            html: `<div style="color:black; font-weight:bold; font-size:11px; text-shadow: -1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white; white-space: nowrap;">${Math.round(
              speed
            )} km/h</div>`,
            iconSize: [60, 16],
            iconAnchor: [30, 8],
          });

          const marker = L.marker(toLeafletCoordinates(midpoint), {
            icon: speedIcon,
          });

          mapLayers.debug.speed.addLayer(marker);
          hasDisplayedSpeed = true;
        }
      }
    });
  } catch (err) {
    console.error("Error displaying speed annotations:", err);
  }

  // If no annotations were successfully displayed, use an alternative method based on step duration/distance
  if (!hasDisplayedSpeed) {
    try {
      console.log(
        "No speed annotations found or error occurred, using calculated speeds from steps"
      );

      route.legs.forEach((leg) => {
        if (!leg.steps) return;

        leg.steps.forEach((step, stepIndex) => {
          if (
            !step.geometry ||
            !step.geometry.coordinates ||
            !step.duration ||
            !step.distance
          )
            return;

          // Calculate average speed (m/s to km/h)
          const avgSpeed = (step.distance / step.duration) * 3.6;

          const coordinates = step.geometry.coordinates;
          if (coordinates.length < 2) return;

          // Place markers at reasonable intervals along the step
          const interval = Math.max(1, Math.floor(coordinates.length / 3));

          for (let i = interval; i < coordinates.length - 1; i += interval) {
            // Make sure this coordinate exists
            if (!coordinates[i]) continue;

            // Place marker at this coordinate
            const point = coordinates[i];

            // Create a minimal label for calculated speeds
            const speedIcon = L.divIcon({
              className: "speed-label-minimal calculated",
              html: `<div style="color:black; font-weight:bold; font-size:11px; text-shadow: -1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white; white-space: nowrap;">${Math.round(
                avgSpeed
              )} km/h</div>`,
              iconSize: [60, 16],
              iconAnchor: [30, 8],
            });

            const marker = L.marker(toLeafletCoordinates(point), {
              icon: speedIcon,
            });

            mapLayers.debug.speed.addLayer(marker);
            hasDisplayedSpeed = true;
          }
        });
      });
    } catch (err) {
      console.error("Error displaying calculated speeds:", err);
    }
  }

  // If we still haven't displayed any speed, use a last resort method
  if (!hasDisplayedSpeed) {
    try {
      console.warn(
        "Could not visualize speeds using standard methods, using fallback approach"
      );

      // Fallback: Create evenly spaced markers along the route geometry with overall average speed
      if (
        route.geometry &&
        route.geometry.coordinates &&
        route.distance &&
        route.duration
      ) {
        const overallSpeed = (route.distance / route.duration) * 3.6;
        const coordinates = route.geometry.coordinates;

        // Place markers at regular intervals
        const interval = Math.max(1, Math.floor(coordinates.length / 10));

        for (let i = interval; i < coordinates.length - 1; i += interval) {
          if (!coordinates[i]) continue;

          const point = coordinates[i];

          const speedIcon = L.divIcon({
            className: "speed-label-minimal fallback",
            html: `<div style="color:black; font-weight:bold; font-size:11px; text-shadow: -1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white; white-space: nowrap;">~${Math.round(
              overallSpeed
            )} km/h</div>`,
            iconSize: [60, 16],
            iconAnchor: [30, 8],
          });

          const marker = L.marker(toLeafletCoordinates(point), {
            icon: speedIcon,
          });

          mapLayers.debug.speed.addLayer(marker);
          hasDisplayedSpeed = true;
        }
      }
    } catch (err) {
      console.error("Error in fallback speed visualization:", err);
    }
  }

  // If we still couldn't display any speed info, show a message
  if (!hasDisplayedSpeed) {
    // Create a centered message on the map
    const bounds = map.getBounds();
    const center = bounds.getCenter();

    const errorIcon = L.divIcon({
      className: "speed-error",
      html: `<div style="color:red; font-weight:bold; font-size:14px; text-shadow: -1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white;">No speed data available</div>`,
      iconSize: [200, 40],
      iconAnchor: [100, 20],
    });

    const marker = L.marker([center.lat, center.lng], {
      icon: errorIcon,
    });

    mapLayers.debug.speed.addLayer(marker);
    console.error("Failed to display any speed information");
  } else {
    console.log("Speed visualization complete");
  }
}

/**
 * Display road names along route
 */
function addDebugNames(route) {
  clearDebugLayer("names");

  if (!route || !route.legs) return;

  route.legs.forEach((leg) => {
    if (!leg.steps) return;

    leg.steps.forEach((step) => {
      if (!step.name || !step.geometry) return;

      // Skip if name is empty or "unknown"
      if (step.name === "" || step.name.toLowerCase() === "unknown") return;

      // Get midpoint of segment for label position
      const coordinates = step.geometry.coordinates;
      const midIndex = Math.floor(coordinates.length / 2);

      if (!coordinates[midIndex]) return;

      // Create road name label
      const nameIcon = L.divIcon({
        className: "name-label",
        html: step.name,
        iconSize: [120, 20],
        iconAnchor: [60, 10],
      });

      const marker = L.marker(toLeafletCoordinates(coordinates[midIndex]), {
        icon: nameIcon,
      });

      mapLayers.debug.names.addLayer(marker);
    });
  });
}
