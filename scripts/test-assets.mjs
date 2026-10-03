// Lets `node --test` import the Vite asset imports (CSS, images) that map components use.
// CSS becomes an empty module and an image its URL, which is what Vite hands the app.
import { register } from 'node:module'

const hooks = `
export async function load(url, context, next) {
  if (url.endsWith('.css')) return { format: 'module', source: '', shortCircuit: true }
  if (['.png', '.jpg', '.jpeg', '.gif', '.svg'].some((ext) => url.endsWith(ext))) {
    return { format: 'module', source: 'export default ' + JSON.stringify(url), shortCircuit: true }
  }
  return next(url, context)
}`

register('data:text/javascript,' + encodeURIComponent(hooks))
