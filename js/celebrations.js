/**
 * Oracle11 - Celebration Picker View
 */
const CelebrationsView = {
  container: null,

  init() {
    this.container = document.getElementById('celebrations-list');
    this.render();
    this.bindEvents();
  },

  render() {
    const celebrations = state.celebrations;

    if (!celebrations || Object.keys(celebrations).length === 0) {
      this.container.innerHTML = '<p class="no-celebrations">No celebrations available</p>';
      return;
    }

    this.container.innerHTML = Object.entries(celebrations).map(([key, celebration]) => `
      <div class="celebration-card" data-celebration="${key}">
        <div class="celebration-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5"></path>
            <path d="M2 12l10 5 10-5"></path>
          </svg>
        </div>
        <div class="celebration-info">
          <h3 class="celebration-name">${celebration.name}</h3>
          <p class="celebration-participants">${celebration.participants.length} participants</p>
        </div>
        <div class="celebration-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </div>
    `).join('');
  },

  bindEvents() {
    this.container.addEventListener('click', (e) => {
      const card = e.target.closest('.celebration-card');
      if (card) {
        const celebrationKey = card.dataset.celebration;
        this.selectCelebration(celebrationKey);
      }
    });
  },

  selectCelebration(celebrationKey) {
    // Store selection temporarily before auth
    sessionStorage.setItem('oracle11_pending_celebration', celebrationKey);
    Router.navigate('celebration-auth');
  }
};

/**
 * Oracle11 - Celebration Authentication View
 */
const CelebrationAuthView = {
  init() {
    const pending = sessionStorage.getItem('oracle11_pending_celebration');
    if (!pending || !state.celebrations[pending]) {
      Router.navigate('celebrations');
      return;
    }

    const celebration = state.celebrations[pending];
    document.getElementById('celebration-auth-title').textContent = celebration.name;
    document.getElementById('celebration-password').value = '';
    document.getElementById('celebration-auth-error').classList.add('hidden');
    this.bindEvents();
  },

  bindEvents() {
    const loginBtn = document.getElementById('celebration-login');
    const passwordInput = document.getElementById('celebration-password');
    const backBtn = document.getElementById('celebration-back');

    // Remove old listeners by cloning
    const newLoginBtn = loginBtn.cloneNode(true);
    loginBtn.parentNode.replaceChild(newLoginBtn, loginBtn);
    newLoginBtn.addEventListener('click', () => this.authenticate());

    const newPasswordInput = passwordInput.cloneNode(true);
    passwordInput.parentNode.replaceChild(newPasswordInput, passwordInput);
    newPasswordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.authenticate();
    });

    const newBackBtn = backBtn.cloneNode(true);
    backBtn.parentNode.replaceChild(newBackBtn, backBtn);
    newBackBtn.addEventListener('click', () => {
      sessionStorage.removeItem('oracle11_pending_celebration');
      Router.navigate('celebrations');
    });
  },

  async authenticate() {
    const password = document.getElementById('celebration-password').value;
    const pending = sessionStorage.getItem('oracle11_pending_celebration');
    const celebration = state.celebrations[pending];

    if (!celebration) {
      Router.navigate('celebrations');
      return;
    }

    const hash = await this.hashPassword(password);

    if (hash === celebration.passwordHash) {
      // Authentication successful
      setCelebration(pending);
      state.celebrationAuth = true;

      // Store in session
      sessionStorage.setItem('oracle11_celebration', pending);
      sessionStorage.setItem('oracle11_celebration_auth', 'true');
      sessionStorage.removeItem('oracle11_pending_celebration');

      // Load celebration data and proceed
      await this.loadCelebrationData();
      Selector.init();
      Router.navigate('selector');
    } else {
      document.getElementById('celebration-auth-error').classList.remove('hidden');
      Toast.show('Invalid password', 'error');
    }
  },

  async hashPassword(password) {
    const data = new TextEncoder().encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  async loadCelebrationData() {
    Loading.show();
    try {
      state.data = await API.fetchData();
    } catch (e) {
      state.data = API.getDefaultData();
      console.log('Using default data structure for celebration');
    } finally {
      Loading.hide();
    }
  }
};
