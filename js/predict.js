/**
 * Oracle11 - Prediction Matrix View
 */
const PredictView = {
  matrixBody: null,
  shuffledRecipients: [],
  shuffledGifters: [],

  init() {
    this.matrixBody = document.getElementById('matrix-body');
    document.getElementById('current-codename').textContent = state.currentCodename;

    // Shuffle both rows and dropdown options
    this.shuffledRecipients = shuffle(state.participants);
    this.shuffledGifters = shuffle(state.participants);

    this.render();
    this.bindEvents();
  },

  render() {
    const existing = state.data?.predictions?.[state.currentCodename]?.guesses || {};

    this.matrixBody.innerHTML = this.shuffledRecipients.map(recipient => `
      <tr>
        <td><span class="recipient-name">${recipient}</span></td>
        <td>
          <select data-recipient="${recipient}">
            <option value="">Select...</option>
            ${this.shuffledGifters.map(gifter =>
              `<option value="${gifter}" ${gifter === existing[recipient] ? 'selected' : ''}>${gifter}</option>`
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

    this.matrixBody.querySelectorAll('select').forEach(select => {
      if (!select.value) hasEmpty = true;
      guesses[select.dataset.recipient] = select.value;
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
