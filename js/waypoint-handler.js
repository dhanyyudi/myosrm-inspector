/**
 * Waypoint handler for OSRM Inspector
 * Manages click events, waypoint placement, and coordinate handling
 */

// State for waypoint handling
window.waypointState = {
  maxWaypoints: 2, // Default to 2 waypoints (start and end)
  currentWaypointIndex: 0, // Which waypoint we're currently setting
  clickMode: "sequential", // 'sequential' or 'specific'
  waypoints: [], // Array to store waypoint data
};

/**
 * Initialize waypoint handler
 */
function initWaypointHandler() {
  console.log("Initializing waypoint handler...");

  try {
    // Add waypoint count slider
    addWaypointCountSlider();

    // Setup map click handler
    setupMapClickHandler();

    // Setup waypoint input focus events
    setupWaypointInputEvents();

    // Add CSV import functionality
    setupCsvImport();

    // Initialize numbered markers
    if (typeof initNumberedMarkers === "function") {
      initNumberedMarkers();
    }

    console.log("Waypoint handler initialized successfully");
    return true;
  } catch (error) {
    console.error("Error initializing waypoint handler:", error);
    throw new Error("Waypoint handler initialization failed: " + error.message);
  }
}

/**
 * Add waypoint count slider UI
 */
function addWaypointCountSlider() {
  // Create container for waypoint count slider
  const sliderContainer = document.createElement("div");
  sliderContainer.className = "form-group waypoint-count-slider";

  // Add HTML for slider
  sliderContainer.innerHTML = `
    <label for="waypoint-count">Waypoints Count: <span id="waypoint-count-value">2</span></label>
    <div class="slider-container">
      <input type="range" id="waypoint-count" min="2" max="10" value="2" class="form-control">
    </div>
    <small class="waypoint-mode">
      <input type="checkbox" id="specific-waypoint-mode">
      <label for="specific-waypoint-mode">Click to fill specific waypoint (otherwise sequential)</label>
    </small>
  `;

  // Find where to add the slider
  const routeOptions = document.querySelector(".route-options");
  if (routeOptions) {
    // Add at the top of route options
    routeOptions.insertBefore(sliderContainer, routeOptions.firstChild);

    // Setup slider event
    const slider = document.getElementById("waypoint-count");
    const countDisplay = document.getElementById("waypoint-count-value");

    if (slider && countDisplay) {
      slider.addEventListener("input", function () {
        const count = parseInt(this.value);
        countDisplay.textContent = count;
        window.waypointState.maxWaypoints = count;

        // Update UI to match waypoint count
        updateWaypointUI(count);
      });
    }

    // Setup click mode toggle
    const specificModeCheckbox = document.getElementById(
      "specific-waypoint-mode"
    );
    if (specificModeCheckbox) {
      specificModeCheckbox.addEventListener("change", function () {
        window.waypointState.clickMode = this.checked
          ? "specific"
          : "sequential";
      });
    }
  } else {
    console.warn(
      "Route options container not found, can't add waypoint slider"
    );
  }
}

/**
 * Update waypoint UI based on waypoint count
 * This implements the correct adding of new waypoints
 */
function updateWaypointUI(count) {
  // We always have start and end point
  const requiredViaPoints = Math.max(0, count - 2);

  // Get current via points
  const currentViaPoints = document.querySelectorAll(".waypoint.via").length;

  if (requiredViaPoints > currentViaPoints) {
    // Need to add more via points
    for (let i = 0; i < requiredViaPoints - currentViaPoints; i++) {
      addNewWaypointImplementation();
    }
  } else if (requiredViaPoints < currentViaPoints) {
    // Need to remove some via points
    const viaPoints = document.querySelectorAll(".waypoint.via");
    for (let i = currentViaPoints - 1; i >= requiredViaPoints; i--) {
      if (viaPoints[i]) {
        removeWaypointImplementation(viaPoints[i]);
      }
    }
  }

  // Reset current waypoint index if needed
  if (window.waypointState.currentWaypointIndex >= count) {
    window.waypointState.currentWaypointIndex = 0;
  }
}

/**
 * Implement addNewWaypoint function directly if it's not available
 */
function addNewWaypointImplementation() {
  // Check if external function is available
  if (typeof addNewWaypoint === "function") {
    return addNewWaypoint();
  }

  console.log("Using internal addNewWaypoint implementation");

  const waypointsContainer = document.querySelector(".waypoints-container");
  if (!waypointsContainer) {
    console.error("Waypoints container not found");
    return null;
  }

  const lastWaypoint = waypointsContainer.querySelector(".waypoint.end");
  if (!lastWaypoint) {
    console.error("End waypoint not found");
    return null;
  }

  // Create separator
  const separator = document.createElement("div");
  separator.className = "waypoint-separator";
  separator.innerHTML = '<i class="fa fa-ellipsis-v"></i>';

  // Determine the correct new index
  const viaCount = waypointsContainer.querySelectorAll(".waypoint.via").length;
  const newIndex = viaCount + 1;

  // Create new waypoint
  const newWaypoint = document.createElement("div");
  newWaypoint.className = "waypoint via";
  newWaypoint.innerHTML = `
    <div class="waypoint-icon"><i class="fa fa-map-pin"></i></div>
    <input type="text" id="via-point-${newIndex}" placeholder="Via Point ${newIndex}" class="waypoint-input">
    <div class="waypoint-actions">
      <button class="btn btn-icon btn-remove-waypoint">
        <i class="fa fa-times"></i>
      </button>
    </div>
  `;

  // Add event listener to remove button
  newWaypoint
    .querySelector(".btn-remove-waypoint")
    .addEventListener("click", function () {
      removeWaypointImplementation(this.closest(".waypoint"));
    });

  // Add focus/blur events to input for map selection
  const inputElement = newWaypoint.querySelector(".waypoint-input");
  inputElement.addEventListener("focus", function () {
    this.dataset.active = "true";
    console.log(`Via point ${newIndex} input active`);

    // Find index for sequential mode
    const allInputs = document.querySelectorAll(".waypoint-input");
    const index = Array.from(allInputs).indexOf(this);
    if (index !== -1) {
      window.waypointState.currentWaypointIndex = index;
    }
  });

  inputElement.addEventListener("blur", function () {
    this.dataset.active = "false";
  });

  // Insert before end waypoint
  waypointsContainer.insertBefore(separator, lastWaypoint);
  waypointsContainer.insertBefore(newWaypoint, lastWaypoint);

  console.log(`Added new waypoint via-point-${newIndex}`);

  // Update waypoints list
  if (typeof updateWaypointsList === "function") {
    updateWaypointsList();
  }

  return newWaypoint;
}

/**
 * Implement removeWaypoint function directly if it's not available
 */
function removeWaypointImplementation(waypointElement) {
  // Check if external function is available
  if (typeof removeWaypoint === "function") {
    return removeWaypoint(waypointElement);
  }

  console.log("Using internal removeWaypoint implementation");

  const container = waypointElement.parentNode;
  if (!container) return;

  const previousSeparator = waypointElement.previousElementSibling;

  // Get the ID of the waypoint to be removed
  const inputElement = waypointElement.querySelector(".waypoint-input");
  if (inputElement && inputElement.id) {
    const inputId = inputElement.id;

    // Remove the marker for this waypoint if numbered markers exist
    const inputIndex = parseInt(inputId.split("-").pop());
    if (!isNaN(inputIndex) && typeof clearNumberedMarkers === "function") {
      // Adjust for 0-based index vs 1-based marker numbers
      const markerNumber = inputIndex + 1;
      // Only remove specific marker if possible, otherwise clear all
      if (typeof window.numberedMarkers !== "undefined") {
        const marker = window.numberedMarkers.find(
          (m) => m.markerNumber === markerNumber
        );
        if (marker && window.map) {
          window.map.removeLayer(marker);
          window.numberedMarkers = window.numberedMarkers.filter(
            (m) => m !== marker
          );
        }
      }
    }
  }

  // Remove the waypoint and its separator
  container.removeChild(waypointElement);
  if (
    previousSeparator &&
    previousSeparator.className === "waypoint-separator"
  ) {
    container.removeChild(previousSeparator);
  }

  // Renumber the remaining via points
  renumberViaPoints();

  // Update waypoints list
  if (typeof updateWaypointsList === "function") {
    updateWaypointsList();
  }

  // If auto-routing is enabled, find new route
  if (
    document.getElementById("auto-route-toggle") &&
    document.getElementById("auto-route-toggle").checked &&
    typeof findRouteWithMultipleWaypoints === "function"
  ) {
    findRouteWithMultipleWaypoints();
  }
}

/**
 * Renumber via points after removal
 */
function renumberViaPoints() {
  const viaPoints = document.querySelectorAll(".waypoint.via");
  viaPoints.forEach((point, index) => {
    const input = point.querySelector(".waypoint-input");
    if (input) {
      input.id = `via-point-${index + 1}`;
      input.placeholder = `Via Point ${index + 1}`;
    }
  });
}

/**
 * Setup map click handler for waypoints
 */
function setupMapClickHandler() {
  if (window.map) {
    // We'll use the click handler from numbered-markers.js instead
    // for better visualization, so we don't need to add one here.
    console.log("Using numbered markers for map clicks");
  } else {
    console.warn("Map not initialized, can't setup click handler");
  }
}

/**
 * Setup waypoint input focus events
 */
function setupWaypointInputEvents() {
  // Initial setup for existing inputs
  const setupInput = (input) => {
    input.addEventListener("focus", function () {
      // Mark this input as active
      this.dataset.active = "true";

      // Find index of this input for sequential mode
      const allInputs = document.querySelectorAll(".waypoint-input");
      const index = Array.from(allInputs).indexOf(this);
      if (index !== -1) {
        window.waypointState.currentWaypointIndex = index;
      }
    });

    input.addEventListener("blur", function () {
      this.dataset.active = "false";
    });
  };

  // Setup existing inputs
  document.querySelectorAll(".waypoint-input").forEach(setupInput);

  // Setup mutation observer to watch for new inputs
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.addedNodes) {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) {
            // Element node
            const inputs = node.querySelectorAll
              ? node.querySelectorAll(".waypoint-input")
              : [];
            inputs.forEach(setupInput);
          }
        });
      }
    });
  });

  // Start observing
  const waypointContainer = document.querySelector(".waypoints-container");
  if (waypointContainer) {
    observer.observe(waypointContainer, { childList: true, subtree: true });
  }
}

/**
 * Setup CSV import functionality
 */
function setupCsvImport() {
  // Look for existing import button and file input
  const importCsvBtn = document.getElementById("btn-import-csv");
  const fileInput = document.getElementById("waypoint-file-input");

  // If they don't exist, create them
  if (!importCsvBtn || !fileInput) {
    createCsvImportUI();
  } else {
    // Update existing file input handler
    fileInput.removeEventListener("change", handleFileUpload);
    fileInput.addEventListener("change", handleLatLonFileUpload);
  }
}

/**
 * Create CSV import UI elements
 */
function createCsvImportUI() {
  // Create CSV import button
  const importCsvBtn = document.createElement("button");
  importCsvBtn.id = "btn-import-csv";
  importCsvBtn.className = "btn btn-secondary";
  importCsvBtn.innerHTML = '<i class="fa fa-file-csv"></i> Import CSV/TXT';

  // Create file input (hidden)
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.id = "waypoint-file-input";
  fileInput.accept = ".csv,.txt";
  fileInput.style.display = "none";
  fileInput.addEventListener("change", handleLatLonFileUpload);

  // Add click handler to show file dialog
  importCsvBtn.addEventListener("click", function () {
    fileInput.click();
  });

  // Find button container or create one
  let btnContainer = document.querySelector(".waypoint-buttons");
  if (!btnContainer) {
    btnContainer = document.createElement("div");
    btnContainer.className = "waypoint-buttons";
    btnContainer.style.display = "flex";
    btnContainer.style.gap = "10px";
    btnContainer.style.marginTop = "10px";

    // Find where to place it
    const waypointsContainer = document.querySelector(".waypoints-container");
    if (waypointsContainer) {
      waypointsContainer.parentNode.insertBefore(
        btnContainer,
        waypointsContainer.nextSibling
      );
    } else {
      // Fallback to first panel
      const panel = document.querySelector(".panel-content");
      if (panel) panel.appendChild(btnContainer);
    }
  }

  // Add button and file input to container
  btnContainer.appendChild(importCsvBtn);
  btnContainer.appendChild(fileInput);
}

/**
 * Handle CSV/TXT file upload, assuming lat,lon format
 */
function handleLatLonFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const contents = e.target.result;
      parseLatLonWaypointsFile(contents, file.name);
    } catch (error) {
      showNotification("error", `Error parsing file: ${error.message}`);
      console.error("CSV parsing error:", error);
    }
  };

  reader.onerror = function () {
    showNotification("error", "Error reading file");
    console.error("File reading error:", reader.error);
  };

  reader.readAsText(file);
}

/**
 * Parse waypoints from uploaded file (lat,lon format)
 */
function parseLatLonWaypointsFile(contents, filename) {
  // Split by lines and remove empty lines
  const lines = contents.split(/\r?\n/).filter((line) => line.trim() !== "");

  if (lines.length < 2) {
    showNotification("warning", "File must contain at least 2 waypoints");
    return;
  }

  // Detect if it's a CSV with headers
  const hasHeaders = /^[a-zA-Z"']/.test(lines[0]);
  const startIndex = hasHeaders ? 1 : 0;

  // Determine the format (lat,lon or lon,lat) - default to lat,lon as specified
  let isLatLonFormat = true;

  // If has headers, try to detect format from headers
  if (hasHeaders) {
    const headerLine = lines[0].toLowerCase();

    // Override format detection only if clearly lon,lat
    if (
      headerLine.indexOf("longitude") !== -1 &&
      headerLine.indexOf("longitude") < headerLine.indexOf("latitude")
    ) {
      isLatLonFormat = false;
    }
  }

  console.log(`CSV format detected: ${isLatLonFormat ? "lat,lon" : "lon,lat"}`);
  showNotification(
    "info",
    `CSV format detected: ${isLatLonFormat ? "lat,lon" : "lon,lat"}`
  );

  // Process waypoints
  const waypoints = [];

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse line
    const parts = line
      .split(/[,;\t]/)
      .map((part) => part.trim().replace(/^["']|["']$/g, ""));

    if (parts.length >= 2) {
      let lat, lon;

      // Parse depending on format
      if (isLatLonFormat) {
        // Format is lat,lon
        lat = parseFloat(parts[0]);
        lon = parseFloat(parts[1]);
      } else {
        // Format is lon,lat
        lon = parseFloat(parts[0]);
        lat = parseFloat(parts[1]);
      }

      // Validate coordinate values
      if (
        !isNaN(lat) &&
        !isNaN(lon) &&
        lat >= -90 &&
        lat <= 90 &&
        lon >= -180 &&
        lon <= 180
      ) {
        // Format as "lon,lat" for OSRM (regardless of input format)
        waypoints.push(`${lon},${lat}`);
      }
    }
  }

  // Make sure we have enough waypoints
  if (waypoints.length < 2) {
    showNotification(
      "error",
      "Could not parse at least 2 valid waypoints from the file"
    );
    return;
  }

  // Clear existing waypoints
  clearExistingWaypoints();

  // Add slider to match waypoint count
  const waypointCountSlider = document.getElementById("waypoint-count");
  if (waypointCountSlider) {
    waypointCountSlider.value = Math.min(10, waypoints.length);
    document.getElementById("waypoint-count-value").textContent = Math.min(
      10,
      waypoints.length
    );
    window.waypointState.maxWaypoints = Math.min(10, waypoints.length);
  }

  // Make sure we have the right number of waypoint inputs
  updateWaypointUI(waypoints.length);

  // Fill waypoints into inputs
  fillWaypointsFromArray(waypoints);

  showNotification(
    "success",
    `Successfully imported ${waypoints.length} waypoints from ${filename}`
  );

  // Auto-route if enabled
  const autoRouteToggle = document.getElementById("auto-route-toggle");
  if (
    autoRouteToggle &&
    autoRouteToggle.checked &&
    typeof findRouteWithMultipleWaypoints === "function"
  ) {
    findRouteWithMultipleWaypoints();
  }
}

/**
 * Clear all existing waypoints
 */
function clearExistingWaypoints() {
  // Clear waypoint inputs
  document.querySelectorAll(".waypoint-input").forEach((input) => {
    input.value = "";
  });

  // Clear markers
  if (typeof clearWaypoints === "function") {
    clearWaypoints();
  }

  // Clear numbered markers
  if (typeof clearNumberedMarkers === "function") {
    clearNumberedMarkers();
  }
}

/**
 * Fill waypoints from array into inputs
 */
function fillWaypointsFromArray(waypoints) {
  // Get all waypoint inputs
  const inputs = document.querySelectorAll(".waypoint-input");
  if (inputs.length < waypoints.length) {
    console.warn(
      `Not enough waypoint inputs (${inputs.length}) for all waypoints (${waypoints.length})`
    );

    // Add more waypoint inputs if needed
    for (let i = inputs.length; i < waypoints.length; i++) {
      addNewWaypointImplementation();
    }
  }

  // Get updated inputs after adding more
  const updatedInputs = document.querySelectorAll(".waypoint-input");

  // Fill values
  for (let i = 0; i < Math.min(updatedInputs.length, waypoints.length); i++) {
    const input = updatedInputs[i];
    const coordString = waypoints[i];

    input.value = coordString;

    // Add appropriate marker
    const coords = FormatUtils.parseCoordinateString(coordString);
    if (coords) {
      const latlng = { lat: coords[1], lng: coords[0] };

      // Add numbered marker
      if (typeof addNumberedMarker === "function") {
        addNumberedMarker(latlng, { number: i + 1 });
      }
      // Or add standard markers if numbered markers not available
      else {
        if (input.id === "start-point") {
          if (typeof addStartMarker === "function") {
            addStartMarker(latlng);
          }
        } else if (input.id === "end-point") {
          if (typeof addEndMarker === "function") {
            addEndMarker(latlng);
          }
        } else if (input.id && input.id.startsWith("via-point-")) {
          if (typeof addViaMarker === "function") {
            addViaMarker(latlng, input.id);
          }
        }
      }
    }
  }

  // Update waypoints list
  if (typeof updateWaypointsList === "function") {
    updateWaypointsList();
  }
}

// Show notification function (fallback if not already defined)
if (typeof showNotification !== "function") {
  window.showNotification = function (type, message, duration = 3000) {
    console.log(`[${type}] ${message}`);
    alert(message);
  };
}

// Make the internal implementations available globally
window.addNewWaypoint = addNewWaypointImplementation;
window.removeWaypoint = removeWaypointImplementation;

// Export functions to global scope
window.initWaypointHandler = initWaypointHandler;
window.handleLatLonFileUpload = handleLatLonFileUpload;
window.parseLatLonWaypointsFile = parseLatLonWaypointsFile;
window.clearExistingWaypoints = clearExistingWaypoints;
window.fillWaypointsFromArray = fillWaypointsFromArray;
window.updateWaypointUI = updateWaypointUI;
