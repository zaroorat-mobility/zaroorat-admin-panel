let mapplsPromise: Promise<any> | null = null
let currentLoadedKey = ''

/**
 * Loads the official Mappls Web Maps GL vector SDK script dynamically.
 */
export function loadMapplsSdk(apiKey: string): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Mappls SDK can only be loaded in browser environment'))
  }

  const win = window as any
  if (win.mappls && win.mappls.Map) {
    return Promise.resolve(win.mappls)
  }

  const keyToUse = apiKey?.trim() || ''
  if (!keyToUse) {
    return Promise.reject(new Error('Mappls Client SDK Key is required'))
  }

  if (mapplsPromise && currentLoadedKey === keyToUse) {
    return mapplsPromise
  }

  currentLoadedKey = keyToUse

  mapplsPromise = new Promise((resolve, reject) => {
    // Check if script element already exists
    const existing = document.getElementById('mappls-web-sdk-script')
    if (existing) {
      existing.remove()
    }

    const script = document.createElement('script')
    script.id = 'mappls-web-sdk-script'
    script.src = `https://apis.mappls.com/advancedmaps/api/${encodeURIComponent(keyToUse)}/map_sdk?v=3.0&layer=vector`
    script.async = true
    script.defer = true

    script.onload = () => {
      if (win.mappls) {
        resolve(win.mappls)
      } else {
        reject(new Error('Mappls global object not found after script load'))
      }
    }

    script.onerror = () => {
      mapplsPromise = null
      reject(new Error('Failed to load Mappls Web Maps script from apis.mappls.com'))
    }

    document.head.appendChild(script)
  })

  return mapplsPromise
}
