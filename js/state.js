/**
 * Oracle11 - Global State & Utilities
 */
const state = {
  // Celebration-level
  celebrations: {},           // All celebrations from drawnames.json
  currentCelebration: null,   // Key of selected celebration (e.g., "christmas2024")
  celebrationAuth: false,     // Whether user authenticated for current celebration

  // Per-celebration (populated after selection)
  participants: [],           // Current celebration's participants
  binId: null,               // Current celebration's JSONBin ID

  // User session
  currentCodename: null,
  currentIndex: 0,

  // App data
  data: null,
  isAdmin: false,
  isLoading: false
};

// Get current celebration object
function getCurrentCelebration() {
  if (!state.currentCelebration || !state.celebrations[state.currentCelebration]) {
    return null;
  }
  return state.celebrations[state.currentCelebration];
}

// Set current celebration and populate related state
function setCelebration(celebrationKey) {
  const celebration = state.celebrations[celebrationKey];
  if (celebration) {
    state.currentCelebration = celebrationKey;
    state.participants = celebration.participants;
    state.binId = celebration.binId;
    return true;
  }
  return false;
}

// Clear celebration state (for switching celebrations)
function clearCelebration() {
  state.currentCelebration = null;
  state.celebrationAuth = false;
  state.participants = [];
  state.binId = null;
  state.currentCodename = null;
  state.currentIndex = 0;
  state.data = null;
}

// Fisher-Yates shuffle
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Check if reveal has started (any pairings announced)
function hasRevealStarted() {
  return Object.keys(state.data?.actualPairings || {}).length > 0;
}

// Get count of confirmed pairings (actualPairings: {santa: recipient})
function getConfirmedCount() {
  return Object.keys(state.data?.actualPairings || {}).length;
}

// Find which santa gives to a recipient (inverse lookup)
// Used for anonymity: codename is recipient, need to find their santa
function getSantaForRecipient(recipient) {
  const actual = state.data?.actualPairings || {};
  return Object.keys(actual).find(santa => actual[santa] === recipient) || null;
}
