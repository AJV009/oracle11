/**
 * Oracle11 - Leaderboard View
 */
const LeaderboardView = {
  predictionsContainer: null,
  scoresContainer: null,

  init() {
    this.predictionsContainer = document.getElementById('aggregated-predictions');
    this.scoresContainer = document.getElementById('scores-list');
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    // No manual refresh - data loads on navigation
  },

  render() {
    state.data?.winnersRevealed ? this.renderScores() : this.renderPredictions();
  },

  renderPredictions() {
    document.getElementById('predictions-leaderboard').classList.remove('hidden');
    document.getElementById('scores-leaderboard').classList.add('hidden');

    // Aggregate votes
    const aggregated = {};
    state.participants.forEach(r => { aggregated[r] = {}; });

    Object.values(state.data?.predictions || {}).forEach(pred => {
      Object.entries(pred.guesses || {}).forEach(([recipient, gifter]) => {
        if (gifter && aggregated[recipient]) {
          aggregated[recipient][gifter] = (aggregated[recipient][gifter] || 0) + 1;
        }
      });
    });

    // Build two-column table
    const rows = state.participants.map(recipient => {
      const votes = Object.entries(aggregated[recipient] || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      // Format santas - only show count if > 1
      const santaList = votes.length
        ? votes.map(([santa, count], i) => {
            const countDisplay = count > 1 ? ` <span class="vote-count">(${count})</span>` : '';
            return `<span class="santa-chip ${i === 0 ? 'top' : ''}">${santa}${countDisplay}</span>`;
          }).join('')
        : '<span class="santa-chip empty">No predictions</span>';

      return `
        <tr>
          <td class="recipient-cell">${recipient}</td>
          <td class="santa-cell">${santaList}</td>
        </tr>
      `;
    }).join('');

    this.predictionsContainer.innerHTML = `
      <table class="predictions-table">
        <thead>
          <tr>
            <th>Recipient</th>
            <th>Predicted Santa</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  },

  renderScores() {
    document.getElementById('predictions-leaderboard').classList.add('hidden');
    document.getElementById('scores-leaderboard').classList.remove('hidden');

    const { scores, details } = this.calculateScores();
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

    if (sorted.length > 0) {
      const [name, score] = sorted[0];
      document.getElementById('winner-banner').innerHTML = `
        <div class="winner-name">${name}</div>
        <div class="winner-score">${score}/${state.participants.length} correct predictions!</div>
      `;
    }

    this.scoresContainer.innerHTML = sorted.map(([name, score]) => `
      <li class="score-item" data-player="${name}">
        <span class="score-name">${name}</span>
        <span class="score-points">${score} pts</span>
        <span class="expand-icon">▼</span>
      </li>
      <li class="score-details hidden" data-details-for="${name}">
        ${this.renderPlayerDetails(details[name])}
      </li>
    `).join('');

    // Bind click handlers for expandable items
    this.scoresContainer.querySelectorAll('.score-item').forEach(item => {
      item.addEventListener('click', () => this.toggleDetails(item.dataset.player));
    });
  },

  toggleDetails(playerName) {
    const detailsEl = this.scoresContainer.querySelector(`[data-details-for="${playerName}"]`);
    const itemEl = this.scoresContainer.querySelector(`[data-player="${playerName}"]`);

    if (detailsEl) {
      detailsEl.classList.toggle('hidden');
      itemEl.classList.toggle('expanded');
    }
  },

  renderPlayerDetails(guesses) {
    if (!guesses || guesses.length === 0) {
      return '<div class="no-details">No predictions found</div>';
    }

    return `
      <div class="details-grid">
        ${guesses.map(g => `
          <div class="detail-row ${g.correct ? 'correct' : 'incorrect'}">
            <span class="detail-recipient">${g.recipient}</span>
            <span class="detail-arrow">→</span>
            <span class="detail-guess">${g.guessed}</span>
            <span class="detail-icon">${g.correct ? '✓' : '✗'}</span>
            ${!g.correct ? `<span class="detail-actual">(was ${g.actual})</span>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  },

  calculateScores() {
    const scores = {};
    const details = {};
    const predictions = state.data?.predictions || {};
    const actual = state.data?.actualPairings || {};

    Object.entries(predictions).forEach(([codename, data]) => {
      const realPerson = actual[codename];
      if (!realPerson || !data.guesses) return;

      let correct = 0;
      const playerDetails = [];

      Object.entries(data.guesses).forEach(([recipient, guessed]) => {
        const isCorrect = actual[recipient] === guessed;
        if (isCorrect) correct++;

        playerDetails.push({
          recipient,
          guessed,
          actual: actual[recipient],
          correct: isCorrect
        });
      });

      scores[realPerson] = correct;
      details[realPerson] = playerDetails.sort((a, b) => b.correct - a.correct);
    });

    return { scores, details };
  }
};
