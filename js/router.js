/**
 * Oracle11 - Router / View Management
 */
const Router = {
  views: {},

  init() {
    this.views = {
      celebrations: document.getElementById('celebrations-view'),
      'celebration-auth': document.getElementById('celebration-auth-view'),
      selector: document.getElementById('selector-view'),
      predict: document.getElementById('predict-view'),
      leaderboard: document.getElementById('leaderboard-view'),
      admin: document.getElementById('admin-view')
    };

    window.addEventListener('hashchange', () => this.handleRoute());

    document.querySelectorAll('.back-btn').forEach(btn => {
      if (btn.dataset.target) {
        btn.addEventListener('click', () => this.navigate(btn.dataset.target));
      }
    });
  },

  navigate(view) {
    window.location.hash = view;
  },

  handleRoute() {
    const hash = window.location.hash.slice(1) || 'celebrations';

    // Admin can access without celebration auth
    if (hash === 'admin') {
      this.showView('admin');
      AdminView.init();
      return;
    }

    // Celebrations view is always accessible
    if (hash === 'celebrations') {
      this.showView('celebrations');
      CelebrationsView.init();
      return;
    }

    // Celebration-auth requires pending celebration
    if (hash === 'celebration-auth') {
      const pending = sessionStorage.getItem('oracle11_pending_celebration');
      if (!pending || !state.celebrations[pending]) {
        this.navigate('celebrations');
        return;
      }
      this.showView('celebration-auth');
      CelebrationAuthView.init();
      return;
    }

    // All other routes require celebration selection + auth
    if (!state.currentCelebration || !state.celebrationAuth) {
      this.navigate('celebrations');
      return;
    }

    // Force leaderboard if reveal has started (predictions locked)
    if (hasRevealStarted() && hash !== 'leaderboard') {
      this.navigate('leaderboard');
      return;
    }

    // Require codename for predict view
    if (hash === 'predict' && !state.currentCodename && !hasRevealStarted()) {
      this.navigate('selector');
      return;
    }

    // Show the requested view
    this.showView(hash);

    if (hash === 'selector') Selector.init();
    if (hash === 'predict') PredictView.init();
    if (hash === 'leaderboard') LeaderboardView.init();
  },

  showView(viewName) {
    Object.values(this.views).forEach(v => v?.classList.remove('active'));
    const target = this.views[viewName];
    if (target) {
      target.classList.add('active');
    }
  },

  getCurrentView() {
    return window.location.hash.slice(1) || 'celebrations';
  }
};
