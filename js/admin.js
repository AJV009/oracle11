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

    const confirmedCount = getConfirmedCount();
    const totalCount = state.participants.length;
    const allRevealed = confirmedCount === totalCount;

    if (allRevealed) {
      document.getElementById('admin-input-section').classList.add('hidden');
      document.getElementById('admin-revealed-section').classList.remove('hidden');
    } else {
      document.getElementById('admin-input-section').classList.remove('hidden');
      document.getElementById('admin-revealed-section').classList.add('hidden');
      this.renderMatrix();
      this.updateButtonState(confirmedCount, totalCount);
    }
    this.renderStats();
  },

  updateButtonState(confirmed, total) {
    const btn = document.getElementById('declare-winners');
    if (confirmed === 0) {
      btn.textContent = 'Start Reveal';
    } else if (confirmed < total) {
      btn.textContent = `Update (${confirmed}/${total})`;
    } else {
      btn.textContent = 'Finalize Results';
    }
  },

  renderMatrix() {
    const body = document.getElementById('admin-matrix-body');
    // Pairings stored as {santa: recipient} - matches UI display
    const existingPairings = state.data?.actualPairings || {};

    body.innerHTML = state.participants.map(santa => {
      const isConfirmed = existingPairings[santa] !== undefined;
      return `
        <tr class="${isConfirmed ? 'confirmed' : ''}">
          <td>
            <span class="santa-name">${santa}</span>
            ${isConfirmed ? '<span class="confirmed-badge">confirmed</span>' : ''}
          </td>
          <td>
            <select data-santa="${santa}">
              <option value="">Select...</option>
              ${state.participants.map(r =>
                `<option value="${r}" ${r === existingPairings[santa] ? 'selected' : ''}>${r}</option>`
              ).join('')}
            </select>
          </td>
        </tr>
      `;
    }).join('');
  },

  renderStats() {
    const submissions = Object.keys(state.data?.predictions || {}).length;
    const confirmed = getConfirmedCount();
    const total = state.participants.length;
    document.getElementById('admin-stats-grid').innerHTML = `
      <div class="stat-card"><div class="stat-value">${submissions}</div><div class="stat-label">Submissions</div></div>
      <div class="stat-card"><div class="stat-value">${confirmed}/${total}</div><div class="stat-label">Confirmed</div></div>
      <div class="stat-card"><div class="stat-value">${confirmed === total ? 'Complete' : confirmed > 0 ? 'In Progress' : 'Pending'}</div><div class="stat-label">Status</div></div>
    `;
  },

  async declareWinners() {
    const currentPairings = this.collectPairings();
    const existingPairings = state.data?.actualPairings || {};

    // Merge: current selections override existing
    const mergedPairings = { ...existingPairings, ...currentPairings };
    const totalConfirmed = Object.keys(mergedPairings).length;

    // Check if anything changed
    const hasChanges = Object.keys(currentPairings).length > 0 ||
      Object.keys(existingPairings).some(k => currentPairings[k] !== existingPairings[k]);

    if (!hasChanges && totalConfirmed === Object.keys(existingPairings).length) {
      Toast.show('No changes to save', 'error');
      return;
    }

    const isFirst = Object.keys(existingPairings).length === 0;
    const isFinal = totalConfirmed === state.participants.length;

    let confirmMsg = isFirst
      ? 'Start the reveal? This will lock all predictions.'
      : isFinal
        ? 'Finalize all results? This completes the reveal.'
        : `Save ${totalConfirmed} pairing(s)?`;

    if (!confirm(confirmMsg)) return;

    Loading.show();
    try {
      state.data = await API.saveAdminData({
        actualPairings: mergedPairings,
        winnersRevealed: isFinal
      });
      Toast.show(isFinal ? 'All results finalized!' : 'Pairings updated!', 'success');
      this.render();
    } catch (error) {
      Toast.show('Failed to save pairings', 'error');
    } finally {
      Loading.hide();
    }
  },

  collectPairings() {
    // Store as {santa: recipient} - matches UI display
    const pairings = {};
    document.getElementById('admin-matrix-body').querySelectorAll('select').forEach(s => {
      const santa = s.dataset.santa;
      const recipient = s.value;
      if (recipient) {
        pairings[santa] = recipient;  // Direct: santa → recipient
      }
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
