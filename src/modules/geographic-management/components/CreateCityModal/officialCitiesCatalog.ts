/**
 * Official Cities Catalog — Production Bridge
 * Cities come from the built-in official district list and Google Places search.
 * @see ../../services/geocodingService
 */

import type { LiveCityItem } from '../../services/geocodingService'

/**
 * Structural type for official city items, matching LiveCityItem.
 */
export type OfficialCityItem = LiveCityItem

/**
 * Deprecated: Hardcoded catalog eliminated for production.
 * City data now comes from geocodingService.
 */
export const OFFICIAL_CITIES_CATALOG: OfficialCityItem[] = []
