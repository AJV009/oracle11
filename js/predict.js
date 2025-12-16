/**
 * Oracle11 - Prediction Matrix View
 */
const PredictView = {
  matrixBody: null,
  shuffledSantas: [],
  shuffledRecipients: [],

  init() {
    this.matrixBody = document.getElementById('matrix-body');
    document.getElementById('current-codename').textContent = state.currentCodename;

    // Shuffle both rows (Santas) and dropdown options (Recipients)
    // Remove current player from Santa list (they can't predict their own giving)
    this.shuffledSantas = shuffle(state.participants.filter(p => p !== state.currentCodename));
    this.shuffledRecipients = shuffle(state.participants);

    this.render();
    this.bindEvents();
    this.updateLeaderboardButton();
  },

  updateLeaderboardButton() {
    const btn = document.getElementById('view-leaderboard');
    if (isLeaderboardAccessible()) {
      btn.classList.remove('hidden');
    } else {
      btn.classList.add('hidden');
    }
  },

  render() {
    // Guesses stored as {santa: recipient} - matches UI display
    const existingGuesses = state.data?.predictions?.[state.currentCodename]?.guesses || {};

    this.matrixBody.innerHTML = this.shuffledSantas.map(santa => `
      <tr>
        <td><span class="santa-name">${santa}</span></td>
        <td>
          <select data-santa="${santa}">
            <option value="">Select...</option>
            ${this.shuffledRecipients.map(recipient =>
              `<option value="${recipient}" ${recipient === existingGuesses[santa] ? 'selected' : ''}>${recipient}</option>`
            ).join('')}
          </select>
        </td>
      </tr>
    `).join('');

    // Enforce unique selections based on existing guesses
    this.updateDropdownOptions();
  },

  bindEvents() {
    document.getElementById('submit-predictions').addEventListener('click', () => this.submit());
    document.getElementById('view-leaderboard').addEventListener('click', () => Router.navigate('leaderboard'));

    // Listen for dropdown changes to enforce unique recipient selections
    this.matrixBody.addEventListener('change', (e) => {
      if (e.target.tagName === 'SELECT') {
        this.updateDropdownOptions();
      }
    });
  },

  updateDropdownOptions() {
    const selects = this.matrixBody.querySelectorAll('select');

    // Collect all currently selected recipients
    const selectedRecipients = new Set();
    selects.forEach(select => {
      if (select.value) {
        selectedRecipients.add(select.value);
      }
    });

    // Update each dropdown to exclude recipients selected elsewhere
    selects.forEach(select => {
      const currentValue = select.value;

      // Build list of available recipients for this dropdown
      const availableRecipients = this.shuffledRecipients.filter(recipient => {
        // Include if: not selected elsewhere OR is this dropdown's current selection
        return !selectedRecipients.has(recipient) || recipient === currentValue;
      });

      // Rebuild options while preserving current selection
      select.innerHTML = `
        <option value="">Select...</option>
        ${availableRecipients.map(recipient =>
          `<option value="${recipient}" ${recipient === currentValue ? 'selected' : ''}>${recipient}</option>`
        ).join('')}
      `;
    });
  },

  async submit() {
    const guesses = {};
    let hasEmpty = false;

    // Store as {santa: recipient} - matches UI display
    this.matrixBody.querySelectorAll('select').forEach(select => {
      if (!select.value) hasEmpty = true;
      const santa = select.dataset.santa;
      const recipient = select.value;
      if (recipient) {
        guesses[santa] = recipient;  // Direct: santa → recipient
      }
    });

    if (hasEmpty) {
      Toast.show('Please complete all predictions', 'error');
      return;
    }

    Loading.show();
    try {
      const prediction = {
        timestamp: new Date().toISOString(),
        guesses
      };

      // Use safe merge with verify+retry
      state.data = await API.savePrediction(state.currentCodename, prediction);
      Toast.show('Predictions saved!', 'success');

      // Navigate to leaderboard if accessible, otherwise stay on predict
      if (isLeaderboardAccessible()) {
        Router.navigate('leaderboard');
      } else {
        this.updateLeaderboardButton();
        Toast.show('Leaderboard will be available after more submissions', 'info');
      }
    } catch (error) {
      Toast.show('Failed to save. Please try again.', 'error');
    } finally {
      Loading.hide();
    }
  }
};
