/**
 * Oracle11 - Name Selector / Carousel
 */
const Selector = {
  track: null,
  dots: null,
  shuffledNames: [],
  eventsBound: false,

  init() {
    this.track = document.querySelector('.carousel-track');
    this.dots = document.querySelector('.name-dots');

    // Display current celebration name
    const celebrationNameEl = document.getElementById('current-celebration-name');
    const celebration = getCurrentCelebration();
    if (celebrationNameEl && celebration) {
      celebrationNameEl.textContent = celebration.name;
    }

    // Shuffle names for display
    this.shuffledNames = shuffle(state.participants);

    const saved = sessionStorage.getItem('oracle11_codename');
    if (saved && this.shuffledNames.includes(saved)) {
      state.currentCodename = saved;
      state.currentIndex = this.shuffledNames.indexOf(saved);
    }

    this.render();
    if (!this.eventsBound) {
      this.bindEvents();
      this.eventsBound = true;
    }
  },

  render() {
    this.track.innerHTML = this.shuffledNames.map((name, i) =>
      `<div class="carousel-item ${i === state.currentIndex ? 'active' : ''}">${name}</div>`
    ).join('');

    this.dots.innerHTML = this.shuffledNames.map((_, i) =>
      `<div class="name-dot ${i === state.currentIndex ? 'active' : ''}" data-index="${i}"></div>`
    ).join('');

    this.updatePosition();
  },

  bindEvents() {
    document.querySelector('.carousel-btn.prev').addEventListener('click', () => this.prev());
    document.querySelector('.carousel-btn.next').addEventListener('click', () => this.next());
    this.dots.addEventListener('click', e => {
      if (e.target.classList.contains('name-dot')) {
        this.goTo(parseInt(e.target.dataset.index));
      }
    });
    document.getElementById('confirm-name').addEventListener('click', () => this.confirm());

    // Change celebration button
    const changeCelebrationBtn = document.getElementById('change-celebration');
    if (changeCelebrationBtn) {
      changeCelebrationBtn.addEventListener('click', () => this.changeCelebration());
    }

    // Touch support
    let touchStartX = 0;
    const carousel = document.querySelector('.carousel-display');
    carousel.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    carousel.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) diff > 0 ? this.next() : this.prev();
    }, { passive: true });

    // Keyboard
    document.addEventListener('keydown', e => {
      if (Router.getCurrentView() !== 'selector') return;
      if (e.key === 'ArrowLeft') this.prev();
      if (e.key === 'ArrowRight') this.next();
      if (e.key === 'Enter') this.confirm();
    });
  },

  prev() {
    const len = this.shuffledNames.length;
    state.currentIndex = (state.currentIndex - 1 + len) % len;
    this.updatePosition();
  },

  next() {
    const len = this.shuffledNames.length;
    state.currentIndex = (state.currentIndex + 1) % len;
    this.updatePosition();
  },

  goTo(index) {
    state.currentIndex = index;
    this.updatePosition();
  },

  updatePosition() {
    this.track.style.transform = `translateX(-${state.currentIndex * 100}%)`;
    this.track.querySelectorAll('.carousel-item').forEach((el, i) => {
      el.classList.toggle('active', i === state.currentIndex);
    });
    this.dots.querySelectorAll('.name-dot').forEach((el, i) => {
      el.classList.toggle('active', i === state.currentIndex);
    });
  },

  confirm() {
    state.currentCodename = this.shuffledNames[state.currentIndex];
    sessionStorage.setItem('oracle11_codename', state.currentCodename);
    Router.navigate('predict');
  },

  changeCelebration() {
    // Clear celebration session
    clearCelebration();
    sessionStorage.removeItem('oracle11_celebration');
    sessionStorage.removeItem('oracle11_celebration_auth');
    sessionStorage.removeItem('oracle11_codename');

    Router.navigate('celebrations');
  }
};
