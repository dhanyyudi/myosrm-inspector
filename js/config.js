/**
 * Configuration untuk OSRM Inspector
 * Berisi pengaturan global untuk semua komponen aplikasi
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
    tileProvider: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    tileAttribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | OSRM Inspector',
  },

  // Routing Options
  routing: {
    // Colors per profile
    colors: {
      driving: "#3498db",
      walking: "#2ecc71",
      cycling: "#9b59b6",
      // Tambahan untuk profil kustom
      van_scpa: "#e67e22",
      van_2022: "#16a085",
    },

    // Default line styles
    lineWeight: 6,
    lineOpacity: 0.8,
    highlightOpacity: 0.9,

    // Default routing parameters
    defaultAlgorithm: "mld",
    defaultProfile: "driving",
    enableAutoRouting: true,

    // Segment colors for multi-color routes
    segmentColors: [
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
    ],
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

  // URL Options
  urls: {
    // Maximum URL length for copy/paste
    maxUrlLength: 2048,

    // Enable URL shortening (if available)
    enableUrlShortening: false,

    // URL shortening service (if enabled)
    urlShorteningService: "/api/shorten",
  },

  // CSV Import Settings
  import: {
    // Maximum file size in bytes
    maxFileSize: 1024 * 1024, // 1MB

    // Default coordinate format
    defaultFormat: "auto", // 'auto', 'latlon', or 'lonlat'

    // Maximum number of waypoints to import
    maxWaypoints: 100,
  },

  // Application Settings
  app: {
    // Application name
    name: "OSRM Inspector",

    // Application version
    version: "2.0.0",

    // Auto-save state in localStorage
    enableAutoSave: true,

    // Auto-save interval in milliseconds
    autoSaveInterval: 30000, // 30 seconds

    // Debug mode
    debugMode: false,
  },
};
