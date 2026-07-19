import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  type Country,
  getCountries,
  getCountryCallingCode,
} from 'react-phone-number-input'
import en from 'react-phone-number-input/locale/en'
import * as Flags from 'country-flag-icons/react/3x2'
import 'react-phone-number-input/style.css'
import { ChevronDown, Search, X } from 'lucide-react'
import { cn } from '@/shared/utils'

export interface PhoneInputProps {
  label?: string
  name?: string
  value?: string
  onChange: (value: string | undefined) => void
  required?: boolean
  error?: string
  placeholder?: string
  disabled?: boolean
  defaultCountry?: Country
}

interface CountryOption {
  value: Country
  label: string
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  name,
  value,
  onChange,
  required = false,
  error,
  placeholder = 'Enter phone number',
  disabled = false,
  defaultCountry = 'IN' as Country,
}) => {
  const [country, setCountry] = useState<Country>(defaultCountry)
  const [isCountryOpen, setIsCountryOpen] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (defaultCountry) setCountry(defaultCountry)
  }, [defaultCountry])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsCountryOpen(false)
        setCountrySearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const countryOptions = useMemo<CountryOption[]>(() =>
    getCountries().map((c) => ({
      value: c,
      label: `${(en as any)[c] || c} (+${getCountryCallingCode(c)})`,
    })), [])

  const filteredCountryOptions = countryOptions.filter((o) =>
    o.label.toLowerCase().includes(countrySearch.toLowerCase())
  )

  const FlagComponent = country && (Flags as any)[country] ? (Flags as any)[country] : null
  const selectedCountry = countryOptions.find((o) => o.value === country)

  // Derive local digits from the stored E.164 value (e.g. "+919876543210" → "9876543210")
  const callingCode = getCountryCallingCode(country)
  const localDigits = (() => {
    if (!value) return ''
    const prefix = `+${callingCode}`
    if (value.startsWith(prefix)) return value.slice(prefix.length)
    // fallback: strip all non-digits
    return value.replace(/\D/g, '').slice(callingCode.length)
  })()

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only digits, no leading zeros, max 10
    const digits = e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 10)
    onChange(digits ? `+${callingCode}${digits}` : undefined)
  }

  return (
    <div className="flex flex-col gap-1.5 text-left w-full">
      {label && (
        <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label} {required && <span className="text-red-500 ml-0.5">*</span>}
        </span>
      )}

      <div className="flex items-stretch shadow-sm rounded-lg overflow-hidden">
        {/* Country selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            className="h-9 px-3 flex items-center gap-1.5 border border-input rounded-l-lg bg-white hover:border-primary transition-all dark:bg-slate-900 border-r-0 dark:border-slate-800"
            onClick={() => !disabled && setIsCountryOpen((v) => !v)}
            disabled={disabled}
          >
            {FlagComponent ? (
              <FlagComponent title={selectedCountry?.label} className="w-5 h-3.5 object-cover rounded-sm border border-slate-100" />
            ) : (
              <span className="text-xs">{country}</span>
            )}
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {isCountryOpen && (
            <div className="absolute z-50 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-hidden flex flex-col dark:bg-slate-950 dark:border-slate-800 animate-fadeIn">
              <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search country..."
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="w-full text-xs bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 py-0.5"
                />
                {countrySearch && (
                  <button
                    type="button"
                    onClick={() => setCountrySearch('')}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <ul className="overflow-y-auto max-h-48 py-1">
                {filteredCountryOptions.length > 0 ? (
                  filteredCountryOptions.map((option) => {
                    const OptionFlag = (Flags as any)[option.value] ? (Flags as any)[option.value] : null
                    return (
                      <li
                        key={option.value}
                        className={cn(
                          "px-3 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center gap-2 text-xs text-slate-700 dark:text-slate-350",
                          country === option.value ? "bg-primary/5 text-primary font-bold dark:bg-primary/10" : ""
                        )}
                        onClick={() => {
                          setCountry(option.value)
                          setIsCountryOpen(false)
                          setCountrySearch('')
                          // Re-emit with new calling code
                          if (localDigits) {
                            onChange(`+${getCountryCallingCode(option.value)}${localDigits}`)
                          }
                        }}
                      >
                        {OptionFlag && <OptionFlag className="w-5 h-3.5 object-cover rounded-sm border border-slate-100" />}
                        <span className="truncate">{option.label}</span>
                      </li>
                    )
                  })
                ) : (
                  <li className="px-3 py-3 text-xs text-center text-muted-foreground">
                    No results found
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Number input */}
        <div className={cn(
          "flex items-center flex-1 min-w-0 border border-input rounded-r-lg bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-primary/10 focus-within:border-primary transition-all dark:border-slate-800",
          error ? 'border-destructive focus-within:border-destructive focus-within:ring-destructive/10' : ''
        )}>
          <div className="pl-3 text-slate-400 font-semibold select-none text-xs flex-shrink-0">
            +{callingCode}
          </div>
          <input
            id={name}
            type="text"
            inputMode="numeric"
            value={localDigits}
            onChange={handleLocalChange}
            disabled={disabled}
            placeholder={placeholder}
            maxLength={10}
            className="w-full h-8 px-2.5 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/60 focus:ring-0 focus:border-none"
          />
        </div>
      </div>

      {error && <p className="text-xs font-medium text-destructive mt-0.5">{error}</p>}
    </div>
  )
}

export default PhoneInput
