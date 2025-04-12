/**
 * Module for routing with OSRM API
 */

// Variable to store last route data
let currentRouteData = null;

// Array to store all waypoints
let waypointsList = [];

// Variable to store current routing URL
let currentRoutingUrl = "";

// Store available profiles based on what we've discovered
let availableProfiles = [
  "truck_staticth",
  "driving",
  "car",
  "van",
  "cycling",
  "walking",
];

// Interval for checking profile updates (in milliseconds)
const PROFILE_UPDATE_INTERVAL = 30000; // 30 seconds

/**
 * Initialize routing functionality with all enhancements
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

  // Setup CURB options (disabled since not supported)
  initCurbOptions();

  // Add routing URL display
  addRoutingUrlDisplay();

  console.log("Routing module initialized with all enhancements");
}

/**
 * Enhanced method to update profile display from backend with better error handling
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

      // Create a new display element with edit button
      const profileDisplay = document.createElement("div");
      profileDisplay.id = "profile-display";
      profileDisplay.className = "profile-value";

      // Add edit button and profile text
      profileDisplay.innerHTML = `
        <span>${currentProfile}</span>
        <button id="btn-edit-profile" class="btn btn-icon btn-edit">
          <i class="fa fa-edit"></i>
        </button>
      `;

      // Replace the dropdown with the display
      profileContainer.innerHTML = `<label>Profile:</label>`;
      profileContainer.appendChild(profileDisplay);

      // Add event listener to edit button
      document
        .getElementById("btn-edit-profile")
        .addEventListener("click", editProfile);
    } else {
      // Update existing display
      const profileDisplay = document.getElementById("profile-display");
      if (profileDisplay) {
        const profileSpan = profileDisplay.querySelector("span");
        if (profileSpan) {
          profileSpan.textContent = currentProfile;
        } else {
          profileDisplay.innerHTML = `
            <span>${currentProfile}</span>
            <button id="btn-edit-profile" class="btn btn-icon btn-edit">
              <i class="fa fa-edit"></i>
            </button>
          `;
          document
            .getElementById("btn-edit-profile")
            .addEventListener("click", editProfile);
        }
      }
    }

    // Store the profile value as a data attribute for later use
    profileContainer.dataset.profile = currentProfile;

    // Also update the algorithm display
    await updateAlgorithmDisplay();

    console.log(`Profile updated from backend: ${currentProfile}`);

    // Update the available profiles list for later use
    updateAvailableProfiles(currentProfile);
  } catch (error) {
    console.error("Error updating profile display:", error);
  }
}

/**
 * Update available profiles list
 */
function updateAvailableProfiles(currentProfile) {
  // Add current profile if not already in the list
  if (currentProfile && !availableProfiles.includes(currentProfile)) {
    availableProfiles.push(currentProfile);
  }

  // Try to get additional profiles from localStorage if any
  const storedProfiles = localStorage.getItem("availableProfiles");
  if (storedProfiles) {
    try {
      const profilesArray = JSON.parse(storedProfiles);
      if (Array.isArray(profilesArray)) {
        // Merge with existing profiles
        profilesArray.forEach((profile) => {
          if (!availableProfiles.includes(profile)) {
            availableProfiles.push(profile);
          }
        });
      }
    } catch (e) {
      console.error("Error parsing stored profiles:", e);
    }
  }

  // Save updated list to localStorage
  localStorage.setItem("availableProfiles", JSON.stringify(availableProfiles));
}

/**
 * Allow user to edit profile
 */
function editProfile() {
  // Create a dropdown with known profiles and option to enter custom one
  const profileSelectHTML = `
    <select id="profile-select" class="profile-select">
      <option value="custom">Custom profile...</option>
      ${availableProfiles
        .map((profile) => `<option value="${profile}">${profile}</option>`)
        .join("")}
    </select>
    <div id="custom-profile-container" style="display:none; margin-top:5px;">
      <input type="text" id="custom-profile-input" class="custom-profile-input" 
             placeholder="Enter custom profile name">
    </div>
    <div style="margin-top:10px; display:flex; gap:5px;">
      <button id="btn-save-profile" class="btn btn-primary btn-sm">Save</button>
      <button id="btn-cancel-profile" class="btn btn-secondary btn-sm">Cancel</button>
    </div>
  `;

  // Create modal for editing
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Edit Profile</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <p>Select from known profiles or enter a custom one:</p>
        ${profileSelectHTML}
      </div>
    </div>
  `;

  // Add modal to body
  document.body.appendChild(modal);

  // Show modal
  setTimeout(() => {
    modal.classList.add("show");
  }, 10);

  // Get current profile
  const currentProfile = document.querySelector(".form-group[data-profile]")
    .dataset.profile;

  // Set current profile as selected if available
  const selectElement = document.getElementById("profile-select");
  if (availableProfiles.includes(currentProfile)) {
    selectElement.value = currentProfile;
  }

  // Set up event listeners
  selectElement.addEventListener("change", function () {
    const customContainer = document.getElementById("custom-profile-container");
    if (this.value === "custom") {
      customContainer.style.display = "block";
      document.getElementById("custom-profile-input").focus();
    } else {
      customContainer.style.display = "none";
    }
  });

  // Close button
  document.querySelector(".modal-close").addEventListener("click", function () {
    modal.classList.remove("show");
    setTimeout(() => {
      document.body.removeChild(modal);
    }, 300);
  });

  // Save button
  document
    .getElementById("btn-save-profile")
    .addEventListener("click", function () {
      let newProfile;

      if (selectElement.value === "custom") {
        newProfile = document
          .getElementById("custom-profile-input")
          .value.trim();
        if (!newProfile) {
          alert("Please enter a custom profile name");
          return;
        }

        // Add to available profiles
        if (!availableProfiles.includes(newProfile)) {
          availableProfiles.push(newProfile);
          localStorage.setItem(
            "availableProfiles",
            JSON.stringify(availableProfiles)
          );
        }
      } else {
        newProfile = selectElement.value;
      }

      // Update display and data attribute
      const profileContainer = document.querySelector(
        ".form-group[data-profile]"
      );
      profileContainer.dataset.profile = newProfile;

      const profileSpan = document.querySelector("#profile-display span");
      if (profileSpan) {
        profileSpan.textContent = newProfile;
      }

      // Close modal
      modal.classList.remove("show");
      setTimeout(() => {
        document.body.removeChild(modal);
      }, 300);

      // Optionally update the route if one exists
      if (
        currentRouteData &&
        document.getElementById("auto-update-route") &&
        document.getElementById("auto-update-route").checked
      ) {
        findRouteWithMultipleWaypoints();
      }
    });

  // Cancel button
  document
    .getElementById("btn-cancel-profile")
    .addEventListener("click", function () {
      modal.classList.remove("show");
      setTimeout(() => {
        document.body.removeChild(modal);
      }, 300);
    });
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
    // Check if there's a profile from environment variable
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
      updateAvailableProfiles(data.profile);
      return data.profile;
    }

    // As a last resort, check if we can determine from a routing request
    try {
      console.log("Attempting to detect profile from routing capabilities");
      // Try to determine which profile works by making minimal routing requests

      // Use stored profiles first, with truck_staticth as a priority
      const profiles = [...availableProfiles];

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

    // Check for stored default profile
    const storedProfile = localStorage.getItem("lastUsedProfile");
    if (storedProfile) {
      console.log("Using stored profile:", storedProfile);
      return storedProfile;
    }

    console.log("Falling back to default profile");
    // Final fallback - use truck_staticth or another default
    return "truck_staticth";
  } catch (error) {
    console.error("Error fetching current profile:", error);
    return "truck_staticth"; // Default profile on error
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

  // Add auto-update toggle
  const routeOptions = document.querySelector(".route-options");
  const autoUpdateToggle = document.createElement("div");
  autoUpdateToggle.className = "form-group draggable-options";
  autoUpdateToggle.innerHTML = `
    <div class="toggle-container">
      <input type="checkbox" id="auto-update-route" class="toggle-checkbox" checked>
      <label for="auto-update-route" class="toggle-label">
        Auto-update route when dragging waypoints
        <i class="fa fa-info-circle" title="When enabled, the route will automatically update when you drag any waypoint marker on the map."></i>
      </label>
    </div>
  `;
  routeOptions.appendChild(autoUpdateToggle);

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
      addNewWaypoint();

      // FIXED: Wait for the new waypoint to be added to the DOM
      setTimeout(() => {
        const newInput = document.querySelector(
          ".waypoint.via .waypoint-input:not([value])"
        );
        if (newInput) {
          newInput.value = coordString;
          addViaMarker(latlng, newInput.id);

          // Ensure waypoints list is updated after adding the coordinate
          updateWaypointsList();
        }
      }, 10);
    }
  }

  // Update waypoints list
  updateWaypointsList();
}

/**
 * Handle CSV/TXT file upload with improved format detection
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
 * Parse waypoints from uploaded file with enhanced format detection
 */
function parseWaypointsFile(contents, filename) {
  // Clear existing waypoints except start
  clearWaypoints();

  // Split into lines and filter out empty lines
  const lines = contents.split(/\r?\n/).filter((line) => line.trim() !== "");

  if (lines.length < 2) {
    alert("File must contain at least 2 waypoints");
    return;
  }

  // Check if the file has a header (first line contains text like "lat" or "lon")
  const hasHeader = /latitude|longitude|lat|lng|lon/i.test(lines[0]);

  // Determine the format (lat,lon or lon,lat)
  let latFirst = true; // Default to lat,lon format as requested

  // Try to determine format from header if present
  if (hasHeader) {
    const headerParts = lines[0].toLowerCase().split(",");
    // If longitude/lng/lon comes before latitude/lat, then it's lon,lat format
    for (let i = 0; i < headerParts.length; i++) {
      const part = headerParts[i].trim().replace(/["']/g, "");
      if (
        part.includes("longitude") ||
        part.includes("lng") ||
        part.includes("lon")
      ) {
        if (
          i <
          headerParts.findIndex(
            (p) => p.includes("latitude") || p.includes("lat")
          )
        ) {
          latFirst = false;
        }
        break;
      }
    }
  }

  // Process the lines
  // Skip header if present
  const startIndex = hasHeader ? 1 : 0;

  // Check if we have enough lines after skipping header
  if (lines.length - startIndex < 2) {
    alert("File must contain at least 2 waypoints after header");
    return;
  }

  // Function to process a line into OSRM format (lng,lat)
  function processLine(line) {
    // Remove ALL quotes from the line first
    line = line.replace(/"/g, "");

    // Split by comma and trim
    const parts = line.split(",").map((part) => part.trim());

    // We expect at least 2 parts for lat and lon
    if (parts.length < 2) {
      console.warn("Invalid line format:", line);
      return null;
    }

    // Parse the numbers
    const firstNum = parseFloat(parts[0]);
    const secondNum = parseFloat(parts[1]);

    if (isNaN(firstNum) || isNaN(secondNum)) {
      console.warn("Could not parse numbers from line:", line);
      return null;
    }

    // Return in OSRM format (lng,lat)
    return latFirst
      ? `${secondNum},${firstNum}` // If lat comes first, switch to lng,lat
      : `${firstNum},${secondNum}`; // If lng comes first, keep as is
  }

  // Process each line
  const validLines = [];
  for (let i = startIndex; i < lines.length; i++) {
    const processedLine = processLine(lines[i]);
    if (processedLine) {
      validLines.push(processedLine);
    }
  }

  if (validLines.length < 2) {
    alert("Could not find at least 2 valid waypoints in the file");
    return;
  }

  // Set start point
  document.getElementById("start-point").value = validLines[0];

  // Process intermediate points (clear any existing via points first)
  const viaPoints = document.querySelectorAll(".waypoint.via");
  viaPoints.forEach((point) => {
    removeWaypoint(point);
  });

  // Add new via points
  for (let i = 1; i < validLines.length - 1; i++) {
    addNewWaypoint();
    const inputs = document.querySelectorAll(".waypoint.via .waypoint-input");
    const lastInput = inputs[inputs.length - 1];
    if (lastInput) {
      lastInput.value = validLines[i];
    }
  }

  // Set end point
  document.getElementById("end-point").value =
    validLines[validLines.length - 1];

  // Update waypoints list
  updateWaypointsList();

  // Add markers for all waypoints
  addMarkersFromInputs();

  alert(
    `Successfully imported ${validLines.length} waypoints from ${filename}`
  );
}

/**
 * Add markers for all waypoints from input values
 */
function addMarkersFromInputs() {
  const inputs = document.querySelectorAll(".waypoint-input");

  inputs.forEach((input) => {
    if (!input.value) return;

    const coords = parseCoordinateString(input.value);
    if (!coords) return;

    const latlng = { lat: coords[1], lng: coords[0] };

    if (input.id === "start-point") {
      addStartMarker(latlng);
    } else if (input.id === "end-point") {
      addEndMarker(latlng);
    } else {
      addViaMarker(latlng, input.id);
    }
  });
}

/**
 * Add time picker UI for time-dependent routing with better labels
 */
function addTimeDependentRoutingUI() {
  const routeOptions = document.querySelector(".route-options");

  // Create time selection container
  const timeContainer = document.createElement("div");
  timeContainer.className = "form-group time-selection";

  // Create HTML for time selection with clearer labeling
  timeContainer.innerHTML = `
    <label for="departure-time">Departure Time:</label>
    <div class="time-input-container">
      <input type="datetime-local" id="departure-time" class="form-control">
      <button id="btn-use-current-time" class="btn btn-secondary btn-sm">
        <i class="fa fa-clock"></i> Current
      </button>
    </div>
    <div class="time-toggle">
      <input type="checkbox" id="enable-time-routing" class="toggle-checkbox">
      <label for="enable-time-routing" class="toggle-label">Enable time-dependent routing (traffic-aware)</label>
    </div>
  `;

  // Add to route options
  routeOptions.appendChild(timeContainer);

  // Set current time as default
  setCurrentTimeAsDeparture();

  // Event listener for "Current" button
  document
    .getElementById("btn-use-current-time")
    .addEventListener("click", setCurrentTimeAsDeparture);

  // Add explanation tooltip about time-dependent routing
  const infoIcon = document.createElement("i");
  infoIcon.className = "fa fa-info-circle";
  infoIcon.style.marginLeft = "5px";
  infoIcon.style.color = "#666";
  infoIcon.title =
    "Time-dependent routing uses historical traffic data to calculate travel times based on the selected departure time. This requires traffic data to be loaded in the OSRM backend.";

  document.querySelector(".toggle-label").appendChild(infoIcon);
}

/**
 * Set current time as departure time
 */
function setCurrentTimeAsDeparture() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  document.getElementById(
    "departure-time"
  ).value = `${year}-${month}-${day}T${hours}:${minutes}`;

  console.log(`Set departure time to current time: ${now.toLocaleString()}`);
}

/**
 * Initialize time-dependent routing
 */
function initTimeDependentRouting() {
  // Add UI elements
  addTimeDependentRoutingUI();
}

/**
 * Add CURB options to UI with compatibility check
 */
function addCurbOptions() {
  // Find route options container
  const routeOptions = document.querySelector(".route-options");

  // Create curb options container
  const curbContainer = document.createElement("div");
  curbContainer.className = "form-group curb-options";

  // Create curb toggle with warning about compatibility
  curbContainer.innerHTML = `
    <div class="toggle-container">
      <input type="checkbox" id="enable-curb" class="toggle-checkbox" disabled>
      <label for="enable-curb" class="toggle-label">
        Enable CURB restriction
        <i class="fa fa-info-circle" title="CURB restrictions not supported by current OSRM backend version. This feature is disabled."></i>
      </label>
      <div class="curb-warning" style="margin-top:5px; font-size:11px; color:#e74c3c;">
        <i class="fa fa-exclamation-triangle"></i> 
        CURB feature not available with this OSRM backend version.
      </div>
    </div>
  `;

  // Add to route options
  routeOptions.appendChild(curbContainer);
}

/**
 * Initialize curb options - with backend compatibility check
 */
function initCurbOptions() {
  // Add UI elements
  addCurbOptions();

  // Skip enabling CURB functionality since backend doesn't support it
  console.log("CURB functionality disabled due to backend incompatibility");

  // For future backend upgrades, we'll attempt to check if CURB is supported
  checkCurbSupport();
}

/**
 * Check if the OSRM backend supports CURB
 */
async function checkCurbSupport() {
  try {
    const response = await fetch(`${CONFIG.osrmBackendUrl}/status`);
    if (response.ok) {
      const data = await response.json();

      // If backend reports CURB support in the future
      if (data.curb_supported === true) {
        // Enable the toggle
        const curbToggle = document.getElementById("enable-curb");
        if (curbToggle) {
          curbToggle.disabled = false;

          // Remove warning
          const curbWarning = document.querySelector(".curb-warning");
          if (curbWarning) {
            curbWarning.style.display = "none";
          }

          // Update tooltip
          const infoIcon =
            curbToggle.nextElementSibling.querySelector(".fa-info-circle");
          if (infoIcon) {
            infoIcon.title =
              "When enabled, the route will respect curb restrictions such as one-way streets, no-left-turns, etc.";
          }
        }
      }
    }
  } catch (error) {
    console.log("Could not check CURB support:", error);
  }
}

/**
 * Add URL display and copy button to UI
 */
function addRoutingUrlDisplay() {
  // Find result panel content area
  const resultPanel = document.querySelector("#panel-results .panel-content");

  // Create URL display section
  const urlDisplay = document.createElement("div");
  urlDisplay.className = "url-display-section";
  urlDisplay.innerHTML = `
    <h3>Routing URL</h3>
    <div class="url-container">
      <input type="text" id="routing-url-display" readonly class="url-input" placeholder="No route generated yet">
      <button id="btn-copy-url" class="btn btn-secondary btn-sm">
        <i class="fa fa-copy"></i> Copy
      </button>
    </div>
    <button id="btn-load-url" class="btn btn-secondary btn-sm">
      <i class="fa fa-upload"></i> Load URL
    </button>
  `;

  // Add to the panel, right after route-summary
  const routeSummary = document.getElementById("route-summary");
  routeSummary.parentNode.insertBefore(urlDisplay, routeSummary.nextSibling);

  // Add event listeners
  document
    .getElementById("btn-copy-url")
    .addEventListener("click", copyRoutingUrl);
  document
    .getElementById("btn-load-url")
    .addEventListener("click", promptLoadUrl);
}

/**
 * Update routing URL display
 */
function updateRoutingUrlDisplay() {
  const urlInput = document.getElementById("routing-url-display");
  if (urlInput && currentRoutingUrl) {
    urlInput.value = currentRoutingUrl;
  }
}

/**
 * Copy routing URL to clipboard
 */
function copyRoutingUrl() {
  const urlInput = document.getElementById("routing-url-display");

  if (!urlInput || !urlInput.value) {
    alert("No routing URL available to copy");
    return;
  }

  // Select the text
  urlInput.select();
  urlInput.setSelectionRange(0, 99999); // For mobile devices

  // Copy to clipboard
  try {
    // Modern approach
    navigator.clipboard
      .writeText(urlInput.value)
      .then(() => {
        // Show success feedback
        const copyBtn = document.getElementById("btn-copy-url");
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fa fa-check"></i> Copied!';
        setTimeout(() => {
          copyBtn.innerHTML = originalText;
        }, 2000);
      })
      .catch((err) => {
        // Fallback to document.execCommand
        document.execCommand("copy");

        // Show success feedback
        const copyBtn = document.getElementById("btn-copy-url");
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fa fa-check"></i> Copied!';
        setTimeout(() => {
          copyBtn.innerHTML = originalText;
        }, 2000);
      });
  } catch (err) {
    console.error("Failed to copy URL: ", err);
    alert("Failed to copy URL. Please try selecting and copying manually.");
  }
}

/**
 * Prompt user to enter a routing URL to load
 */
function promptLoadUrl() {
  const url = prompt("Enter OSRM routing URL to load:");

  if (!url) return;

  loadRoutingUrl(url);
}

/**
 * Load routing from URL
 */
async function loadRoutingUrl(url) {
  if (!url || !url.includes("/route/v1/")) {
    alert("Invalid OSRM routing URL format");
    return;
  }

  // Show loading indicator
  showLoading();

  try {
    // Extract profile and waypoints from URL
    // Format: /route/v1/{profile}/{coordinates}?{options}
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");

    // Get profile index (should be after /route/v1/)
    const routeVIndex = pathParts.findIndex((part) => part === "v1");
    if (routeVIndex === -1 || routeVIndex + 1 >= pathParts.length) {
      throw new Error("Invalid URL format: Cannot find profile");
    }

    const profile = pathParts[routeVIndex + 1];
    const coordinatesStr = pathParts[routeVIndex + 2];

    if (!profile || !coordinatesStr) {
      throw new Error("Invalid URL format: Missing profile or coordinates");
    }

    // Parse coordinates
    const waypoints = coordinatesStr.split(";");

    if (waypoints.length < 2) {
      throw new Error("Invalid URL format: Need at least 2 waypoints");
    }

    // Reset current waypoints
    clearRouteAndWaypoints();

    // Set start point
    document.getElementById("start-point").value = waypoints[0];

    // Add via points for waypoints in the middle
    for (let i = 1; i < waypoints.length - 1; i++) {
      addNewWaypoint();
      const inputs = document.querySelectorAll(".waypoint.via .waypoint-input");
      const lastInput = inputs[inputs.length - 1];
      if (lastInput) {
        lastInput.value = waypoints[i];
      }
    }

    // Set end point
    document.getElementById("end-point").value =
      waypoints[waypoints.length - 1];

    // Update waypoints list
    updateWaypointsList();

    // Add markers for all waypoints
    addMarkersFromInputs();

    // Check for options in URL
    const searchParams = new URLSearchParams(urlObj.search);

    // Set time-dependent routing if present
    if (
      searchParams.has("depart") &&
      document.getElementById("enable-time-routing")
    ) {
      document.getElementById("enable-time-routing").checked = true;

      // Try to set departure time if possible
      const timestamp = parseInt(searchParams.get("depart"));
      if (!isNaN(timestamp) && document.getElementById("departure-time")) {
        const date = new Date(timestamp * 1000);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");

        document.getElementById(
          "departure-time"
        ).value = `${year}-${month}-${day}T${hours}:${minutes}`;
      }
    }

    // Note: We skip CURB settings since it's not supported

    // Make the route request
    await findRouteWithMultipleWaypoints();

    // Store the loaded URL
    currentRoutingUrl = url;
    updateRoutingUrlDisplay();
  } catch (error) {
    console.error("Error loading routing URL:", error);
    alert(`Error loading routing URL: ${error.message}`);
  } finally {
    hideLoading();
  }
}

/**
 * Enhanced findRouteWithMultipleWaypoints function without CURB parameter
 * (since backend doesn't support it)
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
      : "truck_staticth"; // Use your default profile

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

    // Note: CURB parameter is removed since not supported by backend

    console.log("Making OSRM API request:", url);

    // Save the current URL for the copy functionality
    currentRoutingUrl = url;

    // Update the URL display if it exists
    updateRoutingUrlDisplay();

    // Make the request
    const response = await fetch(url);

    // If the first profile fails, try alternatives
    if (!response.ok && response.status === 400) {
      console.log(`Profile ${profile} request failed, trying alternatives`);

      // Try alternative profiles
      const alternativeProfiles = ["driving", "car", "truck_staticth"];

      for (const altProfile of alternativeProfiles) {
        if (altProfile === profile) continue; // Skip if same as original

        const altUrl = `${CONFIG.osrmBackendUrl}/route/v1/${altProfile}/${waypointsString}?overview=full&geometries=geojson&steps=true&annotations=true&alternatives=false`;

        if (timeEnabled) {
          const departureTimeInput = document.getElementById("departure-time");
          if (departureTimeInput && departureTimeInput.value) {
            const timestamp = Math.floor(
              new Date(departureTimeInput.value).getTime() / 1000
            );
            altUrl += `&depart=${timestamp}`;
          }
        }

        // Note: CURB parameter is removed since not supported by backend

        console.log(`Trying alternative profile ${altProfile}:`, altUrl);

        const altResponse = await fetch(altUrl);

        if (altResponse.ok) {
          console.log(`Alternative profile ${altProfile} succeeded`);

          // Update the profile in the UI for future requests
          const profileDisplay = document.getElementById("profile-display");
          if (profileDisplay) {
            const profileSpan = profileDisplay.querySelector("span");
            if (profileSpan) {
              profileSpan.textContent = altProfile;
            } else {
              profileDisplay.textContent = altProfile;
            }
            profileContainer.dataset.profile = altProfile;
          }

          const data = await altResponse.json();

          if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
            throw new Error("Route not found");
          }

          // Update current routing URL
          currentRoutingUrl = altUrl;
          updateRoutingUrlDisplay();

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

/**
 * Check if the response contains time-dependent data
 */
function checkForTimeData(data) {
  try {
    // Check different indicators that might suggest time-data is being used

    // 1. Check if 'depart' or 'arrival' properties exist in the response
    if (data.routes[0].depart || data.routes[0].arrival) {
      return true;
    }

    // 2. Check for any traffic-related metadata
    if (data.metadata && data.metadata.traffic) {
      return true;
    }

    // 3. Check if any legs have time-related properties
    if (data.routes[0].legs && data.routes[0].legs.length > 0) {
      for (const leg of data.routes[0].legs) {
        if (leg.traffic || leg.departure_time || leg.arrival_time) {
          return true;
        }
      }
    }

    // 4. If the backend included a property indicating time-dependent
    if (data.time_dependent === true || data.traffic === true) {
      return true;
    }

    // No indicators found
    return false;
  } catch (error) {
    console.error("Error checking for time data:", error);
    return false;
  }
}

/**
 * Display route summary with enhanced time information
 */
function displayRouteSummary(route, isTimeBased = false) {
  if (!route) return;

  const distance = formatDistance(route.distance);
  const duration = formatDuration(route.duration);

  let summaryHtml = `
    <div class="route-stat">
      <i class="fa fa-road"></i>
      <span>Distance: <span class="route-stat-value">${distance}</span></span>
    </div>
    <div class="route-stat">
      <i class="fa fa-clock"></i>
      <span>Duration: <span class="route-stat-value">${duration}</span></span>
    </div>
  `;

  // Add average speed information
  if (route.distance && route.duration) {
    const avgSpeed = (route.distance / route.duration) * 3.6; // m/s to km/h
    summaryHtml += `
      <div class="route-stat">
        <i class="fa fa-tachometer-alt"></i>
        <span>Average Speed: <span class="route-stat-value">${Math.round(
          avgSpeed
        )} km/h</span></span>
      </div>
    `;
  }

  // Add departure and arrival time if time-based routing is used
  if (isTimeBased) {
    const departureTime = document.getElementById("departure-time").value;
    if (departureTime) {
      const departure = new Date(departureTime);
      const arrival = new Date(departure.getTime() + route.duration * 1000);

      // Format times
      const formatTimeOptions = {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        weekday: "short",
        day: "numeric",
        month: "short",
      };

      const departureStr = departure.toLocaleTimeString(
        "en-US",
        formatTimeOptions
      );
      const arrivalStr = arrival.toLocaleTimeString("en-US", formatTimeOptions);

      summaryHtml += `
        <div class="route-stat">
          <i class="fa fa-hourglass-start"></i>
          <span>Departure Time: <span class="route-stat-value">${departureStr}</span></span>
        </div>
        <div class="route-stat">
          <i class="fa fa-hourglass-end"></i>
          <span>Arrival Time: <span class="route-stat-value">${arrivalStr}</span></span>
        </div>
      `;
    }
  }

  document.getElementById("route-summary").innerHTML = summaryHtml;
}

/**
 * Display route steps details
 */
function displayRouteSteps(route) {
  if (!route || !route.legs || route.legs.length === 0) {
    document.getElementById("route-steps").innerHTML = "";
    return;
  }

  let stepsHtml = "";

  route.legs.forEach((leg) => {
    if (!leg.steps || leg.steps.length === 0) return;

    leg.steps.forEach((step) => {
      const instruction = getReadableInstruction(step.maneuver);
      const distance = formatDistance(step.distance);
      const duration = formatDuration(step.duration);
      const iconName = getTurnIcon(step.maneuver?.modifier || "straight");

      let stepHtml = `
        <div class="step-item">
          <div class="step-instruction">
            <div class="step-icon">
              <i class="fa fa-${iconName}"></i>
            </div>
            <div class="step-text">
              ${instruction} ${step.name ? "onto " + step.name : ""}
              <div class="step-distance">${distance} (${duration})`;

      // Add speed information if available
      if (step.distance && step.duration) {
        const stepSpeed = (step.distance / step.duration) * 3.6; // m/s to km/h
        stepHtml += ` <span style="color:#00cec9; font-weight:bold;">${Math.round(
          stepSpeed
        )} km/h</span>`;
      }

      stepHtml += `</div>
            </div>
          </div>
        </div>
      `;

      stepsHtml += stepHtml;
    });
  });

  document.getElementById("route-steps").innerHTML = stepsHtml;
}

/**
 * Clear route and waypoints
 */
function clearRouteAndWaypoints() {
  clearRoute();
  clearWaypoints();

  // Clear input fields
  document.getElementById("start-point").value = "";
  document.getElementById("end-point").value = "";

  // Clear via waypoints
  const viaPoints = document.querySelectorAll(".waypoint.via");
  viaPoints.forEach((point) => {
    removeWaypoint(point);
  });

  // Clear route info
  document.getElementById("route-summary").innerHTML =
    '<p class="no-route">No route is currently displayed.</p>';
  document.getElementById("route-steps").innerHTML = "";

  // Reset current route data
  currentRouteData = null;

  // Reset current routing URL
  currentRoutingUrl = "";
  updateRoutingUrlDisplay();

  // Reset waypoints list
  waypointsList = [];
}

/**
 * Clear start point
 */
function clearStartPoint() {
  document.getElementById("start-point").value = "";

  if (markerStart) {
    mapLayers.waypoints.removeLayer(markerStart);
    markerStart = null;
  }

  // Update waypoints list
  updateWaypointsList();
}

/**
 * Clear end point
 */
function clearEndPoint() {
  document.getElementById("end-point").value = "";

  if (markerEnd) {
    mapLayers.waypoints.removeLayer(markerEnd);
    markerEnd = null;
  }

  // Update waypoints list
  updateWaypointsList();
}

/**
 * Get current route data
 */
function getCurrentRouteData() {
  return currentRouteData;
}
