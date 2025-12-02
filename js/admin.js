/**
 * Oracle11 - Admin View
 */
const AdminView = {
  isAuthenticated: false,

  init() {
    // Always require fresh authentication for security
    this.isAuthenticated = false;
    document.getElementById('admin-auth').classList.remove('hidden');
    document.getElementById('admin-controls').classList.add('hidden');
    document.getElementById('admin-password').value = '';
    this.bindEvents();
  },

  bindEvents() {
    document.getElementById('admin-login').addEventListener('click', () => this.authenticate());
    document.getElementById('admin-password').addEventListener('keypress', e => {
      if (e.key === 'Enter') this.authenticate();
    });
    document.getElementById('declare-winners').addEventListener('click', () => this.declareWinners());
    document.getElementById('reset-all').addEventListener('click', () => this.resetAll());
  },

  async authenticate() {
    const password = document.getElementById('admin-password').value;
    const hash = await this.hashPassword(password);

    if (hash === CONFIG.ADMIN_PASSWORD_HASH) {
      this.isAuthenticated = true;
      document.getElementById('auth-error').classList.add('hidden');
      this.showControls();
      Toast.show('Admin access granted', 'success');
    } else {
      document.getElementById('auth-error').classList.remove('hidden');
      Toast.show('Invalid password', 'error');
    }
  },

  async hashPassword(password) {
    const data = new TextEncoder().encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  showControls() {
    document.getElementById('admin-auth').classList.add('hidden');
    document.getElementById('admin-controls').classList.remove('hidden');
    this.render();
  },

  render() {
    if (!this.isAuthenticated) return;

    if (state.data?.winnersRevealed) {
      document.getElementById('admin-input-section').classList.add('hidden');
      document.getElementById('admin-revealed-section').classList.remove('hidden');
    } else {
      document.getElementById('admin-input-section').classList.remove('hidden');
      document.getElementById('admin-revealed-section').classList.add('hidden');
      this.renderMatrix();
    }
    this.renderStats();
  },

  renderMatrix() {
    const body = document.getElementById('admin-matrix-body');
    const existing = state.data?.actualPairings || {};

    body.innerHTML = state.participants.map(recipient => `
      <tr>
        <td><span class="recipient-name">${recipient}</span></td>
        <td>
          <select data-recipient="${recipient}">
            <option value="">Select...</option>
            ${state.participants.map(g =>
              `<option value="${g}" ${g === existing[recipient] ? 'selected' : ''}>${g}</option>`
            ).join('')}
          </select>
        </td>
      </tr>
    `).join('');
  },

  renderStats() {
    const count = Object.keys(state.data?.predictions || {}).length;
    document.getElementById('admin-stats-grid').innerHTML = `
      <div class="stat-card"><div class="stat-value">${count}</div><div class="stat-label">Submissions</div></div>
      <div class="stat-card"><div class="stat-value">${state.participants.length}</div><div class="stat-label">Participants</div></div>
      <div class="stat-card"><div class="stat-value">${state.data?.winnersRevealed ? 'Yes' : 'No'}</div><div class="stat-label">Revealed</div></div>
    `;
  },

  async declareWinners() {
    const pairings = this.collectPairings();
    const allSet = Object.keys(pairings).length === state.participants.length;

    if (!allSet) {
      Toast.show('Please set all pairings before declaring winners', 'error');
      return;
    }

    if (!confirm('Declare winners? This cannot be undone.')) return;

    Loading.show();
    try {
      state.data = await API.saveAdminData({
        actualPairings: pairings,
        winnersRevealed: true
      });
      Toast.show('Winners declared!', 'success');
      this.render();
    } catch (error) {
      Toast.show('Failed to declare winners', 'error');
    } finally {
      Loading.hide();
    }
  },

  collectPairings() {
    const pairings = {};
    document.getElementById('admin-matrix-body').querySelectorAll('select').forEach(s => {
      if (s.value) pairings[s.dataset.recipient] = s.value;
    });
    return pairings;
  },

  async resetAll() {
    const first = confirm('Reset ALL data? This will clear all predictions, pairings, and scores.');
    if (!first) return;

    const second = confirm('Are you REALLY sure? This cannot be undone!');
    if (!second) return;

    Loading.show();
    try {
      const freshData = API.getDefaultData();
      await API.saveData(freshData);
      state.data = freshData;

      // Clear local caches
      localStorage.removeItem('oracle11_cache');
      localStorage.removeItem('oracle11_cache_time');
      sessionStorage.removeItem('oracle11_codename');

      Toast.show('All data has been reset', 'success');
      this.render();
    } catch (error) {
      Toast.show('Failed to reset data', 'error');
    } finally {
      Loading.hide();
    }
  }
};
