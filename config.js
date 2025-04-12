/**
 * Konfigurasi untuk OSRM Inspector
 */
const CONFIG = {
  // Backend API URL
  osrmBackendUrl: "/api",

  // Default Map Settings
  map: {
    center: [-6.2, 106.8], // Jakarta sebagai default
    zoom: 12,
    maxZoom: 19,
    minZoom: 2,
  },

  // Routing Options
  routing: {
    // Colors per profile
    colors: {
      driving: "#3498db",
      walking: "#2ecc71",
      cycling: "#9b59b6",
    },

    lineWeight: 6,
    lineOpacity: 0.75,
    highlightOpacity: 0.9,
  },

  // Debug Visualization
  debug: {
    // Node options
    nodes: {
      color: "#e84393",
      radius: 4,
      fillOpacity: 0.8,
      weight: 1,
    },

    // Edge options
    edges: {
      color: "#00b894",
      weight: 3,
      opacity: 0.7,
    },

    // Cell options
    cells: {
      color: "#fdcb6e",
      fillOpacity: 0.2,
      weight: 1,
      opacity: 0.7,
    },

    // Turn options
    turns: {
      color: "#e17055",
      iconSize: [20, 20],
    },

    // Speed options
    speed: {
      color: "#00cec9",
      fontSize: 10,
    },

    // Road names options
    names: {
      color: "#6c5ce7",
      fontSize: 10,
    },

    // Limit how many debug items to show at once
    maxNodes: 1000,
    maxEdges: 500,
    maxCells: 100,
  },
};
