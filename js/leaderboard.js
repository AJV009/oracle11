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
    // Show scores if reveal has started (even partial)
    hasRevealStarted() ? this.renderScores() : this.renderPredictions();
  },

  renderPredictions() {
    document.getElementById('predictions-leaderboard').classList.remove('hidden');
    document.getElementById('scores-leaderboard').classList.add('hidden');

    // Aggregate votes by Santa - data stored as {santa: recipient}
    const aggregated = {};
    state.participants.forEach(s => { aggregated[s] = {}; });

    Object.values(state.data?.predictions || {}).forEach(pred => {
      Object.entries(pred.guesses || {}).forEach(([santa, recipient]) => {
        if (recipient && aggregated[santa]) {
          aggregated[santa][recipient] = (aggregated[santa][recipient] || 0) + 1;
        }
      });
    });

    // Build two-column table: Santa → Predicted Recipients
    const rows = state.participants.map(santa => {
      const votes = Object.entries(aggregated[santa] || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      // Format recipients - only show count if > 1
      const recipientList = votes.length
        ? votes.map(([recipient, count], i) => {
            const countDisplay = count > 1 ? ` <span class="vote-count">(${count})</span>` : '';
            return `<span class="recipient-chip ${i === 0 ? 'top' : ''}">${recipient}${countDisplay}</span>`;
          }).join('')
        : '<span class="recipient-chip empty">No predictions</span>';

      return `
        <tr>
          <td class="santa-cell">${santa}</td>
          <td class="recipient-cell">${recipientList}</td>
        </tr>
      `;
    }).join('');

    this.predictionsContainer.innerHTML = `
      <table class="predictions-table">
        <thead>
          <tr>
            <th>Santa</th>
            <th>Predicted Recipient</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  },

  renderScores() {
    document.getElementById('predictions-leaderboard').classList.add('hidden');
    document.getElementById('scores-leaderboard').classList.remove('hidden');

    const { scores, details, maxPossible } = this.calculateScores();
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const confirmed = getConfirmedCount();
    const total = state.participants.length;
    const isComplete = confirmed === total;

    if (sorted.length > 0) {
      const [name, score] = sorted[0];
      const statusText = isComplete
        ? `${score}/${total} correct predictions!`
        : `${score}/${confirmed} confirmed (${total - confirmed} pending)`;
      document.getElementById('winner-banner').innerHTML = `
        <div class="winner-name">${isComplete ? name : 'Reveal in progress...'}</div>
        <div class="winner-score">${isComplete ? statusText : `${confirmed}/${total} pairings confirmed`}</div>
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

    // Display: Santa → Recipient (matches data structure {santa: recipient})
    return `
      <div class="details-grid">
        ${guesses.map(g => {
          if (g.pending) {
            return `
              <div class="detail-row pending">
                <span class="detail-santa">${g.santa}</span>
                <span class="detail-arrow">→</span>
                <span class="detail-recipient">${g.recipient}</span>
                <span class="detail-icon">?</span>
                <span class="detail-actual">(unconfirmed)</span>
              </div>
            `;
          }
          return `
            <div class="detail-row ${g.correct ? 'correct' : 'incorrect'}">
              <span class="detail-santa">${g.santa}</span>
              <span class="detail-arrow">→</span>
              <span class="detail-recipient">${g.recipient}</span>
              <span class="detail-icon">${g.correct ? '✓' : '✗'}</span>
              ${!g.correct ? `<span class="detail-actual">(gave to ${g.actualRecipient})</span>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  calculateScores() {
    const scores = {};
    const details = {};
    const predictions = state.data?.predictions || {};
    const actual = state.data?.actualPairings || {};
    const confirmedSantas = new Set(Object.keys(actual));

    Object.entries(predictions).forEach(([playerName, data]) => {
      // playerName is the actual person who submitted these predictions
      if (!data.guesses) return;

      let correct = 0;
      const playerDetails = [];

      // guesses: {guessedSanta: guessedRecipient}
      Object.entries(data.guesses).forEach(([santa, recipient]) => {
        const isPending = !confirmedSantas.has(santa);

        if (isPending) {
          playerDetails.push({
            santa,
            recipient,
            pending: true
          });
        } else {
          const actualRecipient = actual[santa];
          const isCorrect = actualRecipient === recipient;
          if (isCorrect) correct++;

          playerDetails.push({
            santa,
            recipient,
            actualRecipient,
            correct: isCorrect,
            pending: false
          });
        }
      });

      scores[playerName] = correct;
      // Sort: correct first, then incorrect, then pending
      details[playerName] = playerDetails.sort((a, b) => {
        if (a.pending && !b.pending) return 1;
        if (!a.pending && b.pending) return -1;
        if (a.pending && b.pending) return 0;
        return b.correct - a.correct;
      });
    });

    return { scores, details, maxPossible: confirmedSantas.size };
  }
};
