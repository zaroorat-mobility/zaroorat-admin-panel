/**
 * Official Cities Catalog — Production Bridge
 * Hardcoded catalog eliminated in favor of real-time OpenStreetMap geocoding service.
 * @see ../../services/geocodingService
 */

import type { LiveCityItem } from '../../services/geocodingService'

/**
 * Structural type for official city items, matching LiveCityItem.
 */
export type OfficialCityItem = LiveCityItem

/**
 * Deprecated: Hardcoded catalog eliminated for production.
 * Live data is now resolved dynamically via geocodingService.
 */
export const OFFICIAL_CITIES_CATALOG: OfficialCityItem[] = []
