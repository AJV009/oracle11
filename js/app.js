/**
 * Oracle11 - App Initialization
 */
async function initApp() {
  Decorations.init();
  Toast.init();
  Loading.init();
  Router.init();

  Loading.show();

  try {
    const response = await fetch('drawnames.json');
    const data = await response.json();
    state.participants = data.participants;

    try {
      state.data = await API.fetchData();
    } catch (e) {
      state.data = API.getDefaultData();
      console.log('Using default data structure');
    }

    Selector.init();
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
