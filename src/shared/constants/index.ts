/**
 * Global application constants
 */

export const PAGINATION_LIMITS = [10, 20, 50, 100] as const

export const VEHICLE_TYPES = {
  AUTO: 'Auto',
  BIKE: 'Bike',
  MINI: 'Mini Cab',
  SEDAN: 'Sedan Cab',
  SUV: 'SUV Cab',
} as const

export const SYSTEM_ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  SUPPORT: 'support',
  DISPATCHER: 'dispatcher',
} as const
