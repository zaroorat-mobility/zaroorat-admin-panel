import { useLocation } from 'react-router-dom'
import {
  REFERRAL_SEGMENTS,
  segmentFromPathname,
  type ReferralSegment,
  type ReferralSegmentConfig,
} from '../constants'

export function useReferralSegment(): ReferralSegmentConfig {
  const { pathname } = useLocation()
  const segment: ReferralSegment = segmentFromPathname(pathname)
  return REFERRAL_SEGMENTS[segment]
}
