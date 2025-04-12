/**
 * Module visualisasi debug dan analisis data OSRM
 * Menangani fitur-fitur visualisasi debug untuk analisis rute
 */

// Status visualisasi debug
let debugStatus = {
  nodes: false,
  edges: false,
  cells: false,
  turns: false,
  speed: false,
  names: false,
};

/**
 * Inisialisasi fungsi debugging
 */
function initDebugTools() {
  // Setup event listener untuk button debug nodes
  document
    .getElementById("btn-show-nodes")
    .addEventListener("click", () => toggleDebugNodes());

  // Setup event listener untuk button debug edges
  document
    .getElementById("btn-show-edges")
    .addEventListener("click", () => toggleDebugEdges());

  // Setup event listener untuk button debug cells
  document
    .getElementById("btn-show-cells")
    .addEventListener("click", () => toggleDebugCells());

  // Setup event listener untuk button debug turns
  document
    .getElementById("btn-show-turns")
    .addEventListener("click", () => toggleDebugTurns());

  // Setup event listener untuk button debug speed
  document
    .getElementById("btn-show-speed")
    .addEventListener("click", () => toggleDebugSpeed());

  // Setup event listener untuk button debug names
  document
    .getElementById("btn-show-names")
    .addEventListener("click", () => toggleDebugNames());

  // Setup event listener untuk button clear debug
  document
    .getElementById("btn-clear-debug")
    .addEventListener("click", clearAllDebugVisualization);

  console.log("Debug tools initialized");
}

/**
 * Toggle visualisasi debug nodes
 */
async function toggleDebugNodes() {
  debugStatus.nodes = !debugStatus.nodes;

  // Toggle button class
  toggleDebugButton("btn-show-nodes", debugStatus.nodes);

  // Clear layer jika status false
  if (!debugStatus.nodes) {
    clearDebugLayer("nodes");
    return;
  }

  // Tampilkan nodes jika status true
  FormatUtils.showLoading();

  try {
    // Fetch nearest nodes dari titik awal dan akhir
    const startPoint = document.getElementById("start-point").value;
    const endPoint = document.getElementById("end-point").value;

    if (!startPoint && !endPoint) {
      // Jika tidak ada titik, ambil nodes di viewport saat ini
      const bounds = map.getBounds();
      const center = map.getCenter();
      const radius = getApproximateRadiusInMeters(bounds);

      await fetchAndDisplayNearestNodes(
        FormatUtils.formatCoordinateString([center.lng, center.lat]),
        radius
      );
    } else {
      // Ambil nodes di sekitar titik awal dan akhir
      if (startPoint) {
        await fetchAndDisplayNearestNodes(startPoint, 1000);
      }

      if (endPoint) {
        await fetchAndDisplayNearestNodes(endPoint, 1000);
      }
    }
  } catch (error) {
    console.error("Error fetching nodes:", error);
    simulateDebugNodes();
  } finally {
    FormatUtils.hideLoading();
  }
}

/**
 * Toggle visualisasi debug edges
 */
async function toggleDebugEdges() {
  debugStatus.edges = !debugStatus.edges;

  // Toggle button class
  toggleDebugButton("btn-show-edges", debugStatus.edges);

  // Clear layer jika status false
  if (!debugStatus.edges) {
    clearDebugLayer("edges");
    return;
  }

  // Tampilkan edges jika status true
  FormatUtils.showLoading();

  try {
    // Ambil edges dari rute saat ini jika ada
    const routeData = getCurrentRouteData();

    if (routeData && routeData.routes && routeData.routes.length > 0) {
      // Ekstrak edges dari rute
      await extractAndDisplayRouteEdges(routeData.routes[0]);
    } else {
      // Simulasi edges di area viewport
      simulateDebugEdges();
    }
  } catch (error) {
    console.error("Error displaying edges:", error);
    simulateDebugEdges();
  } finally {
    FormatUtils.hideLoading();
  }
}

/**
 * Toggle visualisasi debug cells
 */
async function toggleDebugCells() {
  debugStatus.cells = !debugStatus.cells;

  // Toggle button class
  toggleDebugButton("btn-show-cells", debugStatus.cells);

  // Clear layer jika status false
  if (!debugStatus.cells) {
    clearDebugLayer("cells");
    return;
  }

  // Tampilkan cells jika status true
  FormatUtils.showLoading();

  try {
    // Simulasi cells di area viewport
    simulateDebugCells();
  } catch (error) {
    console.error("Error displaying cells:", error);
  } finally {
    FormatUtils.hideLoading();
  }
}

/**
 * Toggle visualisasi debug belokan
 */
function toggleDebugTurns() {
  debugStatus.turns = !debugStatus.turns;

  // Toggle button class
  toggleDebugButton("btn-show-turns", debugStatus.turns);

  // Clear layer jika status false
  if (!debugStatus.turns) {
    clearDebugLayer("turns");
    return;
  }

  // Tampilkan belokan jika status true dan ada rute
  const routeData = getCurrentRouteData();

  if (routeData && routeData.routes && routeData.routes.length > 0) {
    addDebugTurns(routeData.routes[0]);
  } else {
    showNotification(
      "warning",
      "Tidak ada rute yang ditampilkan. Silakan cari rute terlebih dahulu."
    );
    debugStatus.turns = false;
    toggleDebugButton("btn-show-turns", false);
  }
}

/**
 * Improved toggle speed visualization function with better error handling
 */
function toggleDebugSpeed() {
  debugStatus.speed = !debugStatus.speed;

  // Toggle button class
  toggleDebugButton("btn-show-speed", debugStatus.speed);

  // Clear layer if status is false
  if (!debugStatus.speed) {
    clearDebugLayer("speed");
    return;
  }

  // Show loading indicator
  FormatUtils.showLoading();

  try {
    // Get current route data
    const routeData = getCurrentRouteData();

    if (routeData && routeData.routes && routeData.routes.length > 0) {
      console.log("Toggling speed visualization ON");

      // Make sure we clear the layer first
      clearDebugLayer("speed");

      // Check if the route has the necessary data for speed visualization
      const route = routeData.routes[0];

      // Safe check for legs
      if (!route.legs || route.legs.length === 0) {
        console.warn("Route has no legs, cannot visualize speed");
        showNotification(
          "warning",
          "Cannot visualize speed: route has no leg data."
        );
        debugStatus.speed = false;
        toggleDebugButton("btn-show-speed", false);
        FormatUtils.hideLoading();
        return;
      }

      // Display speed visualization with improved error handling
      try {
        addDebugSpeed(route);
      } catch (speedError) {
        console.error("Error in speed visualization:", speedError);
        showNotification(
          "error",
          "Error displaying speed visualization. See console for details."
        );
        debugStatus.speed = false;
        toggleDebugButton("btn-show-speed", false);
      }
    } else {
      showNotification(
        "warning",
        "No route is displayed. Please search for a route first."
      );
      debugStatus.speed = false;
      toggleDebugButton("btn-show-speed", false);
    }
  } catch (error) {
    console.error("Error displaying speed:", error);
    showNotification(
      "error",
      "Error displaying speed visualization. See console for details."
    );
    debugStatus.speed = false;
    toggleDebugButton("btn-show-speed", false);
  } finally {
    FormatUtils.hideLoading();
  }
}

/**
 * Toggle visualisasi debug nama jalan
 */
function toggleDebugNames() {
  debugStatus.names = !debugStatus.names;

  // Toggle button class
  toggleDebugButton("btn-show-names", debugStatus.names);

  // Clear layer jika status false
  if (!debugStatus.names) {
    clearDebugLayer("names");
    return;
  }

  // Tampilkan nama jalan jika status true dan ada rute
  const routeData = getCurrentRouteData();

  if (routeData && routeData.routes && routeData.routes.length > 0) {
    addDebugNames(routeData.routes[0]);
  } else {
    showNotification(
      "warning",
      "Tidak ada rute yang ditampilkan. Silakan cari rute terlebih dahulu."
    );
    debugStatus.names = false;
    toggleDebugButton("btn-show-names", false);
  }
}

/**
 * Menampilkan notifikasi kepada pengguna
 */
function showNotification(type, message, duration = 3000) {
  // Remove any existing notifications
  const existingNotifications = document.querySelectorAll(".notification");
  existingNotifications.forEach((notif) => {
    document.body.removeChild(notif);
  });

  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;

  // Add appropriate icon
  let icon = "info-circle";
  if (type === "warning") icon = "exclamation-triangle";
  if (type === "error") icon = "exclamation-circle";
  if (type === "success") icon = "check-circle";

  notification.innerHTML = `
    <i class="fa fa-${icon}"></i>
    <span>${message}</span>
  `;

  // Style the notification
  Object.assign(notification.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    zIndex: "9999",
    padding: "12px 20px",
    borderRadius: "4px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontWeight: "500",
    minWidth: "250px",
    maxWidth: "400px",
    animation: "fadeIn 0.3s forwards",
  });

  // Set colors based on type
  if (type === "warning") {
    Object.assign(notification.style, {
      backgroundColor: "#fff9e6",
      color: "#f39c12",
      borderLeft: "4px solid #f39c12",
    });
  } else if (type === "error") {
    Object.assign(notification.style, {
      backgroundColor: "#fee",
      color: "#e74c3c",
      borderLeft: "4px solid #e74c3c",
    });
  } else if (type === "success") {
    Object.assign(notification.style, {
      backgroundColor: "#efffef",
      color: "#2ecc71",
      borderLeft: "4px solid #2ecc71",
    });
  } else {
    Object.assign(notification.style, {
      backgroundColor: "#e6f7ff",
      color: "#3498db",
      borderLeft: "4px solid #3498db",
    });
  }

  // Add to document
  document.body.appendChild(notification);

  // Create keyframe animation
  const style = document.createElement("style");
  style.innerHTML = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeOut {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(20px); }
    }
  `;
  document.head.appendChild(style);

  // Remove after duration
  setTimeout(() => {
    notification.style.animation = "fadeOut 0.3s forwards";
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, duration);
}

/**
 * Toggle class active pada button debug
 */
function toggleDebugButton(buttonId, isActive) {
  const button = document.getElementById(buttonId);

  if (isActive) {
    button.classList.add("active");
  } else {
    button.classList.remove("active");
  }
}

/**
 * Bersihkan semua visualisasi debug
 */
function clearAllDebugVisualization() {
  // Reset semua status
  Object.keys(debugStatus).forEach((key) => {
    debugStatus[key] = false;
    toggleDebugButton(`btn-show-${key}`, false);
  });

  // Clear semua layer
  clearAllDebugLayers();

  // Notify user
  showNotification("success", "All debug visualizations cleared", 2000);
}

/**
 * Fetch dan tampilkan node terdekat dari koordinat
 */
async function fetchAndDisplayNearestNodes(coordinateString, radius = 1000) {
  try {
    // Fetch nearest nodes dari OSRM API
    const response = await fetch(
      `${CONFIG.osrmBackendUrl}/nearest/v1/driving/${coordinateString}?number=50`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== "Ok" || !data.waypoints) {
      throw new Error("Tidak dapat menemukan nodes terdekat");
    }

    // Konversi waypoints ke format nodes
    const nodes = data.waypoints.map((waypoint) => ({
      coordinates: waypoint.location,
      id: waypoint.name || "Unknown",
    }));

    // Tambahkan nodes ke visualisasi
    addDebugNodes(nodes);
  } catch (error) {
    console.error("Error fetching nearest nodes:", error);
    // Jika gagal, tampilkan simulasi nodes
    simulateDebugNodes();
  }
}

/**
 * Ekstrak dan tampilkan edges dari rute
 */
async function extractAndDisplayRouteEdges(route) {
  if (!route || !route.legs) {
    simulateDebugEdges();
    return;
  }

  const edges = [];

  route.legs.forEach((leg) => {
    if (!leg.steps) return;

    leg.steps.forEach((step) => {
      if (!step.geometry) return;

      edges.push({
        geometry: step.geometry,
        id: step.name || "Unknown",
        weight: step.duration,
      });
    });
  });

  addDebugEdges(edges);
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

    const marker = L.circleMarker(
      FormatUtils.toLeafletCoordinates(node.coordinates),
      {
        radius: CONFIG.debug.nodes.radius,
        color: CONFIG.debug.nodes.color,
        fillColor: CONFIG.debug.nodes.color,
        fillOpacity: CONFIG.debug.nodes.fillOpacity,
        weight: CONFIG.debug.nodes.weight,
      }
    );

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
        html: `<i class="fa fa-${FormatUtils.getTurnIcon(modifier)}"></i>`,
        iconSize: CONFIG.debug.turns.iconSize,
      });

      const marker = L.marker(FormatUtils.toLeafletCoordinates(location), {
        icon: turnIcon,
      });

      // Add tooltip with turn description
      marker.bindTooltip(
        FormatUtils.getReadableInstruction({
          type: turnType,
          modifier: modifier,
        }),
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

          const marker = L.marker(FormatUtils.toLeafletCoordinates(midpoint), {
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

            const marker = L.marker(FormatUtils.toLeafletCoordinates(point), {
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

          const marker = L.marker(FormatUtils.toLeafletCoordinates(point), {
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

      const marker = L.marker(
        FormatUtils.toLeafletCoordinates(coordinates[midIndex]),
        {
          icon: nameIcon,
        }
      );

      mapLayers.debug.names.addLayer(marker);
    });
  });
}

/**
 * Simulasi nodes untuk debug jika API tidak tersedia
 */
function simulateDebugNodes() {
  const bounds = map.getBounds();
  const nodes = [];

  // Generate random nodes within viewport
  for (let i = 0; i < 50; i++) {
    const lat =
      bounds.getSouth() +
      Math.random() * (bounds.getNorth() - bounds.getSouth());
    const lng =
      bounds.getWest() + Math.random() * (bounds.getEast() - bounds.getWest());

    nodes.push({
      coordinates: [lng, lat],
      id: `Node-${i}`,
    });
  }

  addDebugNodes(nodes);
}

/**
 * Simulasi edges untuk debug jika API tidak tersedia
 */
function simulateDebugEdges() {
  const bounds = map.getBounds();
  const edges = [];

  // Generate random edges within viewport
  for (let i = 0; i < 30; i++) {
    const startLat =
      bounds.getSouth() +
      Math.random() * (bounds.getNorth() - bounds.getSouth());
    const startLng =
      bounds.getWest() + Math.random() * (bounds.getEast() - bounds.getWest());

    const endLat = startLat + (Math.random() - 0.5) * 0.01;
    const endLng = startLng + (Math.random() - 0.5) * 0.01;

    const edge = {
      geometry: {
        type: "LineString",
        coordinates: [
          [startLng, startLat],
          [endLng, endLat],
        ],
      },
      id: `Edge-${i}`,
      weight: Math.floor(Math.random() * 100),
    };

    edges.push(edge);
  }

  addDebugEdges(edges);
}

/**
 * Simulasi cells untuk debug
 */
function simulateDebugCells() {
  const bounds = map.getBounds();
  const cells = [];

  // Generate grid cells
  const gridSize = 5;
  const latStep = (bounds.getNorth() - bounds.getSouth()) / gridSize;
  const lngStep = (bounds.getEast() - bounds.getWest()) / gridSize;

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const south = bounds.getSouth() + i * latStep;
      const north = bounds.getSouth() + (i + 1) * latStep;
      const west = bounds.getWest() + j * lngStep;
      const east = bounds.getWest() + (j + 1) * lngStep;

      const cell = {
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [west, south],
              [east, south],
              [east, north],
              [west, north],
              [west, south],
            ],
          ],
        },
        id: `Cell-${i}-${j}`,
        level: Math.floor(Math.random() * 3) + 1,
      };

      cells.push(cell);
    }
  }

  addDebugCells(cells);
}

/**
 * Get approximate radius in meters from map bounds
 */
function getApproximateRadiusInMeters(bounds) {
  const center = bounds.getCenter();
  const northEast = bounds.getNorthEast();

  // Approximate calculation based on Haversine formula
  const lat1 = (center.lat * Math.PI) / 180;
  const lon1 = (center.lng * Math.PI) / 180;
  const lat2 = (northEast.lat * Math.PI) / 180;
  const lon2 = (northEast.lng * Math.PI) / 180;

  const R = 6371000; // Earth's radius in meters
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}
