/**
 * Full routing module for OSRM Inspector with backend integration
 */

// Global routing state
window.currentRouteData = null;
window.currentRoutingUrl = "";
window.waypointsList = [];

/**
 * Initialize routing functionality
 */
async function initRouting() {
  console.log("Initializing routing...");

  try {
    // Setup route search button
    const findRouteBtn = document.getElementById("btn-find-route");
    if (findRouteBtn) {
      findRouteBtn.addEventListener("click", findRouteWithMultipleWaypoints);
    } else {
      console.warn("Find route button not found");
    }

    // Setup clear route button
    const clearRouteBtn = document.getElementById("btn-clear-route");
    if (clearRouteBtn) {
      clearRouteBtn.addEventListener("click", clearRouteAndWaypoints);
    } else {
      console.warn("Clear route button not found");
    }

    // Setup clear waypoint buttons
    const clearStartBtn = document.getElementById("btn-clear-start");
    if (clearStartBtn) {
      clearStartBtn.addEventListener("click", clearStartPoint);
    }

    const clearEndBtn = document.getElementById("btn-clear-end");
    if (clearEndBtn) {
      clearEndBtn.addEventListener("click", clearEndPoint);
    }

    // Initial profile setup
    await updateProfileDisplay();

    // Set up periodic profile updates
    setInterval(updateProfileDisplay, 30000); // 30 seconds

    // Setup time-dependent routing
    initTimeDependentRouting();

    // Add CURB toggle
    addCurbToggle();

    // Add auto-routing toggle
    addAutoRoutingToggle();

    console.log("Routing initialized successfully");
    return true;
  } catch (error) {
    console.error("Error initializing routing:", error);
    throw new Error("Routing initialization failed: " + error.message);
  }
}

/**
 * Add CURB parameter toggle
 */
function addCurbToggle() {
  // Create the CURB toggle element
  const curbContainer = document.createElement("div");
  curbContainer.className = "form-group curb-options";

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

  // Safely add to document
  const routeOptions = document.querySelector(".route-options");
  if (routeOptions) {
    routeOptions.appendChild(curbContainer);
  } else {
    console.warn("Route options container not found");
  }
}

/**
 * Add auto-routing toggle
 */
function addAutoRoutingToggle() {
  // Create the auto-routing toggle element
  const autoRouteContainer = document.createElement("div");
  autoRouteContainer.className = "form-group auto-route-options";

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

  // Safely add to document
  const routeOptions = document.querySelector(".route-options");
  if (routeOptions) {
    // Get action buttons container
    const actionButtons = document.querySelector(".action-buttons");

    if (actionButtons && routeOptions.contains(actionButtons)) {
      // insertBefore is safer if the element exists
      routeOptions.insertBefore(autoRouteContainer, actionButtons);
    } else {
      // Just append to routeOptions if actionButtons not found
      routeOptions.appendChild(autoRouteContainer);
    }
  } else {
    console.warn("Route options container not found");
  }
}

/**
 * Add time picker UI for time-dependent routing
 */
function initTimeDependentRouting() {
  const routeOptions = document.querySelector(".route-options");
  if (!routeOptions) return;

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

  document.querySelector(".time-toggle .toggle-label").appendChild(infoIcon);
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

  const timePicker = document.getElementById("departure-time");
  if (timePicker) {
    timePicker.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    console.log(`Set departure time to current time: ${now.toLocaleString()}`);
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

    if (!profileContainer && profileElement) {
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
    } else if (profileContainer) {
      // Update existing display
      const profileDisplay = document.getElementById("profile-display");
      if (profileDisplay) {
        profileDisplay.textContent = currentProfile;
      }
    }

    // Store the profile value as a data attribute for later use
    if (profileContainer) {
      profileContainer.dataset.profile = currentProfile;
    }

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

    if (!algorithmContainer && algorithmElement) {
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
    } else if (algorithmContainer) {
      // Update existing display
      const algorithmDisplay = document.getElementById("algorithm-display");
      if (algorithmDisplay) {
        algorithmDisplay.textContent = currentAlgorithm.toUpperCase();
      }
    }

    // Store algorithm value as data attribute
    if (algorithmContainer) {
      algorithmContainer.dataset.algorithm = currentAlgorithm;
    }

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
      const profiles = ["van_scpa", "van_2022", "driving", "car"];

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

    console.log("Falling back to default profile: driving");
    // Final fallback
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
 * Update waypoints list from input fields
 */
function updateWaypointsList() {
  // Empty the array first
  window.waypointsList = [];

  // Always start with the start point if it exists
  const startPointInput = document.getElementById("start-point");
  if (startPointInput && startPointInput.value) {
    window.waypointsList.push(startPointInput.value);
  }

  // Add all via points in order
  const viaPoints = document.querySelectorAll(".waypoint.via .waypoint-input");
  viaPoints.forEach((input) => {
    if (input.value) {
      window.waypointsList.push(input.value);
    }
  });

  // Add end point if it exists
  const endPointInput = document.getElementById("end-point");
  if (endPointInput && endPointInput.value) {
    window.waypointsList.push(endPointInput.value);
  }

  console.log("Updated waypoints list:", window.waypointsList);
  return window.waypointsList;
}

/**
 * Find route with multiple waypoints
 */
async function findRouteWithMultipleWaypoints() {
  // Update waypoints list first
  updateWaypointsList();

  if (window.waypointsList.length < 2) {
    showNotification(
      "warning",
      "Please specify at least a start and end point"
    );
    return;
  }

  // Show loading indicator
  if (typeof FormatUtils !== "undefined" && FormatUtils.showLoading) {
    FormatUtils.showLoading();
  }

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
    const waypointsString = window.waypointsList.join(";");

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
    window.currentRoutingUrl = url;

    // Make the request
    const response = await fetch(url);

    // If the first profile fails, try alternatives
    if (!response.ok && response.status === 400) {
      console.log(`Profile ${profile} request failed, trying alternatives`);

      // Try alternative profiles
      const alternativeProfiles = ["van_scpa", "van_2022", "driving", "car"];

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
          if (profileDisplay && profileContainer) {
            profileDisplay.textContent = altProfile;
            profileContainer.dataset.profile = altProfile;
          }

          // Store the successful routing URL
          window.currentRoutingUrl = fullAltUrl;

          const data = await altResponse.json();

          if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
            throw new Error("Route not found");
          }

          // Process the successful response
          processRouteResponse(data, altProfile);

          if (typeof FormatUtils !== "undefined" && FormatUtils.hideLoading) {
            FormatUtils.hideLoading();
          }
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

    // Process the response
    processRouteResponse(data, profile);
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("route-summary").innerHTML = `
      <p class="error-message">Error: ${error.message}</p>
    `;
    document.getElementById("route-steps").innerHTML = "";

    showNotification("error", `Routing error: ${error.message}`);
  } finally {
    if (typeof FormatUtils !== "undefined" && FormatUtils.hideLoading) {
      FormatUtils.hideLoading();
    }
  }
}

/**
 * Process route response data
 */
function processRouteResponse(data, profile) {
  // Save current route data
  window.currentRouteData = data;

  // Display route on map
  if (typeof displayRoute === "function") {
    displayRoute(data, profile);
  }

  // Update route info panels
  displayRouteSummary(data.routes[0]);
  displayRouteSteps(data.routes[0]);

  // Update numbered markers with time estimates
  if (typeof updateNumberedMarkersWithRouteData === "function") {
    updateNumberedMarkersWithRouteData(data);
  }

  // Check for time-dependent routing warning
  const timeEnabled =
    document.getElementById("enable-time-routing") &&
    document.getElementById("enable-time-routing").checked;

  if (timeEnabled) {
    // Look for specific indicators in the response that time-dependent routing was used
    const hasTimeData = checkForTimeData(data);

    if (!hasTimeData) {
      console.warn(
        "Time-dependent routing was requested but the OSRM backend may not support it"
      );

      // Show a warning to the user
      showNotification(
        "warning",
        "Time-dependent routing was requested, but the server may not have traffic data loaded."
      );
    }
  }
}

/**
 * Check if the response contains time-dependent data
 */
function checkForTimeData(data) {
  try {
    // Check different indicators that might suggest time-data is being used
    if (data.routes[0].depart || data.routes[0].arrival) {
      return true;
    }

    // Check for any traffic-related metadata
    if (data.metadata && data.metadata.traffic) {
      return true;
    }

    // Check if any legs have time-related properties
    if (data.routes[0].legs && data.routes[0].legs.length > 0) {
      for (const leg of data.routes[0].legs) {
        if (leg.traffic || leg.departure_time || leg.arrival_time) {
          return true;
        }
      }
    }

    // If the backend included a property indicating time-dependent
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
 * Display route summary with time information
 */
function displayRouteSummary(route) {
  if (!route) return;

  const distance = FormatUtils
    ? FormatUtils.formatDistance(route.distance)
    : route.distance < 1000
    ? Math.round(route.distance) + " m"
    : (route.distance / 1000).toFixed(2) + " km";

  const duration = FormatUtils
    ? FormatUtils.formatDuration(route.duration)
    : route.duration < 60
    ? Math.round(route.duration) + " sec"
    : route.duration < 3600
    ? Math.floor(route.duration / 60) +
      " min " +
      Math.round(route.duration % 60) +
      " sec"
    : Math.floor(route.duration / 3600) +
      " hour " +
      Math.floor((route.duration % 3600) / 60) +
      " min";

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
        <i class="fa fa-gauge-high"></i>
        <span>Average Speed: <span class="route-stat-value">${Math.round(
          avgSpeed
        )} km/h</span></span>
      </div>
    `;
  }

  // Add departure and arrival time if time-based routing is used
  const timeEnabled =
    document.getElementById("enable-time-routing") &&
    document.getElementById("enable-time-routing").checked;

  if (timeEnabled) {
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

  route.legs.forEach((leg, legIndex) => {
    if (!leg.steps || leg.steps.length === 0) return;

    // Add leg separator if not the first leg
    if (legIndex > 0) {
      stepsHtml += `
        <div class="leg-separator">
          <div class="leg-line"></div>
          <div class="leg-point">
            <i class="fa fa-map-pin"></i>
            <span>Waypoint ${legIndex + 1}</span>
          </div>
          <div class="leg-line"></div>
        </div>
      `;
    }

    leg.steps.forEach((step) => {
      const instruction =
        FormatUtils && FormatUtils.getReadableInstruction
          ? FormatUtils.getReadableInstruction(step.maneuver)
          : getBasicInstruction(step.maneuver);

      const distance = FormatUtils
        ? FormatUtils.formatDistance(step.distance)
        : step.distance < 1000
        ? Math.round(step.distance) + " m"
        : (step.distance / 1000).toFixed(2) + " km";

      const duration = FormatUtils
        ? FormatUtils.formatDuration(step.duration)
        : step.duration < 60
        ? Math.round(step.duration) + " sec"
        : Math.floor(step.duration / 60) +
          " min " +
          Math.round(step.duration % 60) +
          " sec";

      const iconName =
        FormatUtils && FormatUtils.getTurnIcon
          ? FormatUtils.getTurnIcon(step.maneuver?.modifier || "straight")
          : "arrow-up";

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
 * Basic instruction formatter if FormatUtils is not available
 */
function getBasicInstruction(maneuver) {
  if (!maneuver) return "Continue";

  const type = maneuver.type || "";
  const modifier = maneuver.modifier || "";

  // Simple mapping
  const typeMap = {
    turn: "Turn",
    "new name": "Continue onto",
    depart: "Start from",
    arrive: "Arrive at",
    merge: "Merge",
    "on ramp": "Take the ramp",
    "off ramp": "Take the exit",
    fork: "Take the fork",
    "end of road": "At the end of the road",
    continue: "Continue",
    roundabout: "Enter the roundabout",
    rotary: "Enter the rotary",
  };

  const modifierMap = {
    straight: "straight",
    "slight right": "slightly right",
    right: "right",
    "sharp right": "sharp right",
    uturn: "U-turn",
    "sharp left": "sharp left",
    left: "left",
    "slight left": "slightly left",
  };

  let instruction = typeMap[type] || "Continue";

  if (modifier && modifierMap[modifier.toLowerCase()]) {
    instruction += " " + modifierMap[modifier.toLowerCase()];
  }

  return instruction;
}

/**
 * Clear route and waypoints
 */
function clearRouteAndWaypoints() {
  // Clear route display
  if (typeof clearRoute === "function") {
    clearRoute();
  }

  // Clear waypoint markers
  if (typeof clearWaypoints === "function") {
    clearWaypoints();
  }

  // Clear numbered markers
  if (typeof clearNumberedMarkers === "function") {
    clearNumberedMarkers();
  }

  // Clear input fields
  document.getElementById("start-point").value = "";
  document.getElementById("end-point").value = "";

  // Clear via waypoints
  const viaPoints = document.querySelectorAll(".waypoint.via");
  viaPoints.forEach((point) => {
    if (typeof removeWaypoint === "function") {
      removeWaypoint(point);
    } else if (point.parentNode) {
      point.parentNode.removeChild(point);
    }
  });

  // Clear route info
  document.getElementById("route-summary").innerHTML =
    '<p class="no-route">No route is currently displayed.</p>';
  document.getElementById("route-steps").innerHTML = "";

  // Reset current route data
  window.currentRouteData = null;
  window.currentRoutingUrl = "";

  // Reset waypoints list
  window.waypointsList = [];

  // Show notification
  if (typeof showNotification === "function") {
    showNotification("info", "Route cleared");
  }
}

/**
 * Clear start point
 */
function clearStartPoint() {
  document.getElementById("start-point").value = "";

  // Remove standard marker
  if (
    window.waypointMarkers &&
    window.waypointMarkers.start &&
    typeof clearWaypoints === "function"
  ) {
    if (window.mapLayers && window.mapLayers.waypoints) {
      window.mapLayers.waypoints.removeLayer(window.waypointMarkers.start);
    }
    window.waypointMarkers.start = null;
  }

  // Remove numbered marker
  if (typeof window.numberedMarkers !== "undefined") {
    const marker = window.numberedMarkers.find((m) => m.markerNumber === 1);
    if (marker && window.map) {
      window.map.removeLayer(marker);
      window.numberedMarkers = window.numberedMarkers.filter(
        (m) => m !== marker
      );
    }
  }

  // Update waypoints list
  updateWaypointsList();

  // Auto-route if enabled
  const autoRouteToggle = document.getElementById("auto-route-toggle");
  if (
    autoRouteToggle &&
    autoRouteToggle.checked &&
    window.waypointsList.length >= 2
  ) {
    findRouteWithMultipleWaypoints();
  }
}

/**
 * Clear end point
 */
function clearEndPoint() {
  document.getElementById("end-point").value = "";

  // Remove standard marker
  if (
    window.waypointMarkers &&
    window.waypointMarkers.end &&
    typeof clearWaypoints === "function"
  ) {
    if (window.mapLayers && window.mapLayers.waypoints) {
      window.mapLayers.waypoints.removeLayer(window.waypointMarkers.end);
    }
    window.waypointMarkers.end = null;
  }

  // Remove numbered marker
  if (typeof window.numberedMarkers !== "undefined") {
    // Find the last marker (assuming it's the end point)
    const endIndex = window.numberedMarkers.length;
    const marker = window.numberedMarkers.find(
      (m) => m.markerNumber === endIndex
    );
    if (marker && window.map) {
      window.map.removeLayer(marker);
      window.numberedMarkers = window.numberedMarkers.filter(
        (m) => m !== marker
      );
    }
  }

  // Update waypoints list
  updateWaypointsList();

  // Auto-route if enabled
  const autoRouteToggle = document.getElementById("auto-route-toggle");
  if (
    autoRouteToggle &&
    autoRouteToggle.checked &&
    window.waypointsList.length >= 2
  ) {
    findRouteWithMultipleWaypoints();
  }
}

/**
 * Get current route data
 */
function getCurrentRouteData() {
  return window.currentRouteData;
}

// Show notification function if not already defined
if (typeof showNotification !== "function") {
  window.showNotification = function (type, message, duration = 3000) {
    console.log(`[${type}] ${message}`);

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

    // Add animation styles if they don't exist
    if (!document.querySelector("style#notification-styles")) {
      const style = document.createElement("style");
      style.id = "notification-styles";
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
    }

    // Remove after duration
    setTimeout(() => {
      notification.style.animation = "fadeOut 0.3s forwards";
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, duration);
  };
}

// Export functions to global scope
window.initRouting = initRouting;
window.findRouteWithMultipleWaypoints = findRouteWithMultipleWaypoints;
window.clearRouteAndWaypoints = clearRouteAndWaypoints;
window.clearStartPoint = clearStartPoint;
window.clearEndPoint = clearEndPoint;
window.updateWaypointsList = updateWaypointsList;
window.getCurrentRouteData = getCurrentRouteData;
window.showNotification = window.showNotification || showNotification;
