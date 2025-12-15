/**
 * Oracle11 - App Initialization
 */

// Clear all oracle11 caches from localStorage
function clearAllCaches() {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('oracle11_cache')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log(`Cleared ${keysToRemove.length} cached items`);
}

// Check cache version and invalidate if outdated
function checkCacheVersion() {
  const storedVersion = localStorage.getItem('oracle11_version');
  const currentVersion = CONFIG.CACHE_VERSION.toString();

  if (storedVersion !== currentVersion) {
    console.log(`Cache version mismatch (${storedVersion} → ${currentVersion}), clearing caches...`);
    clearAllCaches();
    // Also clear session storage to prevent stale state
    sessionStorage.clear();
    localStorage.setItem('oracle11_version', currentVersion);
  }
}

async function initApp() {
  // Check cache version first - clears old incompatible caches
  checkCacheVersion();

  Decorations.init();
  Toast.init();
  Loading.init();
  Router.init();

  Loading.show();

  try {
    // Load celebrations configuration
    const response = await fetch('drawnames.json');
    const data = await response.json();
    state.celebrations = data.celebrations;

    // Restore session state if available
    const savedCelebration = sessionStorage.getItem('oracle11_celebration');
    const savedAuth = sessionStorage.getItem('oracle11_celebration_auth');

    if (savedCelebration && savedAuth === 'true' && state.celebrations[savedCelebration]) {
      // Restore celebration context
      setCelebration(savedCelebration);
      state.celebrationAuth = true;

      // Restore codename if saved
      const savedCodename = sessionStorage.getItem('oracle11_codename');
      if (savedCodename && state.participants.includes(savedCodename)) {
        state.currentCodename = savedCodename;
        state.currentIndex = state.participants.indexOf(savedCodename);
      }

      // Load celebration data
      try {
        state.data = await API.fetchData();
      } catch (e) {
        state.data = API.getDefaultData();
        console.log('Using default data structure');
      }

      // Initialize selector for restored session
      Selector.init();
    }

    Router.handleRoute();
  } catch (error) {
    console.error('Failed to initialize app:', error);
    Toast.show('Failed to load app. Please refresh.', 'error');
  } finally {
    Loading.hide();
  }
}

// Start when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
