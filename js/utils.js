/**
 * Oracle11 - Utilities (Toast, Loading)
 */
const Toast = {
  container: null,

  init() {
    this.container = document.getElementById('toast-container');
  },

  show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    this.container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }
};

const Loading = {
  overlay: null,

  init() {
    this.overlay = document.getElementById('loading-overlay');
  },

  show() {
    this.overlay.classList.remove('hidden');
    state.isLoading = true;
  },

  hide() {
    this.overlay.classList.add('hidden');
    state.isLoading = false;
  }
};
