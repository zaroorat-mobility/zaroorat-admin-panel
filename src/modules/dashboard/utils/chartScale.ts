/**
 * Linear value → SVG y for the financial area charts. The domain always spans
 * min(0, lowest value) to max(0, highest value), so a real negative day plots below
 * the zero line instead of off the chart, and no value is ever clamped.
 *
 * @param top    y of the plot's top edge
 * @param height plot height in SVG units
 */
export function valueScale(values: number[], top: number, height: number) {
  const min = Math.min(0, ...values)
  const max = Math.max(0, ...values)
  const flat = min === max // every value is 0: a flat line on the bottom edge
  const hi = flat ? 1 : max
  const y = (v: number) => top + ((hi - v) / (hi - min)) * height
  const ticks = flat ? [0] : [0, 0.25, 0.5, 0.75, 1].map((r) => max - r * (max - min))
  return { min, max, y, zeroY: y(0), ticks }
}
