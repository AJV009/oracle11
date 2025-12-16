/**
 * Oracle11 - App Initialization
 */

// Bump this to clear all user caches on next load
const CACHE_VERSION = 7;

(function checkCacheVersion() {
  const stored = localStorage.getItem('oracle11_version');
  if (stored !== String(CACHE_VERSION)) {
    // Clear all oracle11 caches
    Object.keys(localStorage)
      .filter(k => k.startsWith('oracle11_cache'))
      .forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
    localStorage.setItem('oracle11_version', CACHE_VERSION);
  }
})();

async function initApp() {
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
