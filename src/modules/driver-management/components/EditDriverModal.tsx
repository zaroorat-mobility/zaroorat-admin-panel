import React, { useState, useEffect } from 'react'
import { X, Calendar, ChevronDown } from 'lucide-react'
import { FileImage } from '@/shared/components/FileImage'
import type { DriverEntity, DriverDetails } from '../types'

interface EditDriverModalProps {
  isOpen: boolean
  onClose: () => void
  driver: DriverEntity | DriverDetails | null
  initialTab?: 'personal' | 'vehicle' | 'status'
  onSave?: (updatedData: any) => Promise<void> | void
  loading?: boolean
}

type TabType = 'personal' | 'vehicle' | 'status'

export const EditDriverModal: React.FC<EditDriverModalProps> = ({
  isOpen,
  onClose,
  driver,
  initialTab = 'personal',
  onSave,
  loading = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)

  // Personal details states
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState('Male')
  const [bloodGroup, setBloodGroup] = useState('A+')
  const [drivingExperience, setDrivingExperience] = useState('3 yrs')
  const [language, setLanguage] = useState('KS')
  const [cityLocation, setCityLocation] = useState('banglora, sringge, j and k')
  const [address, setAddress] = useState('')

  // Emergency contact states
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [emergencyRelationship, setEmergencyRelationship] = useState('Father')

  // Vehicle info states
  const [vehicleMake, setVehicleMake] = useState('')
  const [vehicleModel, setVehicleModel] = useState('')
  const [registrationPlate, setRegistrationPlate] = useState('')
  const [vehicleType, setVehicleType] = useState('bike')
  const [vehicleColor, setVehicleColor] = useState('White')
  const [manufacturingYear, setManufacturingYear] = useState('2011')
  const [fuelType, setFuelType] = useState('Petrol')
  const [permitType, setPermitType] = useState('Commercial')

  // Status & Access & Bank states
  const [driverStatus, setDriverStatus] = useState('active')
  const [billingMode, setBillingMode] = useState('commission')
  const [bankName, setBankName] = useState('')
  const [accountHolderName, setAccountHolderName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [ifscCode, setIfscCode] = useState('')
  const [upiId, setUpiId] = useState('')

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab)
    }
  }, [isOpen, initialTab])

  useEffect(() => {
    if (driver) {
      const d = driver as any
      setFullName(d.driverName || d.name || '')
      setPhoneNumber(d.mobileNumber || d.phone || '')
      setEmail(d.email || '')
      setDateOfBirth(d.dateOfBirth ? d.dateOfBirth.slice(0, 10) : '')
      setGender(d.gender || 'Male')
      setBloodGroup(d.bloodGroup || 'O+')
      setDrivingExperience(
        d.drivingExperience ||
          (d.drivingExperienceYears != null ? `${d.drivingExperienceYears} yrs` : ''),
      )
      setLanguage(d.preferredLanguage || 'EN')
      setCityLocation(d.city ? (d.state ? `${d.city}, ${d.state}` : d.city) : '')
      setAddress(
        [d.addressLine1, d.addressLine2, d.city, d.state, d.postcode]
          .filter(Boolean)
          .join(', ') || '',
      )

      setEmergencyName(
        d.emergencyContactName ||
          d.emergencyContacts?.[0]?.contactName ||
          d.emergencyContacts?.[0]?.name ||
          '',
      )
      setEmergencyContact(
        d.emergencyContactNumber ||
          d.emergencyContacts?.[0]?.phoneNumber ||
          '',
      )
      setEmergencyRelationship(
        d.emergencyContactRelationship ||
          d.emergencyContacts?.[0]?.relationship ||
          'Family',
      )

      setVehicleMake(d.vehicle?.brand || d.vehicle?.make || d.vehicleMake || '')
      setVehicleModel(d.vehicle?.model || d.vehicleModel || '')
      setRegistrationPlate(
        d.vehicle?.registrationPlate ||
          d.vehicle?.registrationNo ||
          d.registrationPlate ||
          '',
      )
      setVehicleType(d.vehicle?.vehicleType || d.vehicle?.category || d.vehicleType || 'bike')
      setVehicleColor(d.vehicle?.color || '')
      setManufacturingYear(
        d.vehicle?.manufacturingYear
          ? String(d.vehicle.manufacturingYear)
          : d.vehicle?.yearOfManufacture
            ? String(d.vehicle.yearOfManufacture)
            : '',
      )
      setFuelType(d.vehicle?.fuelType || 'Petrol')
      setPermitType(d.vehicle?.permitNo || 'Commercial')

      setDriverStatus(d.driverStatus || (d.applicationStatus === 'approved' ? 'active' : 'pending'))
      setBillingMode(d.paymentModel?.toLowerCase() || 'commission')
      setBankName(
        d.bankAccounts?.[0]?.bankName ||
          d.bankAccount?.bankName ||
          d.bankName ||
          '',
      )
      setAccountHolderName(
        d.bankAccounts?.[0]?.bankAccountName ||
          d.bankAccount?.accountHolderName ||
          d.bankAccountName ||
          d.driverName ||
          '',
      )
      setAccountNumber(
        d.bankAccounts?.[0]?.accountNumber ||
          d.bankAccounts?.[0]?.accountNumberMasked ||
          d.bankAccount?.accountNumber ||
          d.bankAccountNumber ||
          '',
      )
      setIfscCode(
        d.bankAccounts?.[0]?.bankIfsc ||
          d.bankAccount?.ifscCode ||
          d.bankIfsc ||
          '',
      )
      setUpiId(d.bankAccounts?.[0]?.upiId || d.bankAccount?.upiId || d.upiId || '')
    }
  }, [driver])

  if (!isOpen || !driver) return null

  const driverCode =
    driver.driverCode || `DRV_${driver.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSave) {
      void onSave({
        driverName: fullName,
        mobileNumber: phoneNumber,
        email,
        dateOfBirth,
        gender,
        bloodGroup,
        drivingExperience,
        preferredLanguage: language,
        city: cityLocation,
        addressLine1: address,
        emergencyContacts: [
          {
            name: emergencyName,
            phoneNumber: emergencyContact,
            relationship: emergencyRelationship,
          },
        ],
        emergencyContactNumber: emergencyContact,
        vehicle: {
          brand: vehicleMake,
          model: vehicleModel,
          category: vehicleType,
          registrationNo: registrationPlate,
          color: vehicleColor,
          yearOfManufacture: manufacturingYear,
          fuelType,
          permitNo: permitType,
        },
        vehicleMake,
        vehicleModel,
        registrationPlate,
        vehicleType,
        driverStatus,
        paymentModel: billingMode.toUpperCase(),
        bankAccount: {
          bankName,
          accountHolderName,
          accountNumber,
          ifscCode,
          upiId,
        },
      })
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-base font-bold text-[#1F2B6D] dark:text-white tracking-tight">
            Edit Driver
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#1F2B6D] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" strokeWidth={2.2} />
          </button>
        </div>

        {/* Driver Profile Card */}
        <div className="flex items-center gap-3.5 px-6 py-2.5">
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex-shrink-0 shadow-2xs">
            <FileImage
              src={driver.profilePhotoUrl}
              alt={driver.driverName}
              className="w-full h-full object-cover"
              fallback={
                <span className="w-full h-full flex items-center justify-center font-bold text-sm text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-700">
                  {driver.driverName?.charAt(0)?.toUpperCase() || 'D'}
                </span>
              }
            />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#1F2B6D] dark:text-white leading-tight">
              {driver.driverName}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-normal tracking-tight mt-0.5">
              Driver ID: {driverCode}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 px-6 border-b border-slate-150 dark:border-slate-800 mt-1">
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`pb-2.5 text-xs font-semibold transition cursor-pointer relative ${
              activeTab === 'personal'
                ? 'text-[#1F2B6D] dark:text-white font-bold'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Personal Details
            {activeTab === 'personal' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1F2B6D] dark:bg-white rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vehicle')}
            className={`pb-2.5 text-xs font-semibold transition cursor-pointer relative ${
              activeTab === 'vehicle'
                ? 'text-[#1F2B6D] dark:text-white font-bold'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Vehicle Info
            {activeTab === 'vehicle' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1F2B6D] dark:bg-white rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`pb-2.5 text-xs font-semibold transition cursor-pointer relative ${
              activeTab === 'status'
                ? 'text-[#1F2B6D] dark:text-white font-bold'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Status & Bank Details
            {activeTab === 'status' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1F2B6D] dark:bg-white rounded-full" />
            )}
          </button>
        </div>

        {/* Tab Form Content */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 max-h-[380px] overflow-y-auto">
            {activeTab === 'personal' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D] text-slate-900 dark:text-slate-100 transition shadow-2xs"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D] text-slate-900 dark:text-slate-100 transition shadow-2xs"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D] text-slate-900 dark:text-slate-100 transition shadow-2xs"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D] text-slate-900 dark:text-slate-100 transition shadow-2xs"
                    />
                    <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Gender
                  </label>
                  <div className="relative">
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D] text-slate-900 dark:text-slate-100 transition shadow-2xs appearance-none cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Blood Group */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Blood Group
                  </label>
                  <div className="relative">
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D] text-slate-900 dark:text-slate-100 transition shadow-2xs appearance-none cursor-pointer"
                    >
                      <option value="A+">A+</option>
                      <option value="B+">B+</option>
                      <option value="O+">O+</option>
                      <option value="AB+">AB+</option>
                      <option value="A-">A-</option>
                      <option value="B-">B-</option>
                      <option value="O-">O-</option>
                      <option value="AB-">AB-</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Driving Experience */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Driving Experience
                  </label>
                  <input
                    type="text"
                    value={drivingExperience}
                    onChange={(e) => setDrivingExperience(e.target.value)}
                    placeholder="e.g. 3 yrs"
                    className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D] text-slate-900 dark:text-slate-100 transition shadow-2xs"
                  />
                </div>

                {/* Language */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Language
                  </label>
                  <div className="relative">
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D] text-slate-900 dark:text-slate-100 transition shadow-2xs appearance-none cursor-pointer"
                    >
                      <option value="KS">Kashmiri (KS)</option>
                      <option value="English, Hindi, Urdu">English, Hindi, Urdu</option>
                      <option value="English, Kashmiri">English, Kashmiri</option>
                      <option value="Urdu, Kashmiri">Urdu, Kashmiri</option>
                      <option value="English">English</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Address (Full Span) */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. banglora, sringge, j and k, 193401"
                    className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D] text-slate-900 dark:text-slate-100 transition shadow-2xs"
                  />
                </div>

                {/* Emergency Contact Header */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-[12px] font-bold text-[#1F2B6D] dark:text-slate-200">
                    Emergency Contact Information
                  </h4>
                </div>

                {/* Emergency Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    placeholder="e.g. Brother"
                    className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D] text-slate-900 dark:text-slate-100 transition shadow-2xs"
                  />
                </div>

                {/* Emergency Phone */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Emergency Phone
                  </label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="+91..."
                    className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D] text-slate-900 dark:text-slate-100 transition shadow-2xs"
                  />
                </div>

                {/* Emergency Relationship */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Relationship
                  </label>
                  <div className="relative">
                    <select
                      value={emergencyRelationship}
                      onChange={(e) => setEmergencyRelationship(e.target.value)}
                      className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D] text-slate-900 dark:text-slate-100 transition shadow-2xs appearance-none cursor-pointer"
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Brother">Brother</option>
                      <option value="Sister">Sister</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Friend">Friend</option>
                      <option value="Other">Other</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'vehicle' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vehicle Type
                  </label>
                  <div className="relative">
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D] text-slate-900 dark:text-slate-100 transition shadow-2xs appearance-none cursor-pointer"
                    >
                      <option value="bike">Bike / Motorcycle</option>
                      <option value="auto">Auto Rickshaw</option>
                      <option value="cab">Cab / Car</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vehicle Make
                  </label>
                  <input
                    type="text"
                    value={vehicleMake}
                    onChange={(e) => setVehicleMake(e.target.value)}
                    placeholder="e.g. Baja"
                    className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D] text-slate-900 dark:text-slate-100 transition shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vehicle Model
                  </label>
                  <input
                    type="text"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="e.g. Pulsar"
                    className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D] text-slate-900 dark:text-slate-100 transition shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    value={registrationPlate}
                    onChange={(e) => setRegistrationPlate(e.target.value)}
                    placeholder="e.g. JK01AB2020"
                    className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D] text-slate-900 dark:text-slate-100 transition shadow-2xs font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Color
                  </label>
                  <input
                    type="text"
                    value={vehicleColor}
                    onChange={(e) => setVehicleColor(e.target.value)}
                    placeholder="e.g. White"
                    className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D] text-slate-900 dark:text-slate-100 transition shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Manufacturing Year
                  </label>
                  <input
                    type="text"
                    value={manufacturingYear}
                    onChange={(e) => setManufacturingYear(e.target.value)}
                    placeholder="e.g. 2011"
                    className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D] text-slate-900 dark:text-slate-100 transition shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fuel Type
                  </label>
                  <div className="relative">
                    <select
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value)}
                      className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D] text-slate-900 dark:text-slate-100 transition shadow-2xs appearance-none cursor-pointer"
                    >
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="CNG">CNG</option>
                      <option value="Electric">Electric</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Permit Type
                  </label>
                  <input
                    type="text"
                    value={permitType}
                    onChange={(e) => setPermitType(e.target.value)}
                    placeholder="e.g. Commercial"
                    className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D] text-slate-900 dark:text-slate-100 transition shadow-2xs"
                  />
                </div>
              </div>
            )}

            {activeTab === 'status' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Operational Status
                  </label>
                  <div className="relative">
                    <select
                      value={driverStatus}
                      onChange={(e) => setDriverStatus(e.target.value)}
                      className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D] text-slate-900 dark:text-slate-100 transition shadow-2xs appearance-none cursor-pointer"
                    >
                      <option value="active">Active</option>
                      <option value="on_trip">On Duty</option>
                      <option value="offline">Inactive / Offline</option>
                      <option value="suspended">Suspended</option>
                      <option value="blocked">Blocked</option>
                      <option value="pending">Under Review</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Billing / Plan Mode
                  </label>
                  <div className="relative">
                    <select
                      value={billingMode}
                      onChange={(e) => setBillingMode(e.target.value)}
                      className="w-full h-9 pl-3 pr-8 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D] text-slate-900 dark:text-slate-100 transition shadow-2xs appearance-none cursor-pointer"
                    >
                      <option value="commission">Commission per ride</option>
                      <option value="subscription">Subscription Plan</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Bank Account Section Header */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-[12px] font-bold text-[#1F2B6D] dark:text-slate-200">
                    Bank & Payout Details
                  </h4>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. J and K Bank"
                    className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D] text-slate-900 dark:text-slate-100 transition shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    placeholder="e.g. Mir Saqib"
                    className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D] text-slate-900 dark:text-slate-100 transition shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Account Number"
                    className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D] text-slate-900 dark:text-slate-100 transition shadow-2xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                    placeholder="e.g. JAKA0PATTAN"
                    className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D] text-slate-900 dark:text-slate-100 transition shadow-2xs font-mono uppercase"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    UPI ID
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. name@upi"
                    className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D] text-slate-900 dark:text-slate-100 transition shadow-2xs font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-7 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-[0.98] shadow-2xs transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-7 py-2.5 text-xs font-semibold rounded-xl bg-[#1F2B6D] hover:bg-[#182258] active:scale-[0.98] text-white shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
export default EditDriverModal
