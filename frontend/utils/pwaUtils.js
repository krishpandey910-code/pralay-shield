// PWA Utility Functions for Offline Functionality

// Check if PWA is installed
export const isPWAInstalled = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
};

// Check if service worker is supported
export const isServiceWorkerSupported = () => {
  return 'serviceWorker' in navigator;
};

// Register service worker
export const registerServiceWorker = async () => {
  if (!isServiceWorkerSupported()) {
    console.warn('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered successfully:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

// Check online/offline status
export const getConnectionStatus = () => {
  return navigator.onLine;
};

// Listen for connection changes
export const onConnectionChange = (callback) => {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

// Store SOS alert offline
export const storeOfflineSOS = async (sosData) => {
  try {
    const offlineAlerts = JSON.parse(localStorage.getItem('offlineSOSAlerts') || '[]');
    const newAlert = {
      id: Date.now().toString(),
      ...sosData,
      timestamp: new Date().toISOString(),
      storedOffline: true
    };
    
    offlineAlerts.push(newAlert);
    localStorage.setItem('offlineSOSAlerts', JSON.stringify(offlineAlerts));
    
    console.log('SOS alert stored offline:', newAlert);
    return true;
  } catch (error) {
    console.error('Failed to store offline SOS:', error);
    return false;
  }
};

// Get all offline SOS alerts
export const getOfflineSOSAlerts = () => {
  try {
    const data = localStorage.getItem('offlineSOSAlerts');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to retrieve offline data:', error);
    return [];
  }
};

// Sync offline SOS alerts when online
export const syncOfflineSOSAlerts = async (apiEndpoint) => {
  try {
    const offlineAlerts = getOfflineSOSAlerts();
    
    if (offlineAlerts.length === 0) {
      return { success: true, synced: 0 };
    }

    let syncedCount = 0;
    const failedAlerts = [];

    for (const alert of offlineAlerts) {
      try {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(alert)
        });
        
        if (response.ok) {
          // Remove from offline storage
          const updatedAlerts = offlineAlerts.filter(a => a.id !== alert.id);
          localStorage.setItem('offlineSOSAlerts', JSON.stringify(updatedAlerts));
          syncedCount++;
          console.log('Offline SOS alert synced successfully:', alert.id);
        } else {
          failedAlerts.push(alert);
        }
      } catch (error) {
        console.error('Failed to sync offline SOS alert:', error);
        failedAlerts.push(alert);
      }
    }

    // Update localStorage with failed alerts
    if (failedAlerts.length > 0) {
      localStorage.setItem('offlineSOSAlerts', JSON.stringify(failedAlerts));
    }

    return {
      success: true,
      synced: syncedCount,
      failed: failedAlerts.length,
      total: offlineAlerts.length
    };
  } catch (error) {
    console.error('Error syncing offline SOS alerts:', error);
    return { success: false, error: error.message };
  }
};

// Initialize PWA features
export const initializePWA = async () => {
  const capabilities = {
    hasServiceWorker: isServiceWorkerSupported(),
    isPWA: isPWAInstalled(),
    isOnline: getConnectionStatus()
  };
  
  // Register service worker
  if (capabilities.hasServiceWorker) {
    await registerServiceWorker();
  }

  return capabilities;
};
