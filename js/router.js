/**
 * Oracle11 - Router / View Management
 */
const Router = {
  views: {},

  init() {
    this.views = {
      selector: document.getElementById('selector-view'),
      predict: document.getElementById('predict-view'),
      leaderboard: document.getElementById('leaderboard-view'),
      admin: document.getElementById('admin-view')
    };

    window.addEventListener('hashchange', () => this.handleRoute());

    document.querySelectorAll('.back-btn').forEach(btn => {
      btn.addEventListener('click', () => this.navigate(btn.dataset.target));
    });
  },

  navigate(view) {
    window.location.hash = view;
  },

  handleRoute() {
    const hash = window.location.hash.slice(1) || 'selector';

    // Force leaderboard if winners revealed
    if (state.data?.winnersRevealed && hash !== 'admin' && hash !== 'leaderboard') {
      this.navigate('leaderboard');
      return;
    }

    // Require codename for predict view
    if (hash === 'predict' && !state.currentCodename && !state.data?.winnersRevealed) {
      this.navigate('selector');
      return;
    }

    // Hide all, show target
    Object.values(this.views).forEach(v => v.classList.remove('active'));
    const target = this.views[hash];
    if (target) {
      target.classList.add('active');
      if (hash === 'predict') PredictView.init();
      if (hash === 'leaderboard') LeaderboardView.init();
      if (hash === 'admin') AdminView.init();
    }
  },

  getCurrentView() {
    return window.location.hash.slice(1) || 'selector';
  }
};
