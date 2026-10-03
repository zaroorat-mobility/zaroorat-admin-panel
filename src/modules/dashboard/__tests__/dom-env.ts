/**
 * A jsdom browser environment for tests that mount real components (Leaflet map lifecycle).
 * Import it FIRST: Leaflet inspects window / navigator when its module loads.
 */
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
})
const win = dom.window as unknown as Record<string, unknown>

for (const key of Object.getOwnPropertyNames(win)) {
  if (key in globalThis) continue
  Object.defineProperty(globalThis, key, { value: win[key], configurable: true, writable: true })
}
for (const key of ['window', 'document', 'navigator', 'self']) {
  Object.defineProperty(globalThis, key, {
    value: key === 'window' || key === 'self' ? dom.window : win[key],
    configurable: true,
    writable: true,
  })
}

// jsdom does no layout. Give the map container a real size so Leaflet can fit bounds.
Object.defineProperty(dom.window.HTMLElement.prototype, 'clientWidth', { get: () => 800, configurable: true })
Object.defineProperty(dom.window.HTMLElement.prototype, 'clientHeight', { get: () => 290, configurable: true })

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

export { dom }
