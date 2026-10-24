import React, { useState, useMemo, useEffect } from 'react'
import {
  Smartphone,
  Car,
  User,
  Phone,
  Mail,
  ShieldCheck,
  MapPin,
  Wifi,
  Battery,
  HelpCircle,
  CreditCard,
  ChevronRight,
  TrendingUp,
  Mic,
  Camera,
  ArrowLeft,
} from 'lucide-react'

export interface AppMobilePreviewProps {
  platformName: string
  customerLogoUrl: string
  driverLogoUrl: string
  supportPhone: string
  supportEmail: string
  currency: string
  defaultLanguage?: string
  initialMode?: 'side-by-side' | 'ios-home' | 'android-home' | 'in-app'
  compact?: boolean
  onCloseViewer?: () => void
  onPlatformNameChange?: (name: string) => void
}

type AppTarget = 'driver' | 'customer'
type PreviewMode = 'side-by-side' | 'ios-home' | 'android-home' | 'in-app'
type InAppScreen = 'splash' | 'home' | 'support'

function getCurrencySymbol(curr: string): string {
  const c = (curr || '').trim().toUpperCase()
  if (c === 'INR') return '₹'
  if (c === 'USD') return '$'
  if (c === 'EUR') return '€'
  if (c === 'GBP') return '£'
  if (c === 'AED') return 'AED '
  if (c === 'SAR') return 'SAR '
  return c ? `${c} ` : '₹'
}

/* =========================================================================
   IOS SYSTEM ICON
   ========================================================================= */
const IosSystemIcon = ({
  name,
  gradient,
  icon,
}: {
  name: string
  gradient: string
  icon: React.ReactNode
}) => (
  <div className="flex flex-col items-center gap-1">
    <div
      className="w-11 h-11 rounded-[22%] flex items-center justify-center shadow-md overflow-hidden relative select-none"
      style={{ background: gradient }}
    >
      {icon}
    </div>
    <span className="text-[10px] text-white font-medium text-center truncate max-w-[50px] drop-shadow-sm leading-tight">
      {name}
    </span>
  </div>
)

/* =========================================================================
   ANDROID SYSTEM ICON
   ========================================================================= */
const AndroidSystemIcon = ({
  name,
  bg,
  icon,
}: {
  name: string
  bg: string
  icon: React.ReactNode
}) => (
  <div className="flex flex-col items-center gap-1">
    <div
      className="w-11 h-11 rounded-full flex items-center justify-center shadow-xs overflow-hidden relative select-none border border-black/5"
      style={{ background: bg }}
    >
      {icon}
    </div>
    <span className="text-[10px] text-slate-700 dark:text-slate-300 font-medium text-center truncate max-w-[52px] leading-tight">
      {name}
    </span>
  </div>
)

export const AppMobilePreview: React.FC<AppMobilePreviewProps> = ({
  platformName,
  customerLogoUrl,
  driverLogoUrl,
  supportPhone,
  supportEmail,
  currency,
  initialMode = 'side-by-side',
  compact = false,
  onCloseViewer,
  onPlatformNameChange,
}) => {
  const [targetApp, setTargetApp] = useState<AppTarget>('driver')
  const [previewMode, setPreviewMode] = useState<PreviewMode>(
    compact && initialMode === 'side-by-side' ? 'ios-home' : initialMode,
  )
  const [inAppScreen, setInAppScreen] = useState<InAppScreen>('splash')
  const [driverOnline, setDriverOnline] = useState(true)
  const [selectedRide, setSelectedRide] = useState<'cab' | 'auto' | 'bike'>('cab')
  const [logoHasError, setLogoHasError] = useState(false)

  const currencySymbol = useMemo(() => getCurrencySymbol(currency), [currency])
  const name = platformName.trim() || 'Zaroorat'
  const activeLogo = targetApp === 'driver' ? driverLogoUrl : customerLogoUrl

  useEffect(() => {
    setLogoHasError(false)
  }, [activeLogo])

  const appDisplayName = useMemo(() => {
    if (targetApp === 'driver') {
      return name.toLowerCase().includes('driver') ? name : `${name} Driver`
    }
    return name
  }, [name, targetApp])

  const currentTime = useMemo(() => {
    try {
      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    } catch {
      return '10:00'
    }
  }, [])

  /* =========================================================================
     IPHONE DEVICE COMPONENT (IOS HOME SCREEN)
     ========================================================================= */
  const renderIphoneMockup = () => (
    <div className="relative w-[315px] sm:w-[330px] h-[610px] bg-slate-900 dark:bg-slate-950 rounded-[44px] p-2.5 shadow-2xl ring-1 ring-slate-800/80 shadow-slate-900/40 shrink-0">
      {/* Hardware Buttons */}
      <div className="absolute -left-[9px] top-24 w-[3px] h-8 bg-slate-700 rounded-l-sm" />
      <div className="absolute -left-[9px] top-36 w-[3px] h-12 bg-slate-700 rounded-l-sm" />
      <div className="absolute -left-[9px] top-52 w-[3px] h-12 bg-slate-700 rounded-l-sm" />
      <div className="absolute -right-[9px] top-32 w-[3px] h-16 bg-slate-700 rounded-r-sm" />

      {/* Screen Canvas */}
      <div
        className="w-full h-full rounded-[38px] overflow-hidden flex flex-col justify-between relative bg-cover bg-center p-3 pt-2 text-slate-100"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 20%, #ff8a65 0%, #d84315 35%, #303f9f 75%, #1a237e 100%)',
        }}
      >
        {/* iOS Status Bar */}
        <div className="h-9 px-4 flex items-center justify-between text-[11px] font-semibold text-white z-20">
          <span>10:00</span>
          <div className="w-20 h-4 bg-black rounded-full" />
          <div className="flex items-center gap-1.5 text-white">
            <div className="flex items-end gap-0.5 h-2.5">
              <span className="w-0.5 h-1 bg-white rounded-xs" />
              <span className="w-0.5 h-1.5 bg-white rounded-xs" />
              <span className="w-0.5 h-2 bg-white rounded-xs" />
              <span className="w-0.5 h-2.5 bg-white rounded-xs" />
            </div>
            <Wifi className="w-3 h-3" />
            <Battery className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* 4x4 App Icon Grid */}
        <div className="grid grid-cols-4 gap-y-3.5 gap-x-2 px-1 pt-2">
          {/* Row 1 */}
          <IosSystemIcon name="FaceTime" gradient="linear-gradient(135deg, #34C759, #30D158)" icon={<span className="text-white text-base">📹</span>} />
          <IosSystemIcon
            name="Calendar"
            gradient="#FFFFFF"
            icon={
              <div className="text-center">
                <div className="text-[8px] font-bold text-red-500 uppercase leading-none">SAT</div>
                <div className="text-base font-bold text-slate-900 leading-tight">24</div>
              </div>
            }
          />
          <IosSystemIcon name="Photos" gradient="#FFFFFF" icon={<span className="text-base">🌸</span>} />
          <IosSystemIcon name="Camera" gradient="linear-gradient(135deg, #8E8E93, #636366)" icon={<Camera className="w-5 h-5 text-white" />} />

          {/* Row 2 */}
          <IosSystemIcon name="Mail" gradient="linear-gradient(135deg, #007AFF, #5856D6)" icon={<Mail className="w-5 h-5 text-white" />} />
          <IosSystemIcon name="Clock" gradient="#000000" icon={<span className="text-white text-xs font-mono font-bold">10:00</span>} />
          <IosSystemIcon name="Maps" gradient="linear-gradient(135deg, #34C759, #007AFF)" icon={<MapPin className="w-5 h-5 text-white" />} />
          <IosSystemIcon name="Weather" gradient="linear-gradient(135deg, #32ADE6, #007AFF)" icon={<span className="text-base">☀️</span>} />

          {/* Row 3 - PROMINENT APP POSITION IN CENTER */}
          <IosSystemIcon name="Notes" gradient="#FFFFFF" icon={<span className="text-amber-500 text-sm font-bold">📝</span>} />
          {/* YOUR APP ICON (HIGHLIGHTED WITH PULSE) */}
          <div className="flex flex-col items-center gap-1 relative group">
            <div className="absolute -inset-1 rounded-2xl bg-white/30 animate-pulse pointer-events-none" />
            <div
              className="w-12 h-12 rounded-[22%] flex items-center justify-center shadow-2xl overflow-hidden relative ring-2 ring-white select-none z-10 transition-transform group-hover:scale-110 p-1"
              style={{
                background: targetApp === 'driver' ? '#0F172A' : '#1F2B6D',
              }}
            >
              {activeLogo && !logoHasError ? (
                <img
                  src={activeLogo}
                  alt={appDisplayName}
                  className="w-full h-full object-contain"
                  onError={() => setLogoHasError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-extrabold text-lg">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-[10px] text-white font-semibold text-center leading-[1.15] max-w-[74px] line-clamp-2 drop-shadow-md z-10 break-words">
              {appDisplayName}
            </span>
          </div>
          <IosSystemIcon name="Stocks" gradient="#000000" icon={<TrendingUp className="w-5 h-5 text-emerald-400" />} />
          <IosSystemIcon name="App Store" gradient="linear-gradient(135deg, #007AFF, #0040DD)" icon={<span className="text-white font-bold text-base">A</span>} />

          {/* Row 4 */}
          <IosSystemIcon name="Music" gradient="linear-gradient(135deg, #FA2D48, #FB5C74)" icon={<span className="text-white text-base">🎵</span>} />
          <IosSystemIcon name="Podcasts" gradient="linear-gradient(135deg, #AF52DE, #5856D6)" icon={<span className="text-white text-base">🎙️</span>} />
          <IosSystemIcon name="Wallet" gradient="#000000" icon={<CreditCard className="w-5 h-5 text-amber-400" />} />
          <IosSystemIcon name="Settings" gradient="linear-gradient(135deg, #8E8E93, #48484A)" icon={<span className="text-white text-base">⚙️</span>} />
        </div>

        {/* iOS Dock */}
        <div className="pb-1">
          <div className="flex items-center justify-center gap-1.5 mb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
          </div>

          <div className="mx-2 p-2 rounded-[28px] bg-white/20 backdrop-blur-xl border border-white/20 grid grid-cols-4 gap-2 shadow-xl">
            <div className="flex justify-center">
              <div className="w-11 h-11 rounded-[22%] bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-md">
                <Phone className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-11 h-11 rounded-[22%] bg-white flex items-center justify-center shadow-md">
                <span className="text-blue-500 font-bold text-lg">🧭</span>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-11 h-11 rounded-[22%] bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-md">
                <span className="text-white text-base">💬</span>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-11 h-11 rounded-[22%] bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-md">
                <span className="text-white text-base">🎵</span>
              </div>
            </div>
          </div>

          <div className="w-32 h-1 bg-white/60 rounded-full mx-auto mt-2" />
        </div>
      </div>
    </div>
  )

  /* =========================================================================
     ANDROID DEVICE COMPONENT (PIXEL HOME SCREEN)
     ========================================================================= */
  const renderAndroidMockup = () => (
    <div className="relative w-[315px] sm:w-[330px] h-[610px] bg-slate-900 dark:bg-slate-950 rounded-[44px] p-2.5 shadow-2xl ring-1 ring-slate-800/80 shadow-slate-900/40 shrink-0">
      {/* Screen Canvas */}
      <div className="w-full h-full rounded-[38px] overflow-hidden flex flex-col justify-between bg-slate-50 dark:bg-slate-900 p-3 pt-2 text-slate-800 dark:text-slate-100">
        {/* Status Bar */}
        <div className="h-8 px-4 flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
          <span>10:00</span>
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3 h-3" />
            <Battery className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Google Search Widget */}
        <div className="mx-2 my-1 px-3 py-2 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-500 text-xs">G</span>
            <span className="text-slate-400 text-xs">Search apps & web...</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Mic className="w-3.5 h-3.5 text-blue-500" />
            <Camera className="w-3.5 h-3.5 text-rose-500" />
          </div>
        </div>

        {/* Android 5-column grid */}
        <div className="grid grid-cols-5 gap-y-3.5 gap-x-1 px-1 py-2 flex-1 content-start">
          {/* Row 1 */}
          <AndroidSystemIcon name="Chrome" bg="#FFFFFF" icon={<span className="text-base">🌐</span>} />
          <AndroidSystemIcon name="Gmail" bg="#FFFFFF" icon={<span className="text-red-500 font-bold text-sm">M</span>} />
          <AndroidSystemIcon name="Maps" bg="#FFFFFF" icon={<MapPin className="w-5 h-5 text-emerald-600" />} />
          <AndroidSystemIcon name="YouTube" bg="#EA4335" icon={<span className="text-white font-bold text-xs">▶</span>} />
          <AndroidSystemIcon name="Play" bg="#FFFFFF" icon={<span className="text-base">▶️</span>} />

          {/* Row 2 - PROMINENT APP POSITION IN CENTER */}
          <AndroidSystemIcon name="Camera" bg="#5F6368" icon={<Camera className="w-5 h-5 text-white" />} />
          <AndroidSystemIcon name="Photos" bg="#FFFFFF" icon={<span className="text-base">🌸</span>} />
          {/* YOUR ANDROID ADAPTIVE APP ICON */}
          <div className="flex flex-col items-center gap-1 relative group">
            <div className="absolute -inset-1 rounded-full bg-primary/30 animate-pulse pointer-events-none" />
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-xl overflow-hidden relative border-2 border-primary ring-2 ring-white select-none z-10 transition-transform group-hover:scale-110 p-1"
              style={{
                background: targetApp === 'driver' ? '#0F172A' : '#1F2B6D',
              }}
            >
              {activeLogo && !logoHasError ? (
                <img
                  src={activeLogo}
                  alt={appDisplayName}
                  className="w-full h-full object-contain"
                  onError={() => setLogoHasError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-extrabold text-sm">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-900 dark:text-white font-semibold text-center leading-[1.15] max-w-[70px] line-clamp-2 z-10 break-words">
              {appDisplayName}
            </span>
          </div>
          <AndroidSystemIcon name="Messages" bg="#1A73E8" icon={<span className="text-white text-xs">💬</span>} />
          <AndroidSystemIcon name="Settings" bg="#5F6368" icon={<span className="text-white text-sm">⚙️</span>} />

          {/* Row 3 */}
          <AndroidSystemIcon name="Phone" bg="#34A853" icon={<Phone className="w-4 h-4 text-white" />} />
          <AndroidSystemIcon name="Calendar" bg="#FFFFFF" icon={<span className="text-blue-600 font-bold text-xs">31</span>} />
          <AndroidSystemIcon name="Drive" bg="#FFFFFF" icon={<span className="text-base">🔺</span>} />
          <AndroidSystemIcon name="Clock" bg="#1A73E8" icon={<span className="text-white text-xs font-bold">10:0</span>} />
          <AndroidSystemIcon name="Calc" bg="#4285F4" icon={<span className="text-white font-bold text-sm">+-</span>} />
        </div>

        {/* 3-Button Nav */}
        <div className="h-6 flex items-center justify-around px-8 text-slate-400">
          <span className="text-xs">◁</span>
          <span className="text-xs">○</span>
          <span className="text-xs">▢</span>
        </div>
      </div>
    </div>
  )

  /* =========================================================================
     IN-APP VIEW (SPLASH, HOME, SUPPORT)
     ========================================================================= */
  const renderInAppMockup = () => (
    <div className="relative w-[315px] sm:w-[330px] h-[610px] bg-slate-900 dark:bg-slate-950 rounded-[44px] p-2.5 shadow-2xl ring-1 ring-slate-800/80 shadow-slate-900/40 shrink-0">
      <div className="w-full h-full rounded-[38px] overflow-hidden flex flex-col justify-between bg-slate-950 text-white">
        {/* Status Bar */}
        <div className="h-9 px-6 pt-2 flex items-center justify-between text-[11px] font-semibold text-white/90 z-20">
          <span>{currentTime}</span>
          <div className="w-20 h-4 bg-black rounded-full" />
          <div className="flex items-center gap-1.5 text-white/80">
            <Wifi className="w-3 h-3" />
            <Battery className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Screen 1: Splash / Login */}
        {inAppScreen === 'splash' && (
          <div
            className="flex-1 flex flex-col justify-between p-6"
            style={{
              background:
                targetApp === 'driver'
                  ? 'linear-gradient(180deg, #101935 0%, #0B1120 100%)'
                  : 'linear-gradient(180deg, #1E2B6D 0%, #0F172A 100%)',
            }}
          >
            <div className="flex flex-col items-center text-center mt-6">
              <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-2.5 flex items-center justify-center shadow-lg mb-4">
                {activeLogo ? (
                  <img
                    src={activeLogo}
                    alt={`${name} Logo`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      ;(e.target as HTMLElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-900 font-extrabold text-xl shadow">
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white mb-1">{name}</h2>
              <p className="text-xs text-white/70 max-w-[200px] leading-relaxed">
                {targetApp === 'driver'
                  ? 'Drive, Deliver & Earn with 0% Commission'
                  : 'Everyday rides made effortless, safe & quick'}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 space-y-3 shadow-xl">
              <div className="text-left">
                <p className="text-xs font-semibold text-white/90">Enter your mobile number</p>
                <p className="text-[10px] text-white/60">We will send an OTP verification code</p>
              </div>
              <div className="flex items-center gap-2 bg-black/30 rounded-xl px-3 py-2 border border-white/10">
                <span className="text-xs font-bold text-white/90">🇮🇳 +91</span>
                <span className="text-xs text-white/40">98765 43210</span>
              </div>
              <button
                type="button"
                className="w-full py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs shadow hover:bg-white/95 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Get Started with OTP</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <div className="pt-1 text-center">
                <span className="text-[10px] text-white/50">
                  Need help? Call{' '}
                  <span className="text-white font-medium">{supportPhone || '+91 98765 43210'}</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Screen 2: Home Dashboard */}
        {inAppScreen === 'home' && (
          <div className="flex-1 flex flex-col bg-slate-950 text-white">
            <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between bg-slate-900/60 backdrop-blur-md">
              <div className="flex items-center gap-2">
                {activeLogo ? (
                  <img
                    src={activeLogo}
                    alt="Logo"
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      ;(e.target as HTMLElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-6 h-6 rounded-md bg-white text-slate-900 font-bold text-xs flex items-center justify-center">
                    {name.charAt(0)}
                  </div>
                )}
                <span className="text-xs font-bold">{name}</span>
              </div>

              {targetApp === 'driver' ? (
                <button
                  type="button"
                  onClick={() => setDriverOnline(!driverOnline)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                    driverOnline
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      driverOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                    }`}
                  />
                  {driverOnline ? 'Online' : 'Offline'}
                </button>
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-[10px] font-bold">
                  JD
                </div>
              )}
            </div>

            {targetApp === 'driver' ? (
              <div className="flex-1 p-3.5 space-y-3 overflow-y-auto">
                <div className="bg-gradient-to-r from-blue-950 to-indigo-950 rounded-2xl p-3.5 border border-blue-800/40 shadow-lg">
                  <div className="flex items-center justify-between text-white/70 text-[10px] font-medium">
                    <span>Today's Net Earnings</span>
                    <span className="flex items-center text-emerald-400 gap-0.5">
                      <TrendingUp className="w-3 h-3" /> +14%
                    </span>
                  </div>
                  <div className="text-2xl font-black text-white mt-1">{currencySymbol}1,840</div>
                  <div className="flex items-center gap-3 text-[10px] text-white/60 mt-2 pt-2 border-t border-white/10">
                    <span>6 Trips Done</span>
                    <span>·</span>
                    <span>4.8 hrs Online</span>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-xl p-3 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/60 font-medium">Commission Wallet</p>
                      <p className="text-xs font-bold text-white">{currencySymbol}350.00</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    Recharge
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex-1 p-3.5 space-y-3 overflow-y-auto">
                <div className="bg-slate-900 rounded-xl p-3 border border-white/10 flex items-center gap-2.5 shadow-sm">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="flex-1 text-left">
                    <p className="text-[10px] text-white/50">Where are you going?</p>
                    <p className="text-xs font-semibold text-white">Search destination...</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-white/70">Available Rides</p>
                  {[
                    { id: 'cab', title: 'City Cab', time: '3 min away', price: 180, icon: '🚗' },
                    { id: 'auto', title: 'Express Auto', time: '2 min away', price: 95, icon: '🛺' },
                    { id: 'bike', title: 'Moto Bike', time: '1 min away', price: 45, icon: '🏍️' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedRide(item.id as any)}
                      className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                        selectedRide === item.id
                          ? 'bg-indigo-950/60 border-indigo-500/80 shadow-md'
                          : 'bg-slate-900 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{item.icon}</span>
                        <div className="text-left">
                          <p className="text-xs font-bold text-white">{item.title}</p>
                          <p className="text-[10px] text-white/50">{item.time}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-white">
                        {currencySymbol}
                        {item.price}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Screen 3: Support */}
        {inAppScreen === 'support' && (
          <div className="flex-1 flex flex-col bg-slate-950 text-white p-4 space-y-3.5 overflow-y-auto">
            <div className="text-center pt-2">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 mx-auto flex items-center justify-center mb-2">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">24/7 Support Center</h3>
              <p className="text-[10px] text-white/60">
                Direct assistance for {name} {targetApp === 'driver' ? 'Drivers' : 'Riders'}
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <div className="bg-slate-900 rounded-xl p-3 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-white/50 font-medium">Customer Hotline</p>
                    <p className="text-xs font-bold text-white">
                      {supportPhone || '+91 98765 43210'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Call
                </span>
              </div>

              <div className="bg-slate-900 rounded-xl p-3 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-white/50 font-medium">Email Desk</p>
                    <p className="text-xs font-bold text-white truncate max-w-[150px]">
                      {supportEmail || 'support@zaroorat.com'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  Mail
                </span>
              </div>

              <div className="bg-rose-950/40 rounded-xl p-3 border border-rose-800/40 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-rose-300 font-semibold">Emergency SOS Response</p>
                  <p className="text-[10px] text-white/60">Monitored live with local dispatch</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Home Indicator */}
        <div className="h-5 flex items-center justify-center bg-transparent">
          <div className="w-32 h-1 bg-white/40 rounded-full" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col items-center w-full select-none">
      {/* COMPACT MODE HEADER (Used in Configuration Form right column) */}
      {compact ? (
        <div className="w-full bg-white dark:bg-slate-900 rounded-xl p-2.5 border border-border shadow-xs mb-3 space-y-2">
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            {/* Target App Switcher (Driver vs Customer) */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTargetApp('driver')}
                className={`flex items-center gap-1 py-1 px-2.5 rounded-md transition-all ${
                  targetApp === 'driver'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                <Car className="w-3 h-3" />
                <span>Driver</span>
              </button>
              <button
                type="button"
                onClick={() => setTargetApp('customer')}
                className={`flex items-center gap-1 py-1 px-2.5 rounded-md transition-all ${
                  targetApp === 'customer'
                    ? 'bg-indigo-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                <User className="w-3 h-3" />
                <span>Customer</span>
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400">
              <button
                type="button"
                onClick={() => setPreviewMode('ios-home')}
                className={`py-1 px-2 rounded-md transition-all ${
                  previewMode === 'ios-home'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                 iOS
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('android-home')}
                className={`py-1 px-2 rounded-md transition-all ${
                  previewMode === 'android-home'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🤖 Android
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('in-app')}
                className={`py-1 px-2 rounded-md transition-all ${
                  previewMode === 'in-app'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                📲 In-App
              </button>
            </div>
          </div>

          {previewMode === 'in-app' && (
            <div className="flex items-center justify-center gap-1.5 pt-1.5 border-t border-border">
              <button
                type="button"
                onClick={() => setInAppScreen('splash')}
                className={`py-0.5 px-2 rounded text-[11px] font-medium transition-colors ${
                  inAppScreen === 'splash'
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                }`}
              >
                Splash
              </button>
              <button
                type="button"
                onClick={() => setInAppScreen('home')}
                className={`py-0.5 px-2 rounded text-[11px] font-medium transition-colors ${
                  inAppScreen === 'home'
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                }`}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => setInAppScreen('support')}
                className={`py-0.5 px-2 rounded text-[11px] font-medium transition-colors ${
                  inAppScreen === 'support'
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                }`}
              >
                Support
              </button>
            </div>
          )}
        </div>
      ) : (
        /* FULL STUDIO HEADER (Used in Dedicated Viewer Tab) */
        <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl p-4 border border-border shadow-xs mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              {onCloseViewer && (
                <button
                  type="button"
                  onClick={onCloseViewer}
                  className="p-1.5 rounded-lg border border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Back to Configuration Form"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    App Logo & Homescreen Viewer
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Exact iOS squircle and Android circular preview (powered like AppLogoViewer.com)
                  </p>
                </div>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/60 self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Real-time Sync
            </span>
          </div>

          {/* App Name Input Box (like AppLogoViewer.com top input) */}
          {onPlatformNameChange && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                Input your App Name:
              </span>
              <input
                type="text"
                value={platformName}
                onChange={(e) => onPlatformNameChange(e.target.value)}
                placeholder="e.g. Zaroorat"
                className="w-full sm:max-w-xs px-3 py-1.5 text-sm font-semibold rounded-lg border border-border bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {/* Switchers Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Target App Switcher (Driver vs Customer) */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTargetApp('driver')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                  targetApp === 'driver'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                Driver App Icon
              </button>
              <button
                type="button"
                onClick={() => setTargetApp('customer')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                  targetApp === 'customer'
                    ? 'bg-indigo-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Customer App Icon
              </button>
            </div>

            {/* View Modes (Side-by-Side, iOS Only, Android Only, In-App) */}
            <div className="flex flex-wrap items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <button
                type="button"
                onClick={() => setPreviewMode('side-by-side')}
                className={`py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                  previewMode === 'side-by-side'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                📱 Side-by-Side (Both)
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('ios-home')}
                className={`py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                  previewMode === 'ios-home'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                 iOS Only
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('android-home')}
                className={`py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                  previewMode === 'android-home'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🤖 Android Only
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('in-app')}
                className={`py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                  previewMode === 'in-app'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                📲 In-App Screens
              </button>
            </div>
          </div>

          {/* Sub-tabs if In-App is selected */}
          {previewMode === 'in-app' && (
            <div className="flex items-center justify-center gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setInAppScreen('splash')}
                className={`py-1 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  inAppScreen === 'splash'
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Splash / Login
              </button>
              <button
                type="button"
                onClick={() => setInAppScreen('home')}
                className={`py-1 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  inAppScreen === 'home'
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Home Dashboard
              </button>
              <button
                type="button"
                onClick={() => setInAppScreen('support')}
                className={`py-1 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  inAppScreen === 'support'
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Support Center
              </button>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          DEVICE RENDERING CONTAINER
          ========================================================================= */}
      <div className={compact ? 'w-full flex justify-center scale-[0.93] origin-top' : 'w-full'}>
        {previewMode === 'side-by-side' && !compact ? (
          /* SIDE-BY-SIDE: EXACTLY LIKE APPLOGOVIEWER.COM */
          <div className="flex flex-wrap items-center justify-center gap-8 w-full pb-8 scale-95 sm:scale-100 origin-top">
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                 iPhone iOS Home Screen (Squircle)
              </span>
              {renderIphoneMockup()}
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                🤖 Google Pixel Android Home Screen (Circle)
              </span>
              {renderAndroidMockup()}
            </div>
          </div>
        ) : previewMode === 'ios-home' || (compact && previewMode === 'side-by-side') ? (
          <div className="flex flex-col items-center pb-8">
            {!compact && (
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                 iPhone iOS Home Screen
              </span>
            )}
            {renderIphoneMockup()}
          </div>
        ) : previewMode === 'android-home' ? (
          <div className="flex flex-col items-center pb-8">
            {!compact && (
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                🤖 Google Pixel Android Home Screen
              </span>
            )}
            {renderAndroidMockup()}
          </div>
        ) : (
          <div className="flex flex-col items-center pb-8">
            {!compact && (
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                📲 Mobile In-App View
              </span>
            )}
            {renderInAppMockup()}
          </div>
        )}
      </div>
    </div>
  )
}

export default AppMobilePreview
