export type ReferralAudience = 'RIDER' | 'DRIVER'
export type ReferralSegment = 'rider' | 'driver'

export interface ReferralSegmentConfig {
  segment: ReferralSegment
  audience: ReferralAudience
  title: string
  programsTitle: string
  codesTitle: string
  historyTitle: string
  newUserLabel: string
  /// False for riders: customer wallets are retired, so rider referrals pay no
  /// money and the backend rejects a reward wallet, amounts or milestone bonus.
  monetary: boolean
  description: {
    programs: string
    codes: string
    history: string
    form: string
  }
  defaultReferrerReward: number
  defaultRefereeReward: number
  defaultQualifyingEvent: string
  qualifyingOptions: { value: string; label: string }[]
}

export const REFERRAL_SEGMENTS: Record<ReferralSegment, ReferralSegmentConfig> = {
  rider: {
    segment: 'rider',
    audience: 'RIDER',
    title: 'Rider referrals',
    programsTitle: 'Rider programs',
    codesTitle: 'Rider codes',
    historyTitle: 'Rider referral history',
    newUserLabel: 'New rider reward',
    monetary: false,
    description: {
      programs: 'Riders invite friends; the referral is tracked until the friend completes a qualifying ride. Rider referrals are non-monetary.',
      codes: 'Invite codes issued to riders for rider referral programs.',
      history: 'Rider invite lifecycle from signup through qualification.',
      form: 'Set eligibility, caps, and active window for a rider referral program.',
    },
    defaultReferrerReward: 0,
    defaultRefereeReward: 0,
    defaultQualifyingEvent: 'FIRST_RIDE',
    qualifyingOptions: [
      { value: 'FIRST_RIDE', label: 'First completed ride' },
      { value: 'NTH_RIDE', label: 'Nth completed ride' },
      { value: 'SIGNUP', label: 'Signup only' },
    ],
  },
  driver: {
    segment: 'driver',
    audience: 'DRIVER',
    title: 'Driver recruitment',
    programsTitle: 'Driver programs',
    codesTitle: 'Driver codes',
    historyTitle: 'Driver recruitment history',
    newUserLabel: 'New driver reward',
    monetary: true,
    description: {
      programs: 'Verified drivers refer new applicants; rewards credit driver wallets when recruits qualify.',
      codes: 'Recruitment codes issued to verified drivers.',
      history: 'Driver recruitment lifecycle from application through reward.',
      form: 'Set rewards, eligibility, caps, and active window for a driver recruitment program.',
    },
    defaultReferrerReward: 500,
    defaultRefereeReward: 200,
    defaultQualifyingEvent: 'DRIVER_APPROVED',
    qualifyingOptions: [
      { value: 'DRIVER_APPROVED', label: 'Driver approved' },
      { value: 'DRIVER_FIRST_RIDE', label: 'First completed trip as driver' },
      { value: 'DRIVER_NTH_RIDE', label: 'Nth completed trip as driver' },
    ],
  },
}

export function segmentFromPathname(pathname: string): ReferralSegment {
  return pathname.includes('/referral-management/driver') ? 'driver' : 'rider'
}

export function programsBasePath(segment: ReferralSegment): string {
  return `/referral-management/${segment}/programs`
}
