/**
 * Enhanced numbered markers implementation for OSRM Inspector
 * Adds custom numbered markers with time estimates
 */

// Store all numbered markers
window.numberedMarkers = [];

/**
 * Initialize numbered markers functionality
 */
function initNumberedMarkers() {
  console.log("Initializing numbered markers...");

  // Clear any existing markers
  clearNumberedMarkers();

  // Add styles for numbered markers if not already added
  addNumberedMarkerStyles();

  // Add click handler to map
  if (window.map) {
    window.map.on("click", function (e) {
      // Handle only if not in specific input mode
      if (
        !window.waypointState ||
        window.waypointState.clickMode !== "specific"
      ) {
        addNumberedMarker(e.latlng);
      }
    });
  } else {
    console.error(
      "Map not initialized, can't add numbered markers click handler"
    );
  }

  console.log("Numbered markers initialized");
  return true;
}

/**
 * Add a numbered marker at the specified location
 */
function addNumberedMarker(latlng, options = {}) {
  console.log("Adding numbered marker at:", latlng);

  // Default options
  const defaults = {
    number: window.numberedMarkers.length + 1,
    departureTime: null,
    arrivalTime: null,
    draggable: true,
    clickable: true,
  };

  // Merge defaults with provided options
  const settings = { ...defaults, ...options };

  // Create custom HTML content for marker
  const markerHtml = createMarkerHtml(
    settings.number,
    settings.departureTime,
    settings.arrivalTime
  );

  // Create custom icon
  const customIcon = L.divIcon({
    className: "numbered-marker-icon",
    html: markerHtml,
    iconSize: [36, 42],
    iconAnchor: [18, 42],
    popupAnchor: [0, -42],
  });

  // Create marker
  const marker = L.marker(latlng, {
    icon: customIcon,
    draggable: settings.draggable,
    zIndexOffset: 1000 + settings.number,
  });

  // Add marker to map
  if (window.map) {
    marker.addTo(window.map);
  } else {
    console.error("Map not available, can't add marker");
    return null;
  }

  // Store marker number
  marker.markerNumber = settings.number;

  // Add drag event
  marker.on("dragend", function (event) {
    const marker = event.target;
    const position = marker.getLatLng();
    updateWaypointFromMarker(marker.markerNumber, position);
  });

  // Add click event
  marker.on("click", function (event) {
    const marker = event.target;
    // Highlight the corresponding waypoint input
    highlightWaypointInput(marker.markerNumber);
  });

  // Store marker reference
  window.numberedMarkers.push(marker);

  // Update corresponding waypoint
  updateWaypointFromMarker(settings.number, latlng);

  return marker;
}

/**
 * Create HTML for numbered marker with time estimates
 */
function createMarkerHtml(number, departureTime, arrivalTime) {
  let timeHtml = "";

  if (departureTime || arrivalTime) {
    timeHtml = '<div class="time-estimates">';

    if (departureTime) {
      // Format departure time as HH:MM
      const depTime =
        typeof departureTime === "string"
          ? departureTime
          : departureTime instanceof Date
          ? formatTimeHHMM(departureTime)
          : "";

      timeHtml += `<div class="departure-time" title="Departure Time">${depTime}</div>`;
    }

    if (arrivalTime) {
      // Format arrival time as HH:MM
      const arrTime =
        typeof arrivalTime === "string"
          ? arrivalTime
          : arrivalTime instanceof Date
          ? formatTimeHHMM(arrivalTime)
          : "";

      timeHtml += `<div class="arrival-time" title="Arrival Time">${arrTime}</div>`;
    }

    timeHtml += "</div>";
  }

  return `
    <div class="marker-container">
      <div class="marker-number">${number}</div>
      ${timeHtml}
    </div>
  `;
}

/**
 * Format time as HH:MM
 */
function formatTimeHHMM(date) {
  if (!date) return "";

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${hours}:${minutes}`;
}

/**
 * Update numbered marker content (e.g., after route calculation)
 */
function updateNumberedMarker(number, options = {}) {
  // Find marker by number
  const marker = window.numberedMarkers.find((m) => m.markerNumber === number);
  if (!marker) return null;

  // Update icon with new content
  const markerHtml = createMarkerHtml(
    number,
    options.departureTime || null,
    options.arrivalTime || null
  );

  const newIcon = L.divIcon({
    className: "numbered-marker-icon",
    html: markerHtml,
    iconSize: [36, 42],
    iconAnchor: [18, 42],
    popupAnchor: [0, -42],
  });

  marker.setIcon(newIcon);

  return marker;
}

/**
 * Update waypoint input from marker
 */
function updateWaypointFromMarker(number, latlng) {
  // Convert to OSRM format
  const osrmFormat = [latlng.lng, latlng.lat];
  const coordString =
    typeof FormatUtils !== "undefined" && FormatUtils.formatCoordinateString
      ? FormatUtils.formatCoordinateString(osrmFormat)
      : `${osrmFormat[0].toFixed(6)},${osrmFormat[1].toFixed(6)}`;

  // Update corresponding input
  const inputs = document.querySelectorAll(".waypoint-input");

  // Adjust for 1-based numbering (markers start at 1, inputs at 0)
  const inputIndex = number - 1;
  if (inputIndex >= 0 && inputIndex < inputs.length) {
    inputs[inputIndex].value = coordString;

    // Update waypoints list
    if (typeof updateWaypointsList === "function") {
      updateWaypointsList();
    } else {
      console.warn("updateWaypointsList function not available");
    }

    // Auto-route if enabled
    const autoRouteToggle = document.getElementById("auto-route-toggle");
    if (
      autoRouteToggle &&
      autoRouteToggle.checked &&
      typeof findRouteWithMultipleWaypoints === "function"
    ) {
      findRouteWithMultipleWaypoints();
    }
  } else {
    console.warn(`No input found for marker ${number} (index ${inputIndex})`);

    // If no input exists, we might need to add more waypoints
    // Make sure we have enough waypoint inputs
    if (inputIndex >= inputs.length) {
      ensureWaypointInputsExist(number);
    }
  }
}

/**
 * Ensure there are enough waypoint inputs for the given marker number
 */
function ensureWaypointInputsExist(markerNumber) {
  // Get current number of inputs
  const inputs = document.querySelectorAll(".waypoint-input");

  // Check if we need to add more waypoints
  if (markerNumber > inputs.length) {
    console.log(
      `Need to add waypoints for marker ${markerNumber}, current inputs: ${inputs.length}`
    );

    // Update waypoint count slider if available
    const waypointCountSlider = document.getElementById("waypoint-count");
    if (waypointCountSlider) {
      waypointCountSlider.value = Math.min(10, markerNumber);
      const valueDisplay = document.getElementById("waypoint-count-value");
      if (valueDisplay) {
        valueDisplay.textContent = Math.min(10, markerNumber);
      }

      if (window.waypointState) {
        window.waypointState.maxWaypoints = Math.min(10, markerNumber);
      }

      // Update the UI to match
      if (typeof updateWaypointUI === "function") {
        updateWaypointUI(markerNumber);
      } else if (typeof addNewWaypoint === "function") {
        // Just add new waypoints until we have enough
        const neededWaypoints = markerNumber - inputs.length;

        for (let i = 0; i < neededWaypoints; i++) {
          addNewWaypoint();
        }
      } else {
        console.error(
          "Cannot add waypoints - neither updateWaypointUI nor addNewWaypoint functions available"
        );
      }
    } else {
      console.warn(
        "Waypoint count slider not found, cannot update waypoint count"
      );
    }
  }
}

/**
 * Highlight the waypoint input corresponding to a marker
 */
function highlightWaypointInput(number) {
  // Remove any existing highlights
  document.querySelectorAll(".waypoint.highlighted").forEach((el) => {
    el.classList.remove("highlighted");
  });

  // Adjust for 1-based numbering
  const inputIndex = number - 1;
  const inputs = document.querySelectorAll(".waypoint-input");

  if (inputIndex >= 0 && inputIndex < inputs.length) {
    const input = inputs[inputIndex];
    const waypointContainer = input.closest(".waypoint");

    if (waypointContainer) {
      waypointContainer.classList.add("highlighted");

      // Scroll the input into view
      input.scrollIntoView({ behavior: "smooth", block: "center" });

      // Focus the input
      input.focus();

      // Remove highlight after a delay
      setTimeout(() => {
        waypointContainer.classList.remove("highlighted");
      }, 2000);
    }
  }
}

/**
 * Clear all numbered markers
 */
function clearNumberedMarkers() {
  // Remove each marker from the map
  if (window.numberedMarkers && window.numberedMarkers.length > 0) {
    window.numberedMarkers.forEach((marker) => {
      if (window.map && marker) {
        window.map.removeLayer(marker);
      }
    });
  }

  // Clear array
  window.numberedMarkers = [];
}

/**
 * Update numbered markers after route calculation
 */
function updateNumberedMarkersWithRouteData(routeData) {
  if (!routeData || !routeData.routes || routeData.routes.length === 0) {
    console.warn("No route data to update markers with");
    return;
  }

  const route = routeData.routes[0];

  // Initial departure time
  let departureTime = null;
  const departureTimeInput = document.getElementById("departure-time");
  if (departureTimeInput && departureTimeInput.value) {
    departureTime = new Date(departureTimeInput.value);
  }

  // Update first marker with departure time
  if (window.numberedMarkers.length > 0 && departureTime) {
    updateNumberedMarker(1, { departureTime: departureTime });
  }

  // If route has legs, use them to calculate arrival times
  if (route.legs && route.legs.length > 0) {
    let currentTime = departureTime ? new Date(departureTime) : null;

    route.legs.forEach((leg, index) => {
      if (!currentTime) return;

      // Add leg duration to current time
      currentTime = new Date(currentTime.getTime() + leg.duration * 1000);

      // Update marker with arrival time (index + 2 because first marker is already handled)
      if (index + 2 <= window.numberedMarkers.length) {
        updateNumberedMarker(index + 2, { arrivalTime: currentTime });

        // Also set as departure time for next leg (if not the last one)
        if (index + 2 < window.numberedMarkers.length) {
          updateNumberedMarker(index + 2, {
            arrivalTime: currentTime,
            departureTime: currentTime,
          });
        }
      }
    });
  }
}

/**
 * Add CSS for numbered markers
 */
function addNumberedMarkerStyles() {
  // Check if styles already exist
  if (document.getElementById("numbered-marker-styles")) return;

  // Create style element
  const style = document.createElement("style");
  style.id = "numbered-marker-styles";
  style.innerHTML = `
    .numbered-marker-icon {
      background: transparent;
      border: none;
    }
    
    .marker-container {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .marker-number {
      background-color: #3498db;
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      border: 2px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      z-index: 1000;
    }
    
    .marker-number::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-top: 8px solid #3498db;
    }
    
    .time-estimates {
      position: absolute;
      top: 28px;
      background-color: white;
      border-radius: 4px;
      font-size: 10px;
      padding: 2px 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      max-width: 80px;
      text-align: center;
      white-space: nowrap;
    }
    
    .departure-time {
      color: #27ae60;
      font-weight: bold;
    }
    
    .arrival-time {
      color: #e74c3c;
      font-weight: bold;
    }
    
    .waypoint.highlighted {
      background-color: #f5f5dc;
      box-shadow: 0 0 8px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
    }
  `;

  // Add to document
  document.head.appendChild(style);
}

// Export functions to global scope
window.initNumberedMarkers = initNumberedMarkers;
window.addNumberedMarker = addNumberedMarker;
window.updateNumberedMarker = updateNumberedMarker;
window.clearNumberedMarkers = clearNumberedMarkers;
window.updateNumberedMarkersWithRouteData = updateNumberedMarkersWithRouteData;
