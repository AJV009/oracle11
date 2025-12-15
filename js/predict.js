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
    this.shuffledSantas = shuffle(state.participants);
    this.shuffledRecipients = shuffle(state.participants);

    this.render();
    this.bindEvents();
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
  },

  bindEvents() {
    document.getElementById('submit-predictions').addEventListener('click', () => this.submit());
    document.getElementById('view-leaderboard').addEventListener('click', () => Router.navigate('leaderboard'));
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
      Router.navigate('leaderboard');
    } catch (error) {
      Toast.show('Failed to save. Please try again.', 'error');
    } finally {
      Loading.hide();
    }
  }
};
