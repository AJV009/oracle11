/**
 * Oracle11 - JSONBin API Module
 */
const API = {
  baseUrl: 'https://api.jsonbin.io/v3/b',

  async fetchData(skipCache = false) {
    const cached = localStorage.getItem('oracle11_cache');
    const cacheTime = localStorage.getItem('oracle11_cache_time');

    if (!skipCache && cached && cacheTime && Date.now() - parseInt(cacheTime) < 30000) {
      return JSON.parse(cached);
    }

    try {
      const response = await fetch(`${this.baseUrl}/${CONFIG.JSONBIN_BIN_ID}/latest`, {
        headers: { 'X-Access-Key': CONFIG.JSONBIN_API_KEY }
      });

      if (!response.ok) throw new Error('Failed to fetch data');

      const result = await response.json();
      this.updateCache(result.record);
      return result.record;
    } catch (error) {
      console.error('API Error:', error);
      if (cached) {
        Toast.show('Using cached data', 'info');
        return JSON.parse(cached);
      }
      throw error;
    }
  },

  async saveData(data) {
    try {
      const response = await fetch(`${this.baseUrl}/${CONFIG.JSONBIN_BIN_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Access-Key': CONFIG.JSONBIN_API_KEY
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Failed to save data');
      this.updateCache(data);
      return true;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Merge prediction safely with retry logic
  async savePrediction(codename, prediction, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Always fetch fresh (skip cache)
        const data = await this.fetchData(true);
        data.predictions = data.predictions || {};
        data.predictions[codename] = prediction;
        data.lastUpdated = new Date().toISOString();

        await this.saveData(data);

        // Verify our data was saved (skip cache)
        const verify = await this.fetchData(true);
        if (verify.predictions?.[codename]?.timestamp === prediction.timestamp) {
          return data; // Success!
        }

        // Data mismatch - retry
        if (attempt < retries) {
          console.log(`Save conflict detected, retrying (${attempt + 1}/${retries})...`);
          await new Promise(r => setTimeout(r, 100 * (attempt + 1))); // Small backoff
        }
      } catch (error) {
        if (attempt === retries) throw error;
      }
    }
    throw new Error('Failed to save after retries');
  },

  // Merge admin pairings safely
  async saveAdminData(updates, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const data = await this.fetchData(true);
        Object.assign(data, updates);
        data.lastUpdated = new Date().toISOString();
        await this.saveData(data);
        return data;
      } catch (error) {
        if (attempt === retries) throw error;
        await new Promise(r => setTimeout(r, 100 * (attempt + 1)));
      }
    }
    throw new Error('Failed to save after retries');
  },

  updateCache(data) {
    localStorage.setItem('oracle11_cache', JSON.stringify(data));
    localStorage.setItem('oracle11_cache_time', Date.now().toString());
  },

  getDefaultData() {
    return {
      predictions: {},
      actualPairings: null,
      winnersRevealed: false,
      lastUpdated: new Date().toISOString()
    };
  }
};
