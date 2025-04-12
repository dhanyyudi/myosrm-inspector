/**
 * Main application entry point for OSRM Inspector
 * Coordinates initialization of all components with deferred loading
 */

// Tunggu sampai semua JavaScript sudah di-load
window.addEventListener("load", function () {
  // Di sini kita yakin semua script sudah di-load
  startApplication();
});

/**
 * Start application after all resources are loaded
 */
function startApplication() {
  try {
    console.log("Starting OSRM Inspector application...");

    // Periksa ketersediaan komponen utama
    if (typeof initMap !== "function") {
      throw new Error("Required component 'initMap' is not available");
    }

    if (typeof initRouting !== "function") {
      throw new Error("Required component 'initRouting' is not available");
    }

    if (typeof initDebugTools !== "function") {
      throw new Error("Required component 'initDebugTools' is not available");
    }

    // Tambahan fitur
    if (typeof FormatUtils !== "object") {
      console.warn("FormatUtils not available, some features might not work");
    }

    // Tampilkan loading indicator
    if (FormatUtils && FormatUtils.showLoading) {
      FormatUtils.showLoading();
    }

    // Inisialisasi komponen dalam urutan yang benar
    initApp()
      .then(() => {
        console.log("OSRM Inspector loaded successfully");
        if (FormatUtils && FormatUtils.hideLoading) {
          FormatUtils.hideLoading();
        }
      })
      .catch((error) => {
        console.error("Error initializing application:", error);
        displayInitError(error);
        if (FormatUtils && FormatUtils.hideLoading) {
          FormatUtils.hideLoading();
        }
      });
  } catch (error) {
    console.error("Critical startup error:", error);
    displayInitError(error);
  }
}

/**
 * Main application initialization sequence
 */
async function initApp() {
  try {
    console.log("Initializing application components...");

    // Initialize the map first
    console.log("Initializing map...");
    const mapInstance = initMap();

    // Initialize routing features
    console.log("Initializing routing...");
    await initRouting();

    // Initialize debug tools
    console.log("Initializing debug tools...");
    initDebugTools();

    // Initialize new features
    if (typeof initWaypointHandler === "function") {
      console.log("Initializing waypoint handler...");
      initWaypointHandler();
    }

    if (typeof initUrlHandler === "function") {
      console.log("Initializing URL handler...");
      initUrlHandler();
    }

    // Verify all modifications have been applied
    console.log("Verifying enhancements...");
    verifyEnhancements();

    return true;
  } catch (error) {
    console.error("Initialization error:", error);
    throw error;
  }
}

/**
 * Verify enhancements have been successfully applied
 */
function verifyEnhancements() {
  console.log("Verifying OSRM Inspector enhancements:");

  // Check for enhanced features
  setTimeout(() => {
    try {
      // Check if map is available
      if (!map) {
        console.warn("⚠️ Map is not available!");
        return;
      }

      // Check for multi-color routing
      const routeSegments = mapLayers && mapLayers.routeSegments;
      console.log("Multi-color route segments:", routeSegments ? "✓" : "✗");

      // Check for draggable markers
      const markerStart = waypointMarkers && waypointMarkers.start;
      const draggable =
        markerStart && markerStart.options && markerStart.options.draggable;
      console.log("Draggable markers:", draggable ? "✓" : "✗");

      // Check for CURB parameter
      const curbToggle = document.getElementById("curb-toggle");
      console.log("CURB parameter support:", curbToggle ? "✓" : "✗");

      // Check for auto-routing
      const autoRouteToggle = document.getElementById("auto-route-toggle");
      console.log("Auto-routing support:", autoRouteToggle ? "✓" : "✗");

      // Check for waypoint count slider
      const waypointSlider = document.getElementById("waypoint-count");
      console.log("Waypoint count slider:", waypointSlider ? "✓" : "✗");

      // Check for URL functionality
      const copyUrlBtn = document.getElementById("btn-copy-url");
      console.log("URL copy/paste:", copyUrlBtn ? "✓" : "✗");

      // Log overall status
      const allFeaturesImplemented =
        routeSegments &&
        curbToggle &&
        autoRouteToggle &&
        copyUrlBtn &&
        waypointSlider;

      if (allFeaturesImplemented) {
        console.log("✓ All requested enhancements successfully implemented!");
      } else {
        console.warn("⚠️ Some enhancements may not be fully implemented.");
      }
    } catch (e) {
      console.error("Verification error:", e);
    }
  }, 1000);
}

/**
 * Display initialization error to the user
 */
function displayInitError(error) {
  // Create error message container
  const errorContainer = document.createElement("div");
  errorContainer.className = "error-message init-error";
  errorContainer.style.position = "fixed";
  errorContainer.style.top = "50%";
  errorContainer.style.left = "50%";
  errorContainer.style.transform = "translate(-50%, -50%)";
  errorContainer.style.zIndex = "3000";
  errorContainer.style.maxWidth = "80%";
  errorContainer.style.padding = "20px";

  // Add error details
  errorContainer.innerHTML = `
    <h3><i class="fa fa-exclamation-triangle"></i> Initialization Error</h3>
    <p>${
      error.message ||
      "An unknown error occurred while loading the application."
    }</p>
    <p>Please check the console for more details or try refreshing the page.</p>
    <button id="btn-dismiss-error" class="btn btn-primary">Dismiss</button>
  `;

  // Add to the document
  document.body.appendChild(errorContainer);

  // Add event listener to dismiss button
  document.getElementById("btn-dismiss-error").addEventListener("click", () => {
    document.body.removeChild(errorContainer);
  });
}

/**
 * Handle window resize events
 */
window.addEventListener("resize", function () {
  // Use debounce only if FormatUtils is available
  if (window.FormatUtils && window.FormatUtils.debounce) {
    const debouncedResize = FormatUtils.debounce(function () {
      // Check if map is defined before calling invalidateSize
      if (window.map && typeof window.map.invalidateSize === "function") {
        window.map.invalidateSize();
      }
    }, 100);

    debouncedResize();
  } else {
    // Simple fallback if FormatUtils is not available
    if (window.map && typeof window.map.invalidateSize === "function") {
      setTimeout(() => window.map.invalidateSize(), 100);
    }
  }
});
