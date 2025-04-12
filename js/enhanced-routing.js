/**
 * Enhanced routing module with CURB support, URL copy/paste, and dynamic profiles
 */

// Variable to store last route data
let currentRouteData = null;

// Store the current routing URL
let currentRoutingUrl = "";

// Array to store all waypoints
let waypointsList = [];

// Interval for checking profile updates (in milliseconds)
const PROFILE_UPDATE_INTERVAL = 30000; // 30 seconds

/**
 * Initialize routing functionality with enhanced features
 */
async function initRouting() {
  // Setup event listener for route search button
  document
    .getElementById("btn-find-route")
    .addEventListener("click", findRouteWithMultipleWaypoints);

  // Setup event listener for clear route button
  document
    .getElementById("btn-clear-route")
    .addEventListener("click", clearRouteAndWaypoints);

  // Setup event listener for clear start & end buttons
  document
    .getElementById("btn-clear-start")
    .addEventListener("click", clearStartPoint);
  document
    .getElementById("btn-clear-end")
    .addEventListener("click", clearEndPoint);

  // Initial profile setup
  await updateProfileDisplay();

  // Set up periodic profile updates
  setInterval(updateProfileDisplay, PROFILE_UPDATE_INTERVAL);

  // Setup multiple waypoints
  initRoutingWithMultipleWaypoints();

  // Setup time-dependent routing
  initTimeDependentRouting();

  // Setup CURB parameters
  initCurbParameters();

  // Setup URL copy/paste functionality
  initUrlHandling();

  // Setup auto-routing toggle
  initAutoRouting();

  console.log("Enhanced routing module initialized");
}

/**
 * Initialize CURB parameter options
 */
function initCurbParameters() {
  // Create container for CURB options
  const curbContainer = document.createElement("div");
  curbContainer.className = "form-group curb-options";

  // Add CURB toggle switch
  curbContainer.innerHTML = `
    <div class="toggle-container">
      <label for="curb-toggle" class="toggle-label">CURB Routing:</label>
      <div class="toggle-switch">
        <input type="checkbox" id="curb-toggle" class="toggle-checkbox">
        <label for="curb-toggle" class="toggle-slider"></label>
      </div>
      <i class="fa fa-info-circle curb-info" title="CURB routing enforces local turn restrictions and approach/departure directions"></i>
    </div>
  `;

  // Add container to route options
  document.querySelector(".route-options").appendChild(curbContainer);

  // Add event listener for CURB toggle
  document
    .getElementById("curb-toggle")
    .addEventListener("change", function () {
      // If auto-routing is enabled, find new route with CURB parameter
      if (document.getElementById("auto-route-toggle").checked) {
        findRouteWithMultipleWaypoints();
      }
    });
}

/**
 * Initialize URL handling features (copy/paste routing URLs)
 */
function initUrlHandling() {
  // Create container for URL options
  const urlContainer = document.createElement("div");
  urlContainer.className = "form-group url-options panel";

  // Add URL options HTML
  urlContainer.innerHTML = `
    <div class="panel-header">
      <h2><i class="fa fa-link"></i> Routing URL</h2>
    </div>
    <div class="panel-content">
      <div class="url-actions">
        <button id="btn-copy-url" class="btn btn-secondary">
          <i class="fa fa-copy"></i> Copy Routing URL
        </button>
        <button id="btn-open-url-modal" class="btn btn-secondary">
          <i class="fa fa-paste"></i> Paste & Render URL
        </button>
      </div>
      
      <!-- URL Modal (initially hidden) -->
      <div id="url-modal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Paste OSRM Routing URL</h3>
            <span class="close-modal">&times;</span>
          </div>
          <div class="modal-body">
            <textarea id="routing-url-input" placeholder="Paste OSRM routing URL here..."></textarea>
            <button id="btn-render-url" class="btn btn-primary">
              <i class="fa fa-play"></i> Render Route
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add container to panels container, after the existing panels
  const panelsContainer = document.querySelector(".panels-container");
  const resultsPanel = document.getElementById("panel-results");
  panelsContainer.insertBefore(urlContainer, resultsPanel.nextSibling);

  // Setup event listeners for URL actions
  document
    .getElementById("btn-copy-url")
    .addEventListener("click", copyRoutingUrl);
  document
    .getElementById("btn-open-url-modal")
    .addEventListener("click", openUrlModal);
  document
    .getElementById("btn-render-url")
    .addEventListener("click", renderPastedUrl);

  // Close modal when clicking on X or outside the modal
  document
    .querySelector(".close-modal")
    .addEventListener("click", closeUrlModal);
  window.addEventListener("click", function (event) {
    const modal = document.getElementById("url-modal");
    if (event.target == modal) {
      closeUrlModal();
    }
  });
}

/**
 * Initialize auto-routing toggle
 */
function initAutoRouting() {
  // Create container for auto-routing toggle
  const autoRouteContainer = document.createElement("div");
  autoRouteContainer.className = "form-group auto-route-options";

  // Add auto-routing toggle switch
  autoRouteContainer.innerHTML = `
    <div class="toggle-container">
      <label for="auto-route-toggle" class="toggle-label">Auto-Routing:</label>
      <div class="toggle-switch">
        <input type="checkbox" id="auto-route-toggle" class="toggle-checkbox" checked>
        <label for="auto-route-toggle" class="toggle-slider"></label>
      </div>
      <i class="fa fa-info-circle auto-info" title="When enabled, routes will automatically recalculate when markers are moved"></i>
    </div>
  `;

  // Add container to route options
  document
    .querySelector(".route-options")
    .insertBefore(
      autoRouteContainer,
      document.querySelector(".action-buttons")
    );
}

/**
 * Copy current routing URL to clipboard
 */
function copyRoutingUrl() {
  if (!currentRoutingUrl) {
    alert("No route is currently displayed. Please find a route first.");
    return;
  }

  // Create temporary textarea to copy URL
  const tempTextArea = document.createElement("textarea");
  tempTextArea.value = currentRoutingUrl;
  document.body.appendChild(tempTextArea);
  tempTextArea.select();

  try {
    // Copy URL to clipboard
    document.execCommand("copy");

    // Show success message
    const copyBtn = document.getElementById("btn-copy-url");
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = '<i class="fa fa-check"></i> URL Copied!';

    // Reset button text after 2 seconds
    setTimeout(() => {
      copyBtn.innerHTML = originalText;
    }, 2000);
  } catch (err) {
    console.error("Failed to copy URL:", err);
    alert("Failed to copy URL to clipboard");
  }

  document.body.removeChild(tempTextArea);
}

/**
 * Open URL modal dialog
 */
function openUrlModal() {
  document.getElementById("url-modal").style.display = "block";
  document.getElementById("routing-url-input").focus();
}

/**
 * Close URL modal dialog
 */
function closeUrlModal() {
  document.getElementById("url-modal").style.display = "none";
}

/**
 * Parse and render route from pasted URL
 */
function renderPastedUrl() {
  const urlInput = document.getElementById("routing-url-input").value.trim();

  if (!urlInput) {
    alert("Please paste a valid OSRM routing URL");
    return;
  }

  try {
    // Parse the URL
    const urlObj = new URL(urlInput);

    // Extract profile, coordinates, and other parameters
    const pathParts = urlObj.pathname.split("/");
    let profile, coordinates;

    // Find profile and coordinates in the URL
    for (let i = 0; i < pathParts.length; i++) {
      if (
        pathParts[i] === "route" ||
        pathParts[i] === "trip" ||
        pathParts[i] === "match"
      ) {
        if (i + 3 < pathParts.length) {
          profile = pathParts[i + 2];
          coordinates = pathParts[i + 3];
          break;
        }
      }
    }

    if (!profile || !coordinates) {
      throw new Error("Could not find profile or coordinates in URL");
    }

    // Parse coordinates and set as waypoints
    const coords = coordinates.split(";");
    if (coords.length < 2) {
      throw new Error("URL must contain at least start and end coordinates");
    }

    // Clear existing waypoints
    clearRouteAndWaypoints();

    // Set start point
    const startCoord = coords[0];
    document.getElementById("start-point").value = startCoord;
    const startLatLng = parseCoordinateString(startCoord);
    if (startLatLng) {
      addStartMarker({ lat: startLatLng[1], lng: startLatLng[0] });
    }

    // Set via points
    for (let i = 1; i < coords.length - 1; i++) {
      const viaCoord = coords[i];
      const newViaPoint = addNewWaypoint();
      const viaInput = newViaPoint.querySelector(".waypoint-input");
      viaInput.value = viaCoord;

      const viaLatLng = parseCoordinateString(viaCoord);
      if (viaLatLng) {
        addViaMarker({ lat: viaLatLng[1], lng: viaLatLng[0] }, viaInput.id);
      }
    }

    // Set end point
    const endCoord = coords[coords.length - 1];
    document.getElementById("end-point").value = endCoord;
    const endLatLng = parseCoordinateString(endCoord);
    if (endLatLng) {
      addEndMarker({ lat: endLatLng[1], lng: endLatLng[0] });
    }

    // Extract and set other parameters
    const params = new URLSearchParams(urlObj.search);

    // Set CURB parameter if present
    if (params.has("curb")) {
      document.getElementById("curb-toggle").checked =
        params.get("curb") === "true";
    }

    // Set time parameter if present
    if (params.has("depart")) {
      const departTimestamp = parseInt(params.get("depart")) * 1000; // Convert to milliseconds
      const departDate = new Date(departTimestamp);

      const enableTimeRouting = document.getElementById("enable-time-routing");
      if (enableTimeRouting) {
        enableTimeRouting.checked = true;
      }

      const departureTime = document.getElementById("departure-time");
      if (departureTime) {
        const year = departDate.getFullYear();
        const month = String(departDate.getMonth() + 1).padStart(2, "0");
        const day = String(departDate.getDate()).padStart(2, "0");
        const hours = String(departDate.getHours()).padStart(2, "0");
        const minutes = String(departDate.getMinutes()).padStart(2, "0");

        departureTime.value = `${year}-${month}-${day}T${hours}:${minutes}`;
      }
    }

    // Update profile if possible
    const profileDisplay = document.getElementById("profile-display");
    if (profileDisplay) {
      profileDisplay.textContent = profile;
      profileDisplay.parentElement.dataset.profile = profile;
    }

    // Close the modal
    closeUrlModal();

    // Update waypoints list
    updateWaypointsList();

    // Find the route
    findRouteWithMultipleWaypoints();
  } catch (error) {
    console.error("Error parsing URL:", error);
    alert(`Error parsing URL: ${error.message}`);
  }
}

/**
 * Enhanced method to update profile display from backend
 */
async function updateProfileDisplay() {
  try {
    // Get current profile from backend
    const currentProfile = await getCurrentProfile();

    // Get profile element or container
    const profileElement = document.getElementById("profile");
    let profileContainer = document.querySelector(".form-group[data-profile]");

    if (!profileContainer) {
      // First time setup - need to replace dropdown with display
      profileContainer = profileElement.parentElement;

      // Create a new display element
      const profileDisplay = document.createElement("div");
      profileDisplay.id = "profile-display";
      profileDisplay.className = "profile-value";
      profileDisplay.textContent = currentProfile;

      // Replace the dropdown with the display
      profileContainer.innerHTML = `<label>Profile:</label>`;
      profileContainer.appendChild(profileDisplay);
    } else {
      // Update existing display
      const profileDisplay = document.getElementById("profile-display");
      if (profileDisplay) {
        profileDisplay.textContent = currentProfile;
      }
    }

    // Store the profile value as a data attribute for later use
    profileContainer.dataset.profile = currentProfile;

    // Also update the algorithm display
    await updateAlgorithmDisplay();

    console.log(`Profile updated from backend: ${currentProfile}`);
  } catch (error) {
    console.error("Error updating profile display:", error);
  }
}

/**
 * Update algorithm display from backend
 */
async function updateAlgorithmDisplay() {
  try {
    const currentAlgorithm = await getCurrentAlgorithm();
    const algorithmElement = document.getElementById("algorithm");
    let algorithmContainer = document.querySelector(
      ".form-group[data-algorithm]"
    );

    if (!algorithmContainer) {
      // First time setup
      algorithmContainer = algorithmElement.parentElement;

      // Create display element
      const algorithmDisplay = document.createElement("div");
      algorithmDisplay.id = "algorithm-display";
      algorithmDisplay.className = "algorithm-value";
      algorithmDisplay.textContent = currentAlgorithm.toUpperCase();

      // Replace dropdown with display
      algorithmContainer.innerHTML = `<label>Algorithm:</label>`;
      algorithmContainer.appendChild(algorithmDisplay);
    } else {
      // Update existing display
      const algorithmDisplay = document.getElementById("algorithm-display");
      if (algorithmDisplay) {
        algorithmDisplay.textContent = currentAlgorithm.toUpperCase();
      }
    }

    // Store algorithm value as data attribute
    algorithmContainer.dataset.algorithm = currentAlgorithm;

    console.log(`Algorithm updated from backend: ${currentAlgorithm}`);
  } catch (error) {
    console.error("Error updating algorithm display:", error);
  }
}

/**
 * Robust method to get current profile from backend with fallback options
 */
async function getCurrentProfile() {
  try {
    // Try accessing different possible status endpoints
    const possibleEndpoints = [
      `${CONFIG.osrmBackendUrl}/status`,
      `${CONFIG.osrmBackendUrl}/v1/status`,
      `${CONFIG.osrmBackendUrl}/`,
    ];

    // Try each endpoint until one works
    let data;
    for (const endpoint of possibleEndpoints) {
      try {
        console.log(`Trying to fetch profile from: ${endpoint}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

        const response = await fetch(endpoint, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          data = await response.json();
          console.log("Successful profile response:", data);
          break;
        }
      } catch (endpointError) {
        console.log(`Endpoint ${endpoint} failed:`, endpointError.message);
        // Continue to the next endpoint
      }
    }

    // If data was successfully retrieved from any endpoint, use it
    if (data && data.profile) {
      return data.profile;
    }

    // As a last resort, check if we can determine from a routing request
    try {
      console.log("Attempting to detect profile from routing capabilities");
      // Try to determine which profile works by making minimal routing requests
      const profiles = ["van_2022", "van_scpa", "driving", "car"];

      for (const profile of profiles) {
        try {
          const testUrl = `${CONFIG.osrmBackendUrl}/route/v1/${profile}/0,0;1,1?overview=false`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1000);

          const routeResponse = await fetch(testUrl, {
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (routeResponse.ok) {
            console.log(`Profile ${profile} exists and works`);
            return profile;
          }
        } catch (profileError) {
          console.log(`Profile ${profile} test failed:`, profileError.message);
        }
      }
    } catch (routeError) {
      console.log("Route detection failed:", routeError.message);
    }

    console.log("Falling back to default profile");
    // Final fallback - always use a sensible default
    return "driving";
  } catch (error) {
    console.error("Error fetching current profile:", error);
    return "driving"; // Default profile on error
  }
}

/**
 * Robust method to get current algorithm from backend with fallback options
 */
async function getCurrentAlgorithm() {
  try {
    // Try to use the same endpoints as profile detection
    const possibleEndpoints = [
      `${CONFIG.osrmBackendUrl}/status`,
      `${CONFIG.osrmBackendUrl}/v1/status`,
      `${CONFIG.osrmBackendUrl}/`,
    ];

    // Try each endpoint until one works
    let data;
    for (const endpoint of possibleEndpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const response = await fetch(endpoint, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          data = await response.json();
          break;
        }
      } catch (endpointError) {
        // Continue to the next endpoint
      }
    }

    // If data was successfully retrieved from any endpoint
    if (data) {
      // OSRM might return the algorithm in different properties depending on the version
      return data.algorithm || data.engine || "mld";
    }

    // Default fallback
    return "mld";
  } catch (error) {
    console.error("Error fetching current algorithm:", error);
    return "mld"; // Default algorithm on error
  }
}

/**
 * Setup multiple waypoints UI
 */
function initRoutingWithMultipleWaypoints() {
  // Add button for adding waypoints
  const waypointsContainer = document.querySelector(".waypoints-container");

  // Create "Add Waypoint" button
  const addWaypointBtn = document.createElement("button");
  addWaypointBtn.id = "btn-add-waypoint";
  addWaypointBtn.className = "btn btn-secondary";
  addWaypointBtn.innerHTML = '<i class="fa fa-plus"></i> Add Waypoint';
  addWaypointBtn.addEventListener("click", addNewWaypoint);

  // Create CSV import button
  const importCsvBtn = document.createElement("button");
  importCsvBtn.id = "btn-import-csv";
  importCsvBtn.className = "btn btn-secondary";
  importCsvBtn.innerHTML = '<i class="fa fa-file-csv"></i> Import CSV/TXT';
  importCsvBtn.addEventListener("click", () =>
    document.getElementById("waypoint-file-input").click()
  );

  // Create file input (hidden)
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.id = "waypoint-file-input";
  fileInput.accept = ".csv,.txt";
  fileInput.style.display = "none";
  fileInput.addEventListener("change", handleFileUpload);

  // Create button container
  const btnContainer = document.createElement("div");
  btnContainer.className = "waypoint-buttons";
  btnContainer.style.display = "flex";
  btnContainer.style.gap = "10px";
  btnContainer.style.marginTop = "10px";
  btnContainer.appendChild(addWaypointBtn);
  btnContainer.appendChild(importCsvBtn);
  btnContainer.appendChild(fileInput);

  // Insert after waypoints container
  waypointsContainer.parentNode.insertBefore(
    btnContainer,
    waypointsContainer.nextSibling
  );

  // Initialize waypoints list with start and end
  updateWaypointsList();

  // Override map click handler
  map.off("click", handleMapClick);
  map.on("click", handleMapClickWithMultipleWaypoints);
}

/**
 * Fixed function to add a new waypoint input field
 */
function addNewWaypoint() {
  const waypointsContainer = document.querySelector(".waypoints-container");
  const lastWaypoint = waypointsContainer.querySelector(".waypoint.end");

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
      removeWaypoint(this.closest(".waypoint"));
    });

  // Add focus/blur events to input for map selection
  const inputElement = newWaypoint.querySelector(".waypoint-input");
  inputElement.addEventListener("focus", function () {
    this.dataset.active = "true";
    console.log(`Via point ${newIndex} input active`);
  });

  inputElement.addEventListener("blur", function () {
    this.dataset.active = "false";
    console.log(`Via point ${newIndex} input inactive`);
  });

  // Insert before end waypoint
  waypointsContainer.insertBefore(separator, lastWaypoint);
  waypointsContainer.insertBefore(newWaypoint, lastWaypoint);

  console.log(`Added new waypoint via-point-${newIndex}`);

  // Update waypoints list
  updateWaypointsList();

  return newWaypoint;
}

/**
 * Remove a waypoint
 */
function removeWaypoint(waypointElement) {
  const container = waypointElement.parentNode;
  const previousSeparator = waypointElement.previousElementSibling;

  // Get the ID of the waypoint to be removed (for marker removal)
  const inputElement = waypointElement.querySelector(".waypoint-input");
  if (inputElement && inputElement.id) {
    const inputId = inputElement.id;

    // Find and remove the corresponding marker
    const markerId = `via-marker-${inputId.split("-").pop()}`;
    const markerIndex = waypointMarkers.via.findIndex(
      (m) => m.options.markerId === markerId
    );

    if (markerIndex !== -1) {
      mapLayers.waypoints.removeLayer(waypointMarkers.via[markerIndex]);
      waypointMarkers.via.splice(markerIndex, 1);
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

  // Update waypoints list
  updateWaypointsList();

  // If auto-routing is enabled, find new route
  if (document.getElementById("auto-route-toggle").checked) {
    findRouteWithMultipleWaypoints();
  }
}

/**
 * Fixed updateWaypointsList function to ensure correct order
 */
function updateWaypointsList() {
  // Empty the array first
  waypointsList = [];

  // Always start with the start point if it exists
  const startPointInput = document.getElementById("start-point");
  if (startPointInput && startPointInput.value) {
    waypointsList.push(startPointInput.value);
  }

  // Add all via points in order
  const viaPoints = document.querySelectorAll(".waypoint.via .waypoint-input");
  viaPoints.forEach((input) => {
    if (input.value) {
      waypointsList.push(input.value);
    }
  });

  // Add end point if it exists
  const endPointInput = document.getElementById("end-point");
  if (endPointInput && endPointInput.value) {
    waypointsList.push(endPointInput.value);
  }

  console.log("Updated waypoints list:", waypointsList);
}

/**
 * Fixed function to handle map click for selecting waypoints
 */
function handleMapClickWithMultipleWaypoints(e) {
  const latlng = e.latlng;
  const osrmFormat = [latlng.lng, latlng.lat]; // Format OSRM [lng, lat]
  const coordString = formatCoordinateString(osrmFormat);

  // Find active input (if any)
  const activeInput = document.querySelector(
    ".waypoint-input[data-active='true']"
  );

  if (activeInput) {
    // If there's an active input, fill it
    activeInput.value = coordString;

    // Add appropriate marker based on input type
    if (activeInput.id === "start-point") {
      addStartMarker(latlng);
    } else if (activeInput.id === "end-point") {
      addEndMarker(latlng);
    } else {
      // It's a via point
      addViaMarker(latlng, activeInput.id);
    }

    // Update waypoints list
    updateWaypointsList();

    // If auto-routing is enabled, find new route
    if (
      document.getElementById("auto-route-toggle") &&
      document.getElementById("auto-route-toggle").checked
    ) {
      findRouteWithMultipleWaypoints();
    }
  } else {
    // Default behavior for non-active inputs
    const startInput = document.getElementById("start-point");
    const endInput = document.getElementById("end-point");

    if (startInput.value === "") {
      startInput.value = coordString;
      addStartMarker(latlng);
    } else if (endInput.value === "") {
      endInput.value = coordString;
      addEndMarker(latlng);
    } else {
      // If both start and end are filled, add a new via point
      const newWaypoint = addNewWaypoint();

      // Wait for the new waypoint to be added to the DOM
      setTimeout(() => {
        const newInput = newWaypoint.querySelector(".waypoint-input");
        if (newInput) {
          newInput.value = coordString;
          addViaMarker(latlng, newInput.id);

          // Ensure waypoints list is updated after adding the coordinate
          updateWaypointsList();

          // If auto-routing is enabled, find new route
          if (
            document.getElementById("auto-route-toggle") &&
            document.getElementById("auto-route-toggle").checked
          ) {
            findRouteWithMultipleWaypoints();
          }
        }
      }, 10);
    }
  }
}

/**
 * Improved CSV/TXT file upload handler for lat,lon format
 */
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    const contents = e.target.result;
    parseWaypointsFile(contents, file.name);
  };

  reader.readAsText(file);
}

/**
 * Parse waypoints from uploaded file with support for lat,lon format
 */
function parseWaypointsFile(contents, filename) {
  // Clear existing waypoints except start
  clearWaypoints();

  // Split by lines and remove empty lines
  const lines = contents.split(/\r?\n/).filter((line) => line.trim() !== "");

  if (lines.length < 2) {
    alert("File must contain at least 2 waypoints");
    return;
  }

  // Detect if it's a CSV with headers
  const hasHeaders = /^[a-zA-Z"']/.test(lines[0]);
  const startIndex = hasHeaders ? 1 : 0;

  // Determine the format (lat,lon or lon,lat)
  let isLatLonFormat = true;

  // Check for "latitude" or "lat" in the header
  if (hasHeaders) {
    const headerLine = lines[0].toLowerCase();
    if (headerLine.includes("latitude") || headerLine.includes("lat")) {
      isLatLonFormat = true;
    } else if (headerLine.includes("longitude") || headerLine.includes("lon")) {
      // Check if longitude comes first
      const lonIndex = Math.min(
        headerLine.indexOf("longitude") !== -1
          ? headerLine.indexOf("longitude")
          : Infinity,
        headerLine.indexOf("lon") !== -1 ? headerLine.indexOf("lon") : Infinity
      );

      const latIndex = Math.min(
        headerLine.indexOf("latitude") !== -1
          ? headerLine.indexOf("latitude")
          : Infinity,
        headerLine.indexOf("lat") !== -1 ? headerLine.indexOf("lat") : Infinity
      );

      isLatLonFormat = lonIndex > latIndex;
    }
  }

  console.log(`CSV format detected: ${isLatLonFormat ? "lat,lon" : "lon,lat"}`);

  // Process waypoints
  const waypoints = [];

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse the line
    let lat, lon;

    // Handle quoted values and different delimiters
    const parts = line
      .split(/[,;\t]/)
      .map((part) => part.trim().replace(/^["']|["']$/g, ""));

    if (parts.length >= 2) {
      // Check if we have both lat and lon
      if (isLatLonFormat) {
        // Format is lat,lon
        lat = parseFloat(parts[0]);
        lon = parseFloat(parts[1]);
      } else {
        // Format is lon,lat
        lon = parseFloat(parts[0]);
        lat = parseFloat(parts[1]);
      }

      // Validate lat/lon values
      if (
        !isNaN(lat) &&
        !isNaN(lon) &&
        lat >= -90 &&
        lat <= 90 &&
        lon >= -180 &&
        lon <= 180
      ) {
        // Format as "lon,lat" for OSRM
        waypoints.push(`${lon},${lat}`);
      }
    }
  }

  if (waypoints.length < 2) {
    alert("Could not parse at least 2 valid waypoints from the file");
    return;
  }

  // Set start point
  document.getElementById("start-point").value = waypoints[0];
  const startLatLng = parseCoordinateString(waypoints[0]);
  if (startLatLng) {
    addStartMarker({ lat: startLatLng[1], lng: startLatLng[0] });
  }

  // Process intermediate points (clear any existing via points first)
  const viaPoints = document.querySelectorAll(".waypoint.via");
  viaPoints.forEach((point) => {
    removeWaypoint(point);
  });

  // Add new via points
  for (let i = 1; i < waypoints.length - 1; i++) {
    const newWaypoint = addNewWaypoint();
    const newInput = newWaypoint.querySelector(".waypoint-input");
    if (newInput) {
      newInput.value = waypoints[i];
      const viaLatLng = parseCoordinateString(waypoints[i]);
      if (viaLatLng) {
        addViaMarker({ lat: viaLatLng[1], lng: viaLatLng[0] }, newInput.id);
      }
    }
  }

  // Set end point
  document.getElementById("end-point").value = waypoints[waypoints.length - 1];
  const endLatLng = parseCoordinateString(waypoints[waypoints.length - 1]);
  if (endLatLng) {
    addEndMarker({ lat: endLatLng[1], lng: endLatLng[0] });
  }

  // Update waypoints list
  updateWaypointsList();

  alert(`Successfully imported ${waypoints.length} waypoints from ${filename}`);

  // If auto-routing is enabled, find new route
  if (
    document.getElementById("auto-route-toggle") &&
    document.getElementById("auto-route-toggle").checked
  ) {
    findRouteWithMultipleWaypoints();
  }
}

/**
 * Enhanced findRouteWithMultipleWaypoints function with CURB support
 */
async function findRouteWithMultipleWaypoints() {
  // Update waypoints list first
  updateWaypointsList();

  if (waypointsList.length < 2) {
    alert("Please specify at least a start and end point");
    return;
  }

  // Show loading indicator
  showLoading();

  try {
    // Get profile (using stored value or default)
    const profileContainer = document.querySelector(
      ".form-group[data-profile]"
    );
    const profile = profileContainer
      ? profileContainer.dataset.profile
      : "driving";

    // Get algorithm
    const algorithmContainer = document.querySelector(
      ".form-group[data-algorithm]"
    );
    const algorithm = algorithmContainer
      ? algorithmContainer.dataset.algorithm
      : "mld";

    // Construct waypoints string for API
    const waypointsString = waypointsList.join(";");

    // Check if time-dependent routing is enabled
    const timeEnabled =
      document.getElementById("enable-time-routing") &&
      document.getElementById("enable-time-routing").checked;

    // Check if CURB routing is enabled
    const curbEnabled =
      document.getElementById("curb-toggle") &&
      document.getElementById("curb-toggle").checked;

    // Build URL with base parameters
    let url = `${CONFIG.osrmBackendUrl}/route/v1/${profile}/${waypointsString}?overview=full&geometries=geojson&steps=true&annotations=true&alternatives=false`;

    // Add time parameter if enabled
    if (timeEnabled) {
      const departureTimeInput = document.getElementById("departure-time");
      if (departureTimeInput && departureTimeInput.value) {
        // Convert to Unix timestamp (seconds)
        const timestamp = Math.floor(
          new Date(departureTimeInput.value).getTime() / 1000
        );
        url += `&depart=${timestamp}`;

        console.log(
          `Time-dependent routing enabled with departure time: ${departureTimeInput.value} (timestamp: ${timestamp})`
        );
      }
    }

    // Add CURB parameter if enabled
    if (curbEnabled) {
      url += `&curb=true`;
      console.log("CURB routing enabled");
    }

    console.log("Making OSRM API request:", url);

    // Store the current routing URL for copy feature
    currentRoutingUrl = url;

    // Make the request
    const response = await fetch(url);

    // If the first profile fails, try alternatives
    if (!response.ok && response.status === 400) {
      console.log(`Profile ${profile} request failed, trying alternatives`);

      // Try alternative profiles
      const alternativeProfiles = ["van_scpa", "driving", "car", "van_2022"];

      for (const altProfile of alternativeProfiles) {
        if (altProfile === profile) continue; // Skip if same as original

        const altUrl = `${CONFIG.osrmBackendUrl}/route/v1/${altProfile}/${waypointsString}?overview=full&geometries=geojson&steps=true&annotations=true&alternatives=false`;

        let fullAltUrl = altUrl;

        if (timeEnabled) {
          const departureTimeInput = document.getElementById("departure-time");
          if (departureTimeInput && departureTimeInput.value) {
            const timestamp = Math.floor(
              new Date(departureTimeInput.value).getTime() / 1000
            );
            fullAltUrl += `&depart=${timestamp}`;
          }
        }

        if (curbEnabled) {
          fullAltUrl += `&curb=true`;
        }

        console.log(`Trying alternative profile ${altProfile}:`, fullAltUrl);

        const altResponse = await fetch(fullAltUrl);

        if (altResponse.ok) {
          console.log(`Alternative profile ${altProfile} succeeded`);

          // Update the profile in the UI for future requests
          const profileDisplay = document.getElementById("profile-display");
          if (profileDisplay) {
            profileDisplay.textContent = altProfile;
            profileContainer.dataset.profile = altProfile;
          }

          // Store the successful routing URL
          currentRoutingUrl = fullAltUrl;

          const data = await altResponse.json();

          if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
            throw new Error("Route not found");
          }

          // Process the successful response
          currentRouteData = data;
          displayRoute(data, altProfile);
          displayRouteSummary(data.routes[0], timeEnabled);
          displayRouteSteps(data.routes[0]);
          addMarkersFromInputs();

          hideLoading();
          return; // Exit the function since we've handled the request
        }
      }

      // If we get here, none of the alternative profiles worked
      throw new Error(
        `Routing failed with all profiles: ${profile}, ${alternativeProfiles.join(
          ", "
        )}`
      );
    }

    // Continue with original response if it was successful
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      throw new Error("Route not found");
    }

    // If time-enabled, check if the result actually uses time-dependent data
    if (timeEnabled) {
      // Look for specific indicators in the response that time-dependent routing was used
      const hasTimeData = checkForTimeData(data);

      if (!hasTimeData) {
        console.warn(
          "Time-dependent routing was requested but the OSRM backend may not support it or have traffic data loaded"
        );

        // Show a warning to the user
        const warningEl = document.createElement("div");
        warningEl.className = "warning-message";
        warningEl.innerHTML = `
          <i class="fa fa-exclamation-triangle" style="color: #f39c12;"></i>
          Time-dependent routing was requested, but the server may not have traffic data loaded.
        `;
        warningEl.style.padding = "8px";
        warningEl.style.backgroundColor = "#FFF9E6";
        warningEl.style.borderLeft = "3px solid #f39c12";
        warningEl.style.marginBottom = "10px";

        // Insert at the top of route summary
        const routeSummary = document.getElementById("route-summary");
        routeSummary.insertBefore(warningEl, routeSummary.firstChild);
      }
    }

    // Save current route data
    currentRouteData = data;

    // Display route on map
    displayRoute(data, profile);

    // Update route info panels
    displayRouteSummary(data.routes[0], timeEnabled);
    displayRouteSteps(data.routes[0]);

    // Add markers for all waypoints
    addMarkersFromInputs();
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("route-summary").innerHTML = `
      <p class="error-message">Error: ${error.message}</p>
    `;
    document.getElementById("route-steps").innerHTML = "";
  } finally {
    hideLoading();
  }
}

// Remaining functions from original routing.js...
