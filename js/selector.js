/**
 * Oracle11 - Name Selector / Carousel
 */
const Selector = {
  track: null,
  dots: null,
  shuffledNames: [],

  init() {
    this.track = document.querySelector('.carousel-track');
    this.dots = document.querySelector('.name-dots');

    // Shuffle names for display
    this.shuffledNames = shuffle(state.participants);

    const saved = sessionStorage.getItem('oracle11_codename');
    if (saved && this.shuffledNames.includes(saved)) {
      state.currentCodename = saved;
      state.currentIndex = this.shuffledNames.indexOf(saved);
    }

    this.render();
    this.bindEvents();
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
    state.currentIndex = (state.currentIndex - 1 + state.participants.length) % state.participants.length;
    this.updatePosition();
  },

  next() {
    state.currentIndex = (state.currentIndex + 1) % state.participants.length;
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
  }
};
