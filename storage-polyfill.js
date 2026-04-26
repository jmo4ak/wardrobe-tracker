// Storage polyfill — when running outside Claude, falls back to localStorage
if (!window.storage) {
  window.storage = {
    async get(key) {
      try {
        const value = localStorage.getItem('wardrobe_' + key);
        if (value === null) throw new Error('not found');
        return { key, value };
      } catch {
        throw new Error('Key not found: ' + key);
      }
    },
    async set(key, value) {
      localStorage.setItem('wardrobe_' + key, value);
      return { key, value };
    },
    async delete(key) {
      localStorage.removeItem('wardrobe_' + key);
      return { key, deleted: true };
    },
    async list(prefix) {
      const keys = Object.keys(localStorage)
        .filter(k => k.startsWith('wardrobe_' + (prefix || '')))
        .map(k => k.replace('wardrobe_', ''));
      return { keys };
    }
  };
}
