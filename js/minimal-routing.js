/**
 * Minimal routing module for OSRM Inspector
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
      findRouteBtn.addEventListener("click", function () {
        if (typeof findRouteWithMultipleWaypoints === "function") {
          findRouteWithMultipleWaypoints();
        } else {
          console.error(
            "findRouteWithMultipleWaypoints function not available"
          );
        }
      });
    } else {
      console.warn("Find route button not found");
    }

    // Setup clear route button
    const clearRouteBtn = document.getElementById("btn-clear-route");
    if (clearRouteBtn) {
      clearRouteBtn.addEventListener("click", function () {
        if (typeof clearRouteAndWaypoints === "function") {
          clearRouteAndWaypoints();
        } else {
          console.error("clearRouteAndWaypoints function not available");
        }
      });
    } else {
      console.warn("Clear route button not found");
    }

    // Safely add UI elements
    try {
      // Add CURB toggle
      addCurbToggle();

      // Add auto-routing toggle
      addAutoRoutingToggle();
    } catch (uiError) {
      console.warn("Error adding UI elements:", uiError.message);
    }

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
 * Get current route data
 */
function getCurrentRouteData() {
  return window.currentRouteData;
}

/**
 * Dummy findRoute function
 */
function findRouteWithMultipleWaypoints() {
  console.log(
    "findRouteWithMultipleWaypoints called - placeholder implementation"
  );
  if (typeof showNotification === "function") {
    showNotification("info", "Routing functionality is in minimal mode");
  } else {
    alert(
      "Routing functionality is in minimal mode. Full implementation not available."
    );
  }
}

/**
 * Clear route and waypoints
 */
function clearRouteAndWaypoints() {
  console.log("clearRouteAndWaypoints called - placeholder implementation");
  if (window.clearRoute) window.clearRoute();
  if (window.clearWaypoints) window.clearWaypoints();
}

/**
 * Update waypoints list
 */
function updateWaypointsList() {
  window.waypointsList = [];

  const startPoint = document.getElementById("start-point");
  if (startPoint && startPoint.value) {
    window.waypointsList.push(startPoint.value);
  }

  const viaPoints = document.querySelectorAll(".waypoint.via .waypoint-input");
  viaPoints.forEach((input) => {
    if (input.value) {
      window.waypointsList.push(input.value);
    }
  });

  const endPoint = document.getElementById("end-point");
  if (endPoint && endPoint.value) {
    window.waypointsList.push(endPoint.value);
  }

  console.log("Updated waypoints list:", window.waypointsList);
  return window.waypointsList;
}

// Export functions to global scope
window.initRouting = initRouting;
window.findRouteWithMultipleWaypoints = findRouteWithMultipleWaypoints;
window.clearRouteAndWaypoints = clearRouteAndWaypoints;
window.updateWaypointsList = updateWaypointsList;
window.getCurrentRouteData = getCurrentRouteData;
