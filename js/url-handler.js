/**
 * URL handler for OSRM Inspector
 * Implements copy URL and paste/render URL functionality
 */

// Current routing URL state
window.currentRoutingUrl = "";

/**
 * Initialize URL handler functionality
 */
function initUrlHandler() {
  console.log("Initializing URL handler...");

  try {
    // Add URL panel to interface
    addUrlPanel();

    // Set up event listeners
    setupUrlHandlerEvents();

    console.log("URL handler initialized successfully");
    return true;
  } catch (error) {
    console.error("Error initializing URL handler:", error);
    throw new Error("URL handler initialization failed: " + error.message);
  }
}

/**
 * Add URL panel to the interface
 */
function addUrlPanel() {
  // Create URL panel
  const urlPanel = document.createElement("div");
  urlPanel.className = "panel";
  urlPanel.id = "panel-url";

  // Add HTML for URL panel
  urlPanel.innerHTML = `
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
            <textarea id="routing-url-input" placeholder="Paste OSRM routing URL here..." class="form-control"></textarea>
            <button id="btn-render-url" class="btn btn-primary">
              <i class="fa fa-play"></i> Render Route
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add modal styles if not already in page
  addModalStyles();

  // Find where to add the panel
  const panelsContainer = document.querySelector(".panels-container");
  if (panelsContainer) {
    // Insert before the route info panel
    const resultsPanel = document.getElementById("panel-results");
    if (resultsPanel) {
      panelsContainer.insertBefore(urlPanel, resultsPanel);
    } else {
      // Just append it
      panelsContainer.appendChild(urlPanel);
    }
  } else {
    console.warn("Panels container not found, can't add URL panel");
  }
}

/**
 * Add modal styles if they don't exist
 */
function addModalStyles() {
  // Check if styles already exist
  if (document.getElementById("modal-styles")) return;

  // Create style element
  const style = document.createElement("style");
  style.id = "modal-styles";
  style.innerHTML = `
    .modal {
      display: none;
      position: fixed;
      z-index: 2000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
    }
    
    .modal-content {
      background-color: white;
      margin: 10% auto;
      padding: 0;
      border-radius: 8px;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
      width: 90%;
      max-width: 500px;
      overflow: hidden;
      animation: modalFadeIn 0.3s;
    }
    
    @keyframes modalFadeIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .modal-header {
      padding: 15px;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .modal-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
    
    .close-modal {
      font-size: 22px;
      color: #6c757d;
      cursor: pointer;
      transition: color 0.2s;
    }
    
    .close-modal:hover {
      color: #e74c3c;
    }
    
    .modal-body {
      padding: 15px;
    }
    
    .modal-body textarea {
      width: 100%;
      min-height: 100px;
      margin-bottom: 15px;
      padding: 10px;
    }
  `;

  // Add to document
  document.head.appendChild(style);
}

/**
 * Set up event listeners for URL handler
 */
function setupUrlHandlerEvents() {
  // Copy URL button
  const copyUrlBtn = document.getElementById("btn-copy-url");
  if (copyUrlBtn) {
    copyUrlBtn.addEventListener("click", copyRoutingUrl);
  }

  // Open URL modal button
  const openUrlModalBtn = document.getElementById("btn-open-url-modal");
  if (openUrlModalBtn) {
    openUrlModalBtn.addEventListener("click", openUrlModal);
  }

  // Render URL button
  const renderUrlBtn = document.getElementById("btn-render-url");
  if (renderUrlBtn) {
    renderUrlBtn.addEventListener("click", renderPastedUrl);
  }

  // Close modal handlers
  const closeModal = document.querySelector(".close-modal");
  if (closeModal) {
    closeModal.addEventListener("click", closeUrlModal);
  }

  // Close when clicking outside
  window.addEventListener("click", function (event) {
    const modal = document.getElementById("url-modal");
    if (event.target === modal) {
      closeUrlModal();
    }
  });
}

/**
 * Copy current routing URL to clipboard
 */
function copyRoutingUrl() {
  // Build URL if not available
  if (!window.currentRoutingUrl) {
    window.currentRoutingUrl = buildCurrentRoutingUrl();
  }

  if (!window.currentRoutingUrl) {
    showNotification(
      "warning",
      "No route is currently displayed. Please find a route first."
    );
    return;
  }

  // Create temporary textarea
  const tempTextArea = document.createElement("textarea");
  tempTextArea.value = window.currentRoutingUrl;
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

    showNotification("success", "Routing URL copied to clipboard");
  } catch (err) {
    console.error("Failed to copy URL:", err);
    showNotification("error", "Failed to copy URL to clipboard");
  }

  document.body.removeChild(tempTextArea);
}

/**
 * Build current routing URL based on waypoints and options
 */
function buildCurrentRoutingUrl() {
  // Check if we have waypoints
  const inputs = document.querySelectorAll(".waypoint-input");
  const waypoints = [];

  inputs.forEach((input) => {
    if (input.value) {
      waypoints.push(input.value);
    }
  });

  if (waypoints.length < 2) {
    return "";
  }

  // Get profile (using stored value or default)
  const profileContainer = document.querySelector(".form-group[data-profile]");
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

  // Build base URL
  const waypointsString = waypoints.join(";");
  let url = `${CONFIG.osrmBackendUrl}/route/v1/${profile}/${waypointsString}?overview=full&geometries=geojson&steps=true&annotations=true&alternatives=false`;

  // Check if CURB parameter is enabled
  const curbToggle = document.getElementById("curb-toggle");
  if (curbToggle && curbToggle.checked) {
    url += "&curb=true";
  }

  // Check if time-dependent routing is enabled
  const timeEnabled =
    document.getElementById("enable-time-routing") &&
    document.getElementById("enable-time-routing").checked;

  if (timeEnabled) {
    const departureTimeInput = document.getElementById("departure-time");
    if (departureTimeInput && departureTimeInput.value) {
      // Convert to Unix timestamp (seconds)
      const timestamp = Math.floor(
        new Date(departureTimeInput.value).getTime() / 1000
      );
      url += `&depart=${timestamp}`;
    }
  }

  return url;
}

/**
 * Open URL modal dialog
 */
function openUrlModal() {
  const modal = document.getElementById("url-modal");
  if (modal) {
    modal.style.display = "block";

    // Focus on textarea
    const textarea = document.getElementById("routing-url-input");
    if (textarea) {
      setTimeout(() => textarea.focus(), 100);
    }
  }
}

/**
 * Close URL modal dialog
 */
function closeUrlModal() {
  const modal = document.getElementById("url-modal");
  if (modal) {
    modal.style.display = "none";
  }
}

/**
 * Parse and render route from pasted URL
 */
function renderPastedUrl() {
  const urlInput = document.getElementById("routing-url-input");
  if (!urlInput || !urlInput.value.trim()) {
    showNotification("warning", "Please paste a valid OSRM routing URL");
    return;
  }

  try {
    // Parse the URL
    const urlString = urlInput.value.trim();
    const urlObj = new URL(urlString);

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

    // Parse coordinates
    const coords = coordinates.split(";");
    if (coords.length < 2) {
      throw new Error("URL must contain at least start and end coordinates");
    }

    // Clear existing waypoints
    if (typeof clearExistingWaypoints === "function") {
      clearExistingWaypoints();
    } else {
      // Fallback implementation
      document.querySelectorAll(".waypoint-input").forEach((input) => {
        input.value = "";
      });

      if (typeof clearWaypoints === "function") {
        clearWaypoints();
      }
    }

    // Set slider to waypoint count if available
    if (document.getElementById("waypoint-count")) {
      document.getElementById("waypoint-count").value = Math.min(
        10,
        coords.length
      );
      document.getElementById("waypoint-count-value").textContent = Math.min(
        10,
        coords.length
      );
      window.waypointState.maxWaypoints = Math.min(10, coords.length);

      // Update UI to match waypoint count
      if (typeof updateWaypointUI === "function") {
        updateWaypointUI(coords.length);
      }
    }

    // Fill coordinates into inputs
    if (typeof fillWaypointsFromArray === "function") {
      fillWaypointsFromArray(coords);
    } else {
      // Fallback implementation
      const inputs = document.querySelectorAll(".waypoint-input");
      for (let i = 0; i < Math.min(inputs.length, coords.length); i++) {
        inputs[i].value = coords[i];
      }
    }

    // Extract and set parameters
    const params = new URLSearchParams(urlObj.search);

    // Set CURB parameter if present
    const curbToggle = document.getElementById("curb-toggle");
    if (curbToggle) {
      curbToggle.checked = params.get("curb") === "true";
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
    if (typeof updateWaypointsList === "function") {
      updateWaypointsList();
    }

    // Find the route
    if (typeof findRouteWithMultipleWaypoints === "function") {
      findRouteWithMultipleWaypoints();
    } else {
      showNotification("warning", "Route finding function not available");
    }

    showNotification("success", "Route URL loaded successfully");
  } catch (error) {
    console.error("Error parsing URL:", error);
    showNotification("error", `Error parsing URL: ${error.message}`);
  }
}

// Export functions to global scope
window.initUrlHandler = initUrlHandler;
window.copyRoutingUrl = copyRoutingUrl;
window.openUrlModal = openUrlModal;
window.closeUrlModal = closeUrlModal;
window.renderPastedUrl = renderPastedUrl;
window.buildCurrentRoutingUrl = buildCurrentRoutingUrl;
