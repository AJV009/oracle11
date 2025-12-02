/**
 * Oracle11 - Christmas Decorations Generator
 */
const Decorations = {
  config: {
    glowStars: 60,
    snowflakes: 30,
    ornaments: 8,
    candyCanes: 3,
    stars: 6,
    gifts: 4
  },

  init() {
    this.generateStarfield();
    this.generateSnowflakes();
    this.generateDecorations();
  },

  rand(min, max) {
    return Math.random() * (max - min) + min;
  },

  pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  generateStarfield() {
    const container = document.getElementById('starfield');
    const fragment = document.createDocumentFragment();
    const colors = ['white', 'white', 'white', 'gold', 'blue', 'pink'];

    for (let i = 0; i < this.config.glowStars; i++) {
      const star = document.createElement('div');
      const size = this.rand(2, 5);
      star.className = `glow-star ${this.pick(colors)}`;
      Object.assign(star.style, {
        left: `${this.rand(0, 100)}%`,
        top: `${this.rand(0, 100)}%`,
        width: `${size}px`,
        height: `${size}px`,
        animationDuration: `${this.rand(2, 5)}s`,
        animationDelay: `${this.rand(0, 3)}s`
      });
      fragment.appendChild(star);
    }
    container.appendChild(fragment);
  },

  generateSnowflakes() {
    const container = document.getElementById('snowfall');
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < this.config.snowflakes; i++) {
      const snow = document.createElement('div');
      snow.className = 'snow';
      Object.assign(snow.style, {
        left: `${this.rand(0, 100)}%`,
        width: `${this.rand(4, 10)}px`,
        height: `${this.rand(4, 10)}px`,
        animationDuration: `${this.rand(8, 15)}s`,
        animationDelay: `${this.rand(0, 5)}s`
      });
      fragment.appendChild(snow);
    }
    container.appendChild(fragment);
  },

  generateDecorations() {
    const container = document.getElementById('decorations');
    const fragment = document.createDocumentFragment();

    // Ornaments
    const colors = ['red', 'gold', 'green'];
    for (let i = 0; i < this.config.ornaments; i++) {
      const el = document.createElement('div');
      el.className = `ornament ${this.pick(colors)}`;
      Object.assign(el.style, {
        left: `${this.rand(5, 95)}%`,
        animationDelay: `${this.rand(0, 15)}s`,
        animationDuration: `${this.rand(18, 25)}s`
      });
      fragment.appendChild(el);
    }

    // Candy canes
    for (let i = 0; i < this.config.candyCanes; i++) {
      const el = document.createElement('div');
      el.className = 'candy-cane';
      Object.assign(el.style, {
        left: `${this.rand(5, 95)}%`,
        animationDelay: `${this.rand(0, 10)}s`,
        animationDuration: `${this.rand(22, 30)}s`
      });
      fragment.appendChild(el);
    }

    // Stars
    for (let i = 0; i < this.config.stars; i++) {
      const el = document.createElement('div');
      el.className = `star ${Math.random() > 0.5 ? 'small' : ''}`;
      Object.assign(el.style, {
        left: `${this.rand(5, 95)}%`,
        top: `${this.rand(3, 20)}%`,
        animationDelay: `${this.rand(0, 2)}s`
      });
      fragment.appendChild(el);
    }

    // Gifts (falling)
    for (let i = 0; i < this.config.gifts; i++) {
      const el = document.createElement('div');
      el.className = 'gift';
      Object.assign(el.style, {
        left: `${this.rand(5, 95)}%`,
        animationDelay: `${this.rand(0, 15)}s`,
        animationDuration: `${this.rand(25, 35)}s`
      });
      fragment.appendChild(el);
    }

    container.appendChild(fragment);
  }
};
