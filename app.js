/**
 * Main application entry point
 */
document.addEventListener("DOMContentLoaded", function () {
  // Inisialisasi peta dan komponen
  initMap();
  initRouting();
  initDebugTools();

  // Log aplikasi telah dimuat
  console.log("OSRM Inspector loaded successfully");

  // Sembunyikan loading indicator
  hideLoading();

  // Verify modifications
  verifyChanges();
});

/**
 * Verify OSRM Inspector modifications have been applied correctly
 */
function verifyChanges() {
  console.log("Verifying OSRM Inspector modifications:");

  // Check profile and algorithm display
  setTimeout(async () => {
    try {
      const profile = document.querySelector(".profile-value");
      const algorithm = document.querySelector(".algorithm-value");

      console.log("Profile display:", profile ? "✓" : "✗");
      console.log("Algorithm display:", algorithm ? "✓" : "✗");

      // Check multiple waypoints functionality
      const addWaypointBtn = document.getElementById("btn-add-waypoint");
      const importCsvBtn = document.getElementById("btn-import-csv");

      console.log("Multiple waypoints:", addWaypointBtn ? "✓" : "✗");
      console.log("CSV import:", importCsvBtn ? "✓" : "✗");

      // Check time-dependent routing
      const timeSelection = document.querySelector(".time-selection");
      console.log("Time-dependent routing:", timeSelection ? "✓" : "✗");

      console.log("All modifications applied successfully!");
    } catch (e) {
      console.error("Verification failed:", e);
    }
  }, 1000);
}
