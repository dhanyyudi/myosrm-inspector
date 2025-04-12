/**
 * Format utilities for OSRM Inspector
 * This module provides formatting functions for various data types
 */

// Create a namespace for formatting utilities
const FormatUtils = {};

/**
 * Format time from seconds to minutes and hours format
 *
 * @param {number} seconds - Duration in seconds
 * @return {string} Formatted time string
 */
FormatUtils.formatDuration = function (seconds) {
  if (seconds < 60) {
    return Math.round(seconds) + " seconds";
  } else if (seconds < 3600) {
    return (
      Math.floor(seconds / 60) +
      " minutes " +
      Math.round(seconds % 60) +
      " seconds"
    );
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.round(seconds % 60);

    let result = hours + " hour" + (hours > 1 ? "s" : "");

    if (minutes > 0 || secs > 0) {
      result += " " + minutes + " minute" + (minutes > 1 ? "s" : "");
    }

    if (secs > 0) {
      result += " " + secs + " second" + (secs > 1 ? "s" : "");
    }

    return result;
  }
};

/**
 * Format distance from meters to more readable format
 *
 * @param {number} meters - Distance in meters
 * @return {string} Formatted distance string
 */
FormatUtils.formatDistance = function (meters) {
  if (meters < 1000) {
    return Math.round(meters) + " m";
  } else {
    return (meters / 1000).toFixed(2) + " km";
  }
};

/**
 * Format coordinate from float to string with fixed precision
 *
 * @param {number} coord - Coordinate value
 * @param {number} precision - Decimal precision (default: 6)
 * @return {string} Formatted coordinate
 */
FormatUtils.formatCoordinate = function (coord, precision = 6) {
  return coord.toFixed(precision);
};

/**
 * Format coordinates from [lng, lat] to string "lng,lat"
 *
 * @param {Array} lngLat - Coordinates [longitude, latitude]
 * @param {number} precision - Decimal precision (default: 6)
 * @return {string} Formatted coordinate string
 */
FormatUtils.formatCoordinateString = function (lngLat, precision = 6) {
  return (
    FormatUtils.formatCoordinate(lngLat[0], precision) +
    "," +
    FormatUtils.formatCoordinate(lngLat[1], precision)
  );
};

/**
 * Parse coordinates from string "lng,lat" to array [lng, lat]
 *
 * @param {string} coordString - Coordinate string "lng,lat"
 * @return {Array|null} Array [lng, lat] or null if invalid
 */
FormatUtils.parseCoordinateString = function (coordString) {
  if (!coordString) return null;

  const parts = coordString.split(",").map((part) => part.trim());
  if (parts.length !== 2) return null;

  const lng = parseFloat(parts[0]);
  const lat = parseFloat(parts[1]);

  if (isNaN(lng) || isNaN(lat)) return null;

  return [lng, lat];
};

/**
 * Convert from [lng, lat] format to [lat, lng] for Leaflet
 *
 * @param {Array} coord - Coordinates [longitude, latitude]
 * @return {Array} Leaflet coordinates [latitude, longitude]
 */
FormatUtils.toLeafletCoordinates = function (coord) {
  return [coord[1], coord[0]];
};

/**
 * Convert from [lat, lng] format to [lng, lat] for OSRM API
 *
 * @param {Array} coord - Leaflet coordinates [latitude, longitude]
 * @return {Array} OSRM coordinates [longitude, latitude]
 */
FormatUtils.toOsrmCoordinates = function (coord) {
  return [coord[1], coord[0]];
};

/**
 * Get icon for turn instructions
 *
 * @param {string} modifier - Turn modifier
 * @return {string} Font Awesome icon name
 */
FormatUtils.getTurnIcon = function (modifier) {
  const icons = {
    straight: "arrow-up",
    "slight right": "arrow-up-right",
    right: "arrow-right",
    "sharp right": "arrow-alt-circle-right",
    uturn: "rotate-right",
    "sharp left": "arrow-alt-circle-left",
    left: "arrow-left",
    "slight left": "arrow-up-left",
    arrive: "flag-checkered",
    depart: "location-dot",
    roundabout: "rotate-right",
    rotary: "sync",
    "roundabout turn": "rotate-left",
    "exit roundabout": "right-from-bracket",
    "exit rotary": "door-open",
    "use lane": "road",
  };

  return icons[modifier.toLowerCase()] || "arrow-up";
};

/**
 * Get readable navigation instructions
 *
 * @param {Object} maneuver - Maneuver object
 * @return {string} Human-readable instruction
 */
FormatUtils.getReadableInstruction = function (maneuver) {
  if (!maneuver) return "Continue";

  const type = maneuver.type || "";
  const modifier = maneuver.modifier || "";

  // Mapping for instructions in English
  const typeInstructions = {
    turn: "Turn",
    "new name": "Continue onto",
    depart: "Start from",
    arrive: "Arrive at",
    merge: "Merge",
    "on ramp": "Take the ramp onto",
    "off ramp": "Take the exit",
    fork: "Take the fork",
    "end of road": "At the end of the road",
    continue: "Continue",
    roundabout: "Enter the roundabout",
    rotary: "Enter the rotary",
    "roundabout turn": "At the roundabout, take",
    "exit roundabout": "Exit the roundabout",
    "exit rotary": "Exit the rotary",
    "use lane": "Use the lane",
  };

  const modifierInstructions = {
    straight: "straight",
    "slight right": "slightly right",
    right: "right",
    "sharp right": "sharp right",
    uturn: "U-turn",
    "sharp left": "sharp left",
    left: "left",
    "slight left": "slightly left",
  };

  let instruction = typeInstructions[type] || "Continue";

  if (modifier && modifierInstructions[modifier.toLowerCase()]) {
    instruction += " " + modifierInstructions[modifier.toLowerCase()];
  }

  return instruction;
};

/**
 * Generate URL for OSRM request
 *
 * @param {string} profile - Routing profile
 * @param {Array} coordinates - Array of coordinate strings
 * @param {Object} options - Additional options
 * @return {string} OSRM API request URL
 */
FormatUtils.generateOsrmRequestUrl = function (
  profile,
  coordinates,
  options = {}
) {
  const {
    algorithm = "mld",
    alternatives = false,
    steps = true,
    annotations = true,
    geometries = "geojson",
    overview = "full",
    curb = false,
    departureTime = null,
  } = options;

  let url = `${CONFIG.osrmBackendUrl}/route/v1/${profile}/`;

  // Format coordinates
  url += coordinates.join(";");

  // Add query parameters
  const params = new URLSearchParams({
    algorithms: algorithm,
    alternatives: alternatives,
    steps: steps,
    annotations: annotations,
    geometries: geometries,
    overview: overview,
  });

  // Add CURB parameter if enabled
  if (curb) {
    params.append("curb", "true");
  }

  // Add departure time parameter if provided
  if (departureTime) {
    params.append("depart", Math.floor(departureTime.getTime() / 1000));
  }

  return `${url}?${params.toString()}`;
};

/**
 * Parse OSRM API URL to extract routing parameters
 *
 * @param {string} url - OSRM API URL
 * @return {Object} Parsed parameters object
 */
FormatUtils.parseOsrmUrl = function (url) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");

    // Find profile and coordinates in the URL
    let profile, coordinates;

    for (let i = 0; i < pathParts.length; i++) {
      if (
        pathParts[i] === "route" ||
        pathParts[i] === "trip" ||
        pathParts[i] === "match"
      ) {
        if (i + 3 < pathParts.length) {
          profile = pathParts[i + 2];
          coordinates = pathParts[i + 3].split(";");
          break;
        }
      }
    }

    if (!profile || !coordinates) {
      throw new Error("Could not find profile or coordinates in URL");
    }

    // Extract query parameters
    const params = new URLSearchParams(urlObj.search);

    return {
      profile,
      coordinates,
      curb: params.get("curb") === "true",
      departureTime: params.has("depart")
        ? new Date(parseInt(params.get("depart")) * 1000)
        : null,
      alternatives: params.get("alternatives") === "true",
      steps: params.get("steps") !== "false",
      annotations: params.get("annotations") !== "false",
      geometries: params.get("geometries") || "geojson",
      overview: params.get("overview") || "full",
    };
  } catch (error) {
    console.error("Error parsing OSRM URL:", error);
    throw new Error(`Invalid OSRM URL: ${error.message}`);
  }
};

/**
 * Create debounce function for performance optimization
 *
 * @param {Function} func - Function to debounce
 * @param {number} wait - Debounce wait time in milliseconds
 * @return {Function} Debounced function
 */
FormatUtils.debounce = function (func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Create throttle function for performance optimization
 *
 * @param {Function} func - Function to throttle
 * @param {number} limit - Throttle limit time in milliseconds
 * @return {Function} Throttled function
 */
FormatUtils.throttle = function (func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * Show loading indicator
 */
FormatUtils.showLoading = function () {
  document.getElementById("loading-indicator").classList.add("active");
};

/**
 * Hide loading indicator
 */
FormatUtils.hideLoading = function () {
  document.getElementById("loading-indicator").classList.remove("active");
};

/**
 * Generate random color for debug visualization
 *
 * @return {string} Random color in hex format
 */
FormatUtils.getRandomColor = function () {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// Make FormatUtils globally available
window.FormatUtils = FormatUtils;
