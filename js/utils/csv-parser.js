/**
 * CSV/TXT parser for OSRM Inspector with lat,lon and lon,lat format support
 * This module handles parsing of various CSV formats and coordinate conversions
 */

/**
 * Parse waypoints from uploaded file content
 * Supports both lat,lon and lon,lat formats with auto-detection
 *
 * @param {string} contents - File contents as string
 * @param {string} filename - Name of the uploaded file
 * @return {Array} Array of processed waypoints in OSRM format [lon,lat]
 */
function parseWaypointsFile(contents, filename) {
  // Split by lines and remove empty lines
  const lines = contents.split(/\r?\n/).filter((line) => line.trim() !== "");

  if (lines.length < 2) {
    throw new Error("File must contain at least 2 waypoints");
  }

  // Detect if it's a CSV with headers
  const hasHeaders = /^[a-zA-Z"']/.test(lines[0]);
  const startIndex = hasHeaders ? 1 : 0;

  // Determine the format (lat,lon or lon,lat)
  let isLatLonFormat = true;

  // Check for "latitude" or "lat" in the header
  if (hasHeaders) {
    const headerLine = lines[0].toLowerCase();

    // Check if header contains lat/lon indicators
    if (headerLine.includes("latitude") || headerLine.includes("lat")) {
      isLatLonFormat = true;
      console.log("CSV format detected from header: lat,lon");
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
      console.log(
        `CSV format detected from header order: ${
          isLatLonFormat ? "lat,lon" : "lon,lat"
        }`
      );
    }
  } else {
    // Without headers, try to detect format by examining values
    isLatLonFormat = detectFormatWithoutHeaders(lines);
    console.log(
      `CSV format detected from values: ${
        isLatLonFormat ? "lat,lon" : "lon,lat"
      }`
    );
  }

  // Process waypoints
  const waypoints = [];

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse the coordinate pair
    const parsedCoord = parseCoordinatePair(line, isLatLonFormat);

    if (parsedCoord) {
      waypoints.push(parsedCoord);
    }
  }

  if (waypoints.length < 2) {
    throw new Error("Could not parse at least 2 valid waypoints from the file");
  }

  return waypoints;
}

/**
 * Try to detect format (lat,lon vs lon,lat) when headers are not present
 * Uses a heuristic approach based on typical coordinate ranges
 *
 * @param {Array} lines - Array of coordinate lines
 * @return {boolean} True if format appears to be lat,lon, false for lon,lat
 */
function detectFormatWithoutHeaders(lines) {
  // Look at the first few lines (or all if fewer than 5)
  const sampleSize = Math.min(lines.length, 5);
  let latLonLikely = 0;
  let lonLatLikely = 0;

  for (let i = 0; i < sampleSize; i++) {
    const line = lines[i].trim();

    // Handle quoted values and different delimiters
    const parts = line
      .split(/[,;\t]/)
      .map((part) => part.trim().replace(/^["']|["']$/g, ""));

    if (parts.length >= 2) {
      // Parse as numbers
      const first = parseFloat(parts[0]);
      const second = parseFloat(parts[1]);

      if (!isNaN(first) && !isNaN(second)) {
        // Check if first value looks like latitude (-90 to 90)
        if (Math.abs(first) <= 90) {
          latLonLikely++;
        }

        // Check if first value looks like longitude (-180 to 180)
        if (Math.abs(first) > 90 && Math.abs(first) <= 180) {
          lonLatLikely++;
        }

        // Check if second value looks like longitude
        if (Math.abs(second) > 90 && Math.abs(second) <= 180) {
          latLonLikely++;
        }
      }
    }
  }

  // Return the more likely format
  return latLonLikely >= lonLatLikely;
}

/**
 * Parse a coordinate pair from a string line
 *
 * @param {string} line - Line containing coordinates
 * @param {boolean} isLatLonFormat - Whether format is lat,lon (true) or lon,lat (false)
 * @return {string|null} Coordinate string in OSRM format ("lon,lat") or null if invalid
 */
function parseCoordinatePair(line, isLatLonFormat) {
  // Handle quoted values and different delimiters (comma, semicolon, tab)
  const parts = line
    .split(/[,;\t]/)
    .map((part) => part.trim().replace(/^["']|["']$/g, ""));

  if (parts.length >= 2) {
    // Parse the values as numbers
    let lat, lon;

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
      return `${lon},${lat}`;
    }
  }

  return null;
}

/**
 * Handle file upload event
 *
 * @param {Event} event - File input change event
 * @param {Function} successCallback - Callback to execute with parsed waypoints
 */
function handleWaypointFileUpload(event, successCallback) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const contents = e.target.result;
      const waypoints = parseWaypointsFile(contents, file.name);

      // Call the success callback with the parsed waypoints
      if (typeof successCallback === "function") {
        successCallback(waypoints, file.name);
      }
    } catch (error) {
      alert(`Error parsing file: ${error.message}`);
      console.error("CSV parsing error:", error);
    }
  };

  reader.onerror = function () {
    alert("Error reading file");
    console.error("File reading error:", reader.error);
  };

  reader.readAsText(file);
}

// Export the functions for use in other modules
window.CsvParser = {
  parseWaypointsFile,
  handleWaypointFileUpload,
};
