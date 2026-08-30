export interface GstConfig {
  cgst: number
  sgst: number
  igst: number
  gstin: string
}

const GST_CONFIG_KEY = 'zaroorat_gst_config'

const DEFAULT_GST: GstConfig = {
  cgst: 2.5,
  sgst: 2.5,
  igst: 5.0,
  gstin: '29AAAAA1111A1Z1',
}

export function loadGstConfig(): GstConfig {
  const raw = localStorage.getItem(GST_CONFIG_KEY)
  if (!raw) return { ...DEFAULT_GST }
  try {
    return { ...DEFAULT_GST, ...(JSON.parse(raw) as Partial<GstConfig>) }
  } catch {
    return { ...DEFAULT_GST }
  }
}

export function saveGstConfig(config: GstConfig): void {
  localStorage.setItem(GST_CONFIG_KEY, JSON.stringify(config))
}

export function getIntraStateGstRate(): number {
  const { cgst, sgst } = loadGstConfig()
  return cgst + sgst
}
