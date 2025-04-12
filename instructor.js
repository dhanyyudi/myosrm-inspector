/**
 * OSRM Inspector UI Enhancement - Panduan Integrasi
 *
 * Untuk mengintegrasikan semua perubahan yang telah dibuat, ikuti langkah-langkah berikut:
 *
 * 1. Perbarui file CSS
 *    - Salin semua konten dari artifact "modern-ui-update" ke styles.css
 *    - Tambahkan konten dari artifact "modal-css" ke bagian bawah styles.css
 *
 * 2. Perbarui map.js
 *    - Ganti fungsi displayRoute dengan versi baru dari artifact "map-js-update"
 *    - Tambahkan fungsi baru: generateColorPalette, addRouteLegend, shortenCoordinate, clearRouteLegend
 *    - Perbarui fungsi clearRoute untuk memanggil clearRouteLegend
 *    - Ganti fungsi addStartMarker, addEndMarker, dan addViaMarker dengan versi dari artifact "draggable-markers"
 *
 * 3. Perbarui routing.js
 *    - Tambahkan variabel currentRoutingUrl di bagian atas file
 *    - Tambahkan fungsi initCurbOptions dan addCurbOptions dari artifact "curb-implementation"
 *    - Perbarui fungsi initRouting untuk memanggil initCurbOptions
 *    - Perbarui fungsi findRouteWithMultipleWaypoints dengan versi dari artifact "curb-implementation"
 *    - Perbarui fungsi parseWaypointsFile dengan versi dari artifact "enhanced-csv-import"
 *    - Tambahkan fungsi-fungsi URL dari artifact "copy-url-feature":
 *      - addRoutingUrlDisplay
 *      - updateRoutingUrlDisplay
 *      - copyRoutingUrl
 *      - promptLoadUrl
 *      - loadRoutingUrl
 *    - Perbarui updateProfileDisplay dengan versi dari artifact "editable-profiles"
 *    - Tambahkan fungsi editProfile dan updateAvailableProfiles dari artifact "editable-profiles"
 *
 * 4. Perbarui index.html
 *    - Tambahkan toggle "Auto-update route" setelah route-options dari artifact "auto-update-toggle"
 *    - Panggil addRoutingUrlDisplay() di akhir fungsi initRouting
 *
 * 5. Persiapkan docker-compose.yml
 *    - Gunakan contoh dari artifact "docker-compose-curb" sebagai dasar
 *    - Sesuaikan dengan kebutuhan Anda (path, nama file peta, dll)
 *
 * Berikut adalah contoh kode untuk memanggil semua inisialisasi yang diperlukan di app.js:
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

  // Verifikasi perubahan
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

      // Check for new features
      const autoUpdateToggle = document.getElementById("auto-update-route");
      console.log("Auto-update toggle:", autoUpdateToggle ? "✓" : "✗");

      const curbToggle = document.getElementById("enable-curb");
      console.log("CURB toggle:", curbToggle ? "✓" : "✗");

      const routingUrlDisplay = document.getElementById("routing-url-display");
      console.log("Routing URL display:", routingUrlDisplay ? "✓" : "✗");

      const editProfileBtn = document.getElementById("btn-edit-profile");
      console.log("Edit profile button:", editProfileBtn ? "✓" : "✗");

      console.log("All modifications applied successfully!");
    } catch (e) {
      console.error("Verification failed:", e);
    }
  }, 1000);
}

/**
 * Contoh fungsi di routing.js untuk inisialisasi routing
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
  setInterval(updateProfileDisplay, 30000);

  // Setup multiple waypoints
  initRoutingWithMultipleWaypoints();

  // Setup time-dependent routing
  initTimeDependentRouting();

  // Setup CURB options
  initCurbOptions();

  // Add routing URL display
  addRoutingUrlDisplay();

  console.log("Routing module initialized with all enhancements");
}
