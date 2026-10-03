/**
 * Type-safe browser storage wrappers
 */
export const storage = {
  get: <T>(key: string, defaultValue: T | null = null): T | null => {
    try {
      if (typeof localStorage === 'undefined') return defaultValue
      const item = localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : defaultValue
    } catch (error) {
      console.error(`Error reading key "${key}" from localStorage`, error)
      return defaultValue
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      if (typeof localStorage === 'undefined') return
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error setting key "${key}" to localStorage`, error)
    }
  },

  remove: (key: string): void => {
    try {
      if (typeof localStorage === 'undefined') return
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing key "${key}" from localStorage`, error)
    }
  },

  clear: (): void => {
    try {
      if (typeof localStorage === 'undefined') return
      localStorage.clear()
    } catch (error) {
      console.error('Error clearing localStorage', error)
    }
  },

  session: {
    get: <T>(key: string, defaultValue: T | null = null): T | null => {
      try {
        if (typeof sessionStorage === 'undefined') return defaultValue
        const item = sessionStorage.getItem(key)
        return item ? (JSON.parse(item) as T) : defaultValue
      } catch (error) {
        console.error(`Error reading key "${key}" from sessionStorage`, error)
        return defaultValue
      }
    },

    set: <T>(key: string, value: T): void => {
      try {
        if (typeof sessionStorage === 'undefined') return
        sessionStorage.setItem(key, JSON.stringify(value))
      } catch (error) {
        console.error(`Error setting key "${key}" to sessionStorage`, error)
      }
    },

    remove: (key: string): void => {
      try {
        if (typeof sessionStorage === 'undefined') return
        sessionStorage.removeItem(key)
      } catch (error) {
        console.error(`Error removing key "${key}" from sessionStorage`, error)
      }
    },
  },
}
export default storage
