/**
 * Minimal debug module for OSRM Inspector
 */

// Debug visualization status
window.debugStatus = {
  nodes: false,
  edges: false,
  cells: false,
  turns: false,
  speed: false,
  names: false
};

/**
 * Initialize debug tools
 */
function initDebugTools() {
  console.log("Initializing debug tools...");
  
  try {
    // Setup debug buttons
    document.getElementById("btn-show-nodes").addEventListener("click", function() {
      toggleDebugFeature("nodes");
    });

    document.getElementById("btn-show-edges").addEventListener("click", function() {
      toggleDebugFeature("edges");
    });

    document.getElementById("btn-show-cells").addEventListener("click", function() {
      toggleDebugFeature("cells");
    });

    document.getElementById("btn-show-turns").addEventListener("click", function() {
      toggleDebugFeature("turns");
    });

    document.getElementById("btn-show-speed").addEventListener("click", function() {
      toggleDebugFeature("speed");
    });

    document.getElementById("btn-show-names").addEventListener("click", function() {
      toggleDebugFeature("names");
    });

    document.getElementById("btn-clear-debug").addEventListener("click", function() {
      clearAllDebugFeatures();
    });
    
    console.log("Debug tools initialized successfully");
    return true;
  } catch(error) {
    console.error("Error initializing debug tools:", error);
    throw new Error("Debug tools initialization failed: " + error.message);
  }
}

/**
 * Toggle debug feature
 */
function toggleDebugFeature(featureName) {
  window.debugStatus[featureName] = !window.debugStatus[featureName];
  
  // Toggle button class
  const buttonId = `btn-show-${featureName}`;
  const button = document.getElementById(buttonId);
  
  if (window.debugStatus[featureName]) {
    button.classList.add("active");
  } else {
    button.classList.remove("active");
  }
  
  // Clear layer if toggled off
  if (!window.debugStatus[featureName]) {
    if (window.clearDebugLayer) {
      window.clearDebugLayer(featureName);
    } else if (window.mapLayers && window.mapLayers.debug && window.mapLayers.debug[featureName]) {
      window.mapLayers.debug[featureName].clearLayers();
    }
  } else {
    // Show debug visualization
    showNotification("info", `${featureName} visualization is enabled in minimal mode`);
  }
}

/**
 * Clear all debug features
 */
function clearAllDebugFeatures() {
  // Reset all status
  Object.keys(window.debugStatus).forEach(key => {
    window.debugStatus[key] = false;
    const buttonId = `btn-show-${key}`;
    const button = document.getElementById(buttonId);
    if (button) button.classList.remove("active");
  });
  
  // Clear all layers
  if (window.clearAllDebugLayers) {
    window.clearAllDebugLayers();
  } else if (window.mapLayers && window.mapLayers.debug) {
    Object.values(window.mapLayers.debug).forEach(layer => {
      if (layer && typeof layer.clearLayers === 'function') {
        layer.clearLayers();
      }
    });
  }
  
  showNotification("success", "All debug visualizations cleared");
}

/**
 * Show notification
 */
function showNotification(type, message, duration = 3000) {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(notif => {
    document.body.removeChild(notif);
  });
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  
  // Set icon based on type
  let icon = 'info-circle';
  if (type === 'warning') icon = 'exclamation-triangle';
  if (type === 'error') icon = 'exclamation-circle';
  if (type === 'success') icon = 'check-circle';
  
  notification.innerHTML = `
    <i class="fa fa-${icon}"></i>
    <span>${message}</span>
  `;
  
  // Style the notification
  Object.assign(notification.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: '9999',
    padding: '12px 20px',
    borderRadius: '4px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontWeight: '500',
    minWidth: '250px',
    maxWidth: '400px',
    animation: 'fadeIn 0.3s forwards'
  });
  
  // Set colors based on type
  if (type === 'warning') {
    Object.assign(notification.style, {
      backgroundColor: '#fff9e6',
      color: '#f39c12',
      borderLeft: '4px solid #f39c12'
    });
  } else if (type === 'error') {
    Object.assign(notification.style, {
      backgroundColor: '#fee',
      color: '#e74c3c',
      borderLeft: '4px solid #e74c3c'
    });
  } else if (type === 'success') {
    Object.assign(notification.style, {
      backgroundColor: '#efffef',
      color: '#2ecc71',
      borderLeft: '4px solid #2ecc71'
    });
  } else {
    Object.assign(notification.style, {
      backgroundColor: '#e6f7ff',
      color: '#3498db',
      borderLeft: '4px solid #3498db'
    });
  }
  
  // Add to document
  document.body.appendChild(notification);
  
  // Add animation styles
  const style = document.createElement('style');
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
  
  // Remove after duration
  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.3s forwards';
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, duration);
}

// Export functions to global scope
window.initDebugTools = initDebugTools;
window.toggleDebugFeature = toggleDebugFeature;
window.clearAllDebugFeatures = clearAllDebugFeatures;
window.showNotification = showNotification;
