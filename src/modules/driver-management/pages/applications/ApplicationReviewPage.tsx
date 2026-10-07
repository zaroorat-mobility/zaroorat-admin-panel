import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import {
  useApplication,
  useVerifyApplicationDocument,
  useApproveApplication,
  useRejectApplication,
  useRequestResubmission,
} from '../../hooks'
import { useToast } from '@/shared/context/toast'
import {
  ArrowLeft,
  Copy,
  User,
  Calendar,
  Globe,
  MapPin,
  ShieldAlert,
  FileText,
  FileCheck,
  ShieldCheck,
  Edit,
  Clock,
  Car,
  StickyNote,
  ArrowRight,
  CheckCircle2,
  Check,
  Phone,
  Mail,
  Home,
  ChevronRight,
  X,
  Eye,
  Download,
  MoreVertical,
  ThumbsDown,
  RefreshCw,
  AlertTriangle,
  IdCard,
  Image as ImageIcon
} from 'lucide-react'

export const ApplicationReviewPage: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { success: showSuccess, error: showError } = useToast()
  
  const [activeStep, setActiveStep] = useState<number>(3) // Default to 3 (Final Review) matching design mockup
  const [activeSidebarItem, setActiveSidebarItem] = useState<string>('personal')
  const [activeDocCategory, setActiveDocCategory] = useState<string>('all')
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null)
  const [verificationNotes, setVerificationNotes] = useState<string>('')
  const [decisionModal, setDecisionModal] = useState<'none' | 'approve' | 'reupload' | 'reject'>('none')
  const [billingMode, setBillingMode] = useState<'free' | 'commission' | 'subscription'>('commission')
  const [decisionReason, setDecisionReason] = useState<string>('')

  const { data, isLoading, refetch } = useApplication(id || '')
  const { mutate: approveApp, isPending: isApproving } = useApproveApplication()
  const { mutate: rejectApp, isPending: isRejecting } = useRejectApplication()
  const { mutate: resubmitApp, isPending: isResubmitting } = useRequestResubmission()

  if (isLoading || !data) return <div className="p-8 flex justify-center">Loading application...</div>

  const getDocName = (type: string) => {
    const map: Record<string, string> = {
      'license': 'Driving License',
      'license_front': 'Driving License Front',
      'license_back': 'Driving License Back',
      'aadhaar': 'Aadhaar Card',
      'aadhaar_front': 'Aadhaar Card Front',
      'aadhaar_back': 'Aadhaar Card Back',
      'rc': 'RC Certificate',
      'insurance': 'Vehicle Insurance',
      'permit': 'Commercial Permit',
      'photo': 'Profile Photo',
      'pan': 'PAN Card',
      'selfie': 'Selfie',
      'pollution': 'PUC Certificate',
      'fitness': 'Fitness Certificate'
    }
    return map[type] || type
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Verified'
      case 'pending': return 'Pending Review'
      case 'reupload_requested': return 'Re-upload Required'
      case 'rejected': return 'Rejected'
      default: return 'Not Uploaded'
    }
  }

  const appData = {
    id: data.applicationId || data.id || 'DRV_MUSFDU7F_ED56',
    name: data.driverName || 'Saqib Mir',
    phone: data.mobileNumber || '+91 96005 774525',
    email: data.email || 'saqibmir580@gmail.com',
    dob: data.dateOfBirth || '22 Sep 1998',
    age: '25',
    gender: data.gender ? data.gender.charAt(0).toUpperCase() + data.gender.slice(1).toLowerCase() : 'Male',
    language: data.preferredLanguage || 'English (EN)',
    address: [data.addressLine1, data.addressLine2, data.city, data.state, data.postcode].filter(Boolean).join(', ') || 'H No. 12, Lal Chowk Road, Srinagar, Jammu & Kashmir - 190001',
    emergencyContactName: data.emergencyContactName || '—',
    emergencyContactPhone: data.emergencyContactNumber || '—',
    
    vehicleType: data.vehicleType ? data.vehicleType.charAt(0).toUpperCase() + data.vehicleType.slice(1) : 'Bike',
    vehicleMake: data.vehicle?.brand || 'Scooty',
    vehicleModel: data.vehicle?.model || 'Access 125',
    vehicleReg: data.vehicle?.registrationPlate || 'JK01 AB 1234',
    vehicleColor: data.vehicle?.color || 'White',
    vehicleYear: data.vehicle?.manufacturingYear || 2022,
    vehicleSeats: data.vehicle?.seatsCapacity || 2,
    vehicleCategory: data.vehicle?.vehicleCategory || 'Bike Taxi',
    
    submittedDate: data.submittedAt ? new Date(data.submittedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '3 Oct 2026, 06:56 PM',
    assignedTo: 'Sarah Khan',
    assignedDate: '3 Oct 2026, 07:12 PM',
    progress: 100,
  }

  const identityDocuments = (data.documents || []).filter(d => d.category === 'driver' || ['license', 'license_front', 'license_back', 'aadhaar', 'aadhaar_front', 'aadhaar_back', 'pan', 'photo', 'selfie'].includes(d.docType?.toLowerCase())).map(d => ({
    id: d.id,
    name: getDocName(d.docType),
    number: d.docNumber || '—',
    issuedBy: '—',
    issueDate: d.issuedDate || '—',
    expiryDate: d.expiryDate || '—',
    uploaded: d.createdAt || '—',
    status: getStatusLabel(d.verifyStatus),
    image: d.fileUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60',
    rawDoc: d
  }))

  const vehicleDocuments = (data.documents || []).filter(d => d.category === 'vehicle' || ['rc', 'insurance', 'permit', 'pollution', 'fitness'].includes(d.docType?.toLowerCase())).map(d => ({
    id: d.id,
    name: getDocName(d.docType),
    number: d.docNumber || '—',
    issuedBy: '—',
    issueDate: d.issuedDate || '—',
    expiryDate: d.expiryDate || '—',
    uploaded: d.createdAt || '—',
    status: getStatusLabel(d.verifyStatus),
    image: d.fileUrl || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=500&auto=format&fit=crop&q=60',
    rawDoc: d
  }))

  const mockIdentityDocs = [
    {
      id: 'doc-aadhaar',
      name: 'Aadhaar Card',
      number: '•••• •••• 4521',
      status: 'Verified',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60',
      rawDoc: { id: 'doc-aadhaar' },
    },
    {
      id: 'doc-pan',
      name: 'PAN Card',
      number: 'ABCDE1234F',
      status: 'Verified',
      image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=60',
      rawDoc: { id: 'doc-pan' },
    },
    {
      id: 'doc-license',
      name: 'Driving License',
      number: 'JK01 20210004589',
      status: 'Verified',
      image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=60',
      rawDoc: { id: 'doc-license' },
    },
  ]

  const mockVehicleDocs = [
    {
      id: 'doc-rc',
      name: 'RC Certificate',
      number: 'RC-JK01AB1234',
      status: 'Verified',
      image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=500&auto=format&fit=crop&q=60',
      rawDoc: { id: 'doc-rc' },
    },
    {
      id: 'doc-insurance',
      name: 'Vehicle Insurance',
      number: 'POL-99238411',
      status: 'Verified',
      image: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=500&auto=format&fit=crop&q=60',
      rawDoc: { id: 'doc-insurance' },
    },
    {
      id: 'doc-puc',
      name: 'PUC Certificate',
      number: 'PUC-2024-88',
      status: 'Verified',
      image: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=500&auto=format&fit=crop&q=60',
      rawDoc: { id: 'doc-puc' },
    },
    {
      id: 'doc-permit',
      name: 'Commercial Permit',
      number: 'CP-JK-2023-119',
      status: 'Verified',
      image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=500&auto=format&fit=crop&q=60',
      rawDoc: { id: 'doc-permit' },
    },
  ]

  const finalIdentityDocs = identityDocuments.length >= 3
    ? identityDocuments
    : [
        ...identityDocuments,
        ...mockIdentityDocs.slice(identityDocuments.length),
      ]

  const finalVehicleDocs = vehicleDocuments.length >= 4
    ? vehicleDocuments
    : [
        ...vehicleDocuments,
        ...mockVehicleDocs.slice(vehicleDocuments.length),
      ]

  const timelineItems = [
    {
      title: 'Application Submitted',
      date: '3 Oct 2026, 06:56 PM',
      desc: 'Driver submitted the application from mobile app',
      isCurrent: false,
    },
    {
      title: 'Documents Uploaded',
      date: '3 Oct 2026, 07:02 PM',
      desc: 'All 8 documents uploaded',
      isCurrent: false,
    },
    {
      title: 'Under Review',
      date: '3 Oct 2026, 07:12 PM',
      desc: 'Application assigned to Sarah Khan',
      isCurrent: true,
    },
    {
      title: 'Verification in Progress',
      date: '3 Oct 2026, 08:15 PM',
      desc: 'All documents verified',
      isCurrent: false,
    },
    {
      title: 'Ready for Decision',
      date: '3 Oct 2026, 08:20 PM',
      desc: 'All checks completed',
      isCurrent: false,
    },
  ]

  const documentCategories = [
    { id: 'all', label: 'All Documents', count: (data.documents || []).length || 8 },
    { id: 'identity', label: 'Identity Documents', count: finalIdentityDocs.length },
    { id: 'vehicle', label: 'Vehicle Documents', count: finalVehicleDocs.length },
  ]


  const DocumentCard = ({ doc, onClick }: { doc: any, onClick: () => void }) => (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white dark:bg-slate-900 flex flex-col group cursor-pointer" onClick={onClick}>
      <div className="h-32 bg-slate-50 dark:bg-slate-800/50 p-2 relative flex items-center justify-center border-b border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="w-full h-full bg-white dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity overflow-hidden">
           {doc.image ? (
             <img src={doc.image} alt={doc.name} className="w-full h-full object-cover" />
           ) : (
             <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
           )}
        </div>
        <div className="absolute top-3 right-3">
           <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center border border-slate-100 dark:border-slate-700">
              {doc.status === 'Verified' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              {doc.status === 'Pending Review' && <Clock className="w-4 h-4 text-amber-500" />}
              {doc.status === 'Re-upload Required' && <RefreshCw className="w-4 h-4 text-orange-500" />}
              {doc.status === 'Rejected' && <X className="w-4 h-4 text-red-500" />}
           </div>
        </div>
      </div>
      <div className="p-3.5 flex flex-col flex-1">
        <h4 className="font-bold text-[#1F2B6D] dark:text-white text-[13.5px] leading-tight mb-1">{doc.name}</h4>
        <div className="text-[12px] text-slate-500 dark:text-slate-400 mb-2 space-y-0.5 font-medium">
          <p className="truncate text-[#1F2B6D] dark:text-slate-300">{doc.number}</p>
          <p>Expires: {doc.expiryDate}</p>
        </div>
        
        <div className="mt-auto flex items-center gap-1.5 mb-2.5">
           {doc.status === 'Verified' && <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" /> Verified</div>}
           {doc.status === 'Pending Review' && <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" /> Pending</div>}
           {doc.status === 'Re-upload Required' && <div className="flex items-center gap-1 text-[11px] font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full"><RefreshCw className="w-3 h-3" /> Re-upload</div>}
           {doc.status === 'Rejected' && <div className="flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full"><X className="w-3 h-3" /> Rejected</div>}
        </div>
  
        <div className="text-[10px] text-slate-400 font-medium mb-3">
          Uploaded: {doc.uploaded}
        </div>
  
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-auto">
          <button className="text-[#1F2B6D] dark:text-blue-400 font-bold text-[12px] flex items-center gap-1.5 hover:text-blue-600 transition-colors" onClick={(e) => { e.stopPropagation(); onClick(); }}>
            <Eye className="w-3.5 h-3.5" /> View Document
          </button>
          <button className="text-slate-400 hover:text-[#1F2B6D] dark:hover:text-white" onClick={(e) => { e.stopPropagation(); }}>
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )

  const DocumentPreviewModal = ({ doc, onClose }: { doc: any, onClose: () => void }) => {
    const [action, setAction] = useState<'none' | 'verify' | 'reject' | 'reupload'>('none');
    const [message, setMessage] = useState('');
    const { mutate: verifyDocument, isPending } = useVerifyApplicationDocument();

    const handleConfirm = () => {
      let status: 'approved' | 'rejected' | 'reupload_requested' = 'approved';
      if (action === 'reject') status = 'rejected';
      else if (action === 'reupload') status = 'reupload_requested';

      verifyDocument({
        applicationId: id as string,
        documentId: doc.rawDoc.id,
        status,
        comment: message
      }, {
        onSuccess: () => {
          onClose();
        }
      });
    };

    if (!doc) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 md:p-8">
        <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-full border border-slate-200 dark:border-slate-800">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-[#1F2B6D] dark:text-blue-400" />
                <h3 className="font-bold text-[#1F2B6D] dark:text-white text-lg leading-none">{doc.name}</h3>
              </div>
              <p className="text-[13px] text-slate-500 font-medium">Document Number: {doc.number} • Uploaded on {doc.uploaded}</p>
            </div>
            <button onClick={onClose} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Main Content - Document View */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50 dark:bg-slate-950/50 custom-scrollbar flex justify-center items-start min-h-[400px]">
            <div className="w-full max-w-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
               {doc.image ? (
                 <img src={doc.image} alt={doc.name} className="max-w-full h-auto object-contain max-h-[60vh] z-10" />
               ) : (
                 <>
                   <ImageIcon className="w-16 h-16 text-slate-200 dark:text-slate-700 mb-4" />
                   <p className="text-slate-400 dark:text-slate-500 font-medium text-[15px]">No Document Image Available</p>
                 </>
               )}
               <div className="absolute inset-0 bg-gradient-to-tr from-slate-50/50 to-transparent pointer-events-none dark:from-slate-800/30"></div>
            </div>
          </div>

          {/* Footer / Actions */}
          <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col">
            {doc.status === 'Verified' ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-800 dark:text-emerald-400 text-[14px]">Document Verified</p>
                    <p className="text-emerald-600 dark:text-emerald-500/80 text-[12px]">Verified on 3 Oct 2026, 07:18 PM by Sarah Khan.</p>
                  </div>
                </div>
                <button className="px-6 py-2.5 rounded-lg border-2 border-[#1F2B6D] text-[#1F2B6D] hover:bg-slate-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-slate-800 font-bold transition-colors text-[14px] flex items-center gap-2">
                  <Download className="w-4 h-4" /> Download
                </button>
              </div>
            ) : action === 'none' ? (
               <div className="flex items-center justify-end gap-3">
                 <button onClick={() => setAction('reject')} className="px-6 py-2.5 rounded-lg border-2 border-red-100 text-red-600 bg-red-50 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 font-bold transition-colors text-[14px] flex items-center gap-2">
                   <ThumbsDown className="w-4 h-4" /> Reject
                 </button>
                 <button onClick={() => setAction('reupload')} className="px-6 py-2.5 rounded-lg border-2 border-amber-100 text-amber-600 bg-amber-50 hover:bg-amber-100 dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40 font-bold transition-colors text-[14px] flex items-center gap-2">
                   <RefreshCw className="w-4 h-4" /> Request Re-upload
                 </button>
                 <button onClick={() => setAction('verify')} className="px-8 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-sm text-[14px] flex items-center gap-2">
                   <CheckCircle2 className="w-4 h-4" /> Verify Document
                 </button>
               </div>
            ) : action === 'verify' ? (
               <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-xl p-5">
                 <div className="flex gap-3">
                   <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center shrink-0">
                     <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                   </div>
                   <div className="flex-1">
                     <h4 className="font-bold text-emerald-800 dark:text-emerald-400 mb-1 text-[15px]">Confirm Verification</h4>
                     <p className="text-[13px] text-emerald-600 dark:text-emerald-500/80 mb-4">Are you sure you want to mark this document as verified? This action will update the driver's application status.</p>
                     <div className="flex items-center gap-3">
                       <button onClick={() => setAction('none')} className="px-5 py-2 rounded-lg font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors text-[13px]">Cancel</button>
                       <button disabled={isPending} onClick={handleConfirm} className={`px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors flex items-center gap-2 shadow-sm text-[13px] ${isPending ? 'opacity-70 cursor-not-allowed' : ''}`}>
                         {isPending ? 'Verifying...' : 'Confirm Verification'}
                       </button>
                     </div>
                   </div>
                 </div>
               </div>
            ) : (
               <div className={`border rounded-xl p-5 ${
                 action === 'reject' ? 'bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-800/30' : 'bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800/30'
               }`}>
                 <div className="flex gap-3">
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                     action === 'reject' ? 'bg-red-100 dark:bg-red-800/50 text-red-600 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-800/50 text-amber-600 dark:text-amber-400'
                   }`}>
                     {action === 'reject' ? <ThumbsDown className="w-5 h-5" /> : <RefreshCw className="w-5 h-5" />}
                   </div>
                   <div className="flex-1">
                     <h4 className={`font-bold mb-1 text-[15px] ${action === 'reject' ? 'text-red-800 dark:text-red-400' : 'text-amber-800 dark:text-amber-400'}`}>
                       {action === 'reject' ? 'Reject Document' : 'Request Re-upload'}
                     </h4>
                     <p className={`text-[13px] mb-3 ${action === 'reject' ? 'text-red-600 dark:text-red-400/80' : 'text-amber-600 dark:text-amber-400/80'}`}>
                       Please provide a reason for the {action === 'reject' ? 'rejection' : 're-upload request'}. This will be shown to the driver.
                     </p>
                     
                     <div className="flex gap-2 mb-3 flex-wrap">
                        {['Document is unclear', 'Document is expired', 'Information doesn\'t match', 'Wrong document'].map(opt => (
                          <button key={opt} onClick={() => setMessage(opt)} className={`px-3 py-1.5 rounded-full border text-[12px] font-bold transition-colors ${
                            message === opt ? (action === 'reject' ? 'bg-red-600 text-white border-red-600' : 'bg-amber-600 text-white border-amber-600') : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}>
                            {opt}
                          </button>
                        ))}
                     </div>

                     <textarea 
                       className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 mb-3 resize-none shadow-sm dark:text-white"
                       placeholder="Additional details (optional)..."
                       rows={2}
                       value={message}
                       onChange={(e) => setMessage(e.target.value)}
                     />
                     <div className="flex items-center gap-3">
                       <button onClick={() => setAction('none')} className="px-5 py-2 rounded-lg font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors text-[13px]">Cancel</button>
                       <button disabled={!message || isPending} onClick={handleConfirm} className={`px-6 py-2 rounded-lg text-white font-bold transition-colors flex items-center gap-2 shadow-sm text-[13px] ${
                         (!message || isPending) ? 'opacity-50 cursor-not-allowed' : ''
                       } ${
                         action === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'
                       }`}>
                         {isPending ? 'Processing...' : (action === 'reject' ? 'Confirm Rejection' : 'Confirm Re-upload')}
                       </button>
                     </div>
                   </div>
                 </div>
               </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const steps = ['Overview', 'Claim Form', 'Documents', 'Final Review', 'Decision']

  return (
    <PageWrapper className="pt-2 pb-8 space-y-4">
      
      {/* ─── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/driver-management/applications')}
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[#1F2B6D] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1F2B6D] dark:text-white flex items-center gap-3">
              Driver Application Review
            </h1>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
              Review driver details, documents and complete the verification process.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 text-[12.5px]">
              <span className="text-slate-500">Application ID</span>
              <span className="font-bold text-[#1F2B6D] dark:text-[#8B93D9]">{appData.id}</span>
            </div>
            <div className="flex items-center gap-2 text-[12.5px]">
              <span className="text-slate-500">Submitted on</span>
              <span className="font-bold text-[#1F2B6D] dark:text-[#8B93D9]">{appData.submittedDate}</span>
            </div>
          </div>
          <div className="bg-[#FEF08A]/50 border border-amber-200 text-amber-700 px-4 py-2 rounded-lg font-bold text-[13px] flex items-center gap-2 shadow-sm">
            <div className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">!</div>
            Under Review
          </div>
        </div>
      </div>

      {/* ─── Top Profile Card ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-4 flex-1">
          {/* Avatar */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden border-2 border-slate-100 shadow-sm shrink-0 relative">
              {/* Dummy Image for user from internet */}
              <img src="https://i.pravatar.cc/150?img=11" alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="space-y-0.5">
            <h2 className="text-xl font-bold text-[#1F2B6D] dark:text-white">{appData.name}</h2>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Phone className="w-3.5 h-3.5" />
              <span className="font-medium text-[13px]">{appData.phone}</span>
              <button className="text-slate-400 hover:text-slate-600"><Copy className="w-3.5 h-3.5" /></button>
            </div>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Mail className="w-3.5 h-3.5" />
              <span className="font-medium text-[13px]">{appData.email}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8 flex-1 justify-center lg:justify-start border-l border-slate-100 dark:border-slate-800 pl-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-[16px] h-[16px] text-[#1F2B6D]" />
              <span className="font-bold text-[#1F2B6D] text-[13px]">{appData.gender}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-[16px] h-[16px] text-[#1F2B6D]" />
              <span className="font-bold text-[#1F2B6D] text-[13px]">{appData.dob} <span className="text-slate-500 font-medium">({appData.age} years)</span></span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Globe className="w-[16px] h-[16px] text-[#1F2B6D]" />
              <span className="font-bold text-[#1F2B6D] text-[13px]">{appData.language}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-[16px] h-[16px] text-[#1F2B6D]" />
              <span className="font-bold text-[#1F2B6D] text-[13px]">Srinagar, J&K</span>
            </div>
          </div>
        </div>

        <div className="w-64 border-l border-slate-100 dark:border-slate-800 pl-6 hidden lg:block">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12.5px] text-slate-500 font-medium">Application Progress</span>
            <span className="font-bold text-[#1F2B6D] text-[13.5px]">{appData.progress}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${appData.progress}%` }}></div>
          </div>
          <span className="text-[11.5px] text-slate-500 font-medium">4 / 4 sections completed</span>
        </div>
      </div>

      {/* ─── Stepper Row with Prev/Next Buttons ───────────────────────────────── */}
      <div className="flex flex-col lg:flex-row items-center justify-between w-full py-1 gap-4">
        {/* Stepper Steps */}
        <div className="flex items-center flex-1 max-w-4xl">
          {steps.map((step, idx) => {
            const isActive = idx === activeStep;
            const isCompleted = idx < activeStep || (activeStep >= 3 && idx < 3);

            return (
              <React.Fragment key={step}>
                <div
                  className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80"
                  onClick={() => setActiveStep(idx)}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[13px] shadow-sm transition-colors ${
                      isCompleted 
                        ? 'bg-emerald-500 text-white' 
                        : isActive 
                          ? 'bg-[#1F2B6D] text-white' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : (idx + 1)}
                  </div>
                  <span
                    className={`font-bold text-[13px] ${
                      isActive
                        ? 'text-[#1F2B6D] dark:text-blue-400'
                        : isCompleted
                          ? 'text-slate-700 dark:text-slate-300'
                          : 'text-slate-400'
                    }`}
                  >
                    {step}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-3 ${
                      idx < activeStep ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* Prev / Next Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
            disabled={activeStep === 0}
            className="px-4 py-2 rounded-lg border border-slate-200 text-[#1F2B6D] font-semibold text-[13px] hover:bg-slate-50 transition-colors flex items-center gap-2 bg-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>
          <button 
            onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}
            disabled={activeStep === steps.length - 1}
            className="px-4 py-2 rounded-lg bg-[#1F2B6D] text-white font-semibold text-[13px] hover:bg-[#1B2A6B] transition-colors flex items-center gap-2 shadow-sm"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── Step Content ─────────────────────────────────────────────────────── */}
      {activeStep === 0 && (
        <div className="space-y-4">
          {/* 4 Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
              <div className="w-[42px] h-[42px] rounded-full bg-amber-500 flex items-center justify-center text-white shadow-sm shrink-0">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium mb-0.5">Application Status</p>
                <p className="text-[15px] font-bold text-amber-500 leading-tight mb-1">Under Review</p>
                <p className="text-[10px] text-slate-500 font-medium">Submitted on {appData.submittedDate}</p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm shrink-0">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium mb-0.5">Documents Submitted</p>
                <p className="text-[15px] font-bold text-[#1F2B6D] dark:text-blue-400 leading-tight mb-1">8 / 8</p>
                <p className="text-[10px] text-[#1F2B6D] font-medium">All required documents uploaded</p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
              <div className="w-[42px] h-[42px] rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-sm shrink-0">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium mb-0.5">Verification Progress</p>
                <p className="text-[15px] font-bold text-emerald-500 leading-tight mb-1">100%</p>
                <p className="text-[10px] text-slate-500 font-medium">4 of 4 sections completed</p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium mb-0.5">Assigned To</p>
                <p className="text-[15px] font-bold text-[#1F2B6D] dark:text-purple-400 leading-tight mb-1">{appData.assignedTo}</p>
                <p className="text-[10px] text-slate-500 font-medium">Assigned on {appData.assignedDate}</p>
              </div>
            </div>
          </div>

          {/* Main Content Grid for Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {/* LEFT COLUMN */}
            <div className="space-y-4 flex flex-col">
              {/* Personal Information */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px]">Personal Information</h3>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 text-[12px] font-semibold flex items-center gap-1">
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
                <div className="p-4 flex-1">
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-[13px]">
                    <div>
                      <p className="text-slate-500 mb-0.5">Full Name</p>
                      <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">{appData.name}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-0.5">Date of Birth</p>
                      <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">{appData.dob}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-500 mb-0.5">Address</p>
                      <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">{appData.address}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-0.5">Emergency Contact</p>
                      <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">{appData.emergencyContactName}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-0.5">Emergency Phone</p>
                      <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">{appData.emergencyContactPhone}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col flex-1">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px]">Application Timeline</h3>
                  </div>
                </div>
                <div className="p-4 px-6 relative flex-1">
                  <div className="absolute left-[35px] top-6 bottom-6 w-px bg-slate-200 dark:bg-slate-700"></div>
                  <div className="space-y-6 relative">
                    <div className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center relative z-10 shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-bold text-[13px] text-[#1F2B6D] dark:text-white">Application Submitted</p>
                        <p className="text-[11.5px] text-slate-500 mt-0.5">Driver submitted all required information</p>
                        <p className="text-[10px] text-slate-400 mt-1">{appData.submittedDate}</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center relative z-10 shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-bold text-[13px] text-[#1F2B6D] dark:text-white">Documents Uploaded</p>
                        <p className="text-[11.5px] text-slate-500 mt-0.5">8 out of 8 required documents uploaded</p>
                        <p className="text-[10px] text-slate-400 mt-1">3 Oct 2026, 06:58 PM</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-amber-100 border-2 border-amber-500 flex items-center justify-center relative z-10 shrink-0 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-600"></div>
                      </div>
                      <div>
                        <p className="font-bold text-[13px] text-[#1F2B6D] dark:text-white">Verification in Progress</p>
                        <p className="text-[11.5px] text-slate-500 mt-0.5">Background check and document verification initiated</p>
                        <p className="text-[10px] text-slate-400 mt-1">3 Oct 2026, 07:15 PM</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-4 flex flex-col">
              
              {/* Vehicle Information */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center">
                      <Car className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px]">Vehicle Information</h3>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 text-[12px] font-semibold flex items-center gap-1">
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
                <div className="p-4 flex-1">
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-[13px]">
                    <div>
                      <p className="text-slate-500 mb-0.5">Vehicle Type</p>
                      <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">{appData.vehicleType}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-0.5">Make & Model</p>
                      <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">{appData.vehicleMake} {appData.vehicleModel}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-0.5">Registration Number</p>
                      <div className="inline-flex mt-0.5 px-2 py-0.5 rounded border border-slate-200 bg-slate-50 font-bold text-[#1F2B6D] tracking-wide text-[12px]">
                        {appData.vehicleReg}
                      </div>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-0.5">Year & Color</p>
                      <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">{appData.vehicleYear} • {appData.vehicleColor}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-0.5">Seating Capacity</p>
                      <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">{appData.vehicleSeats} Seats</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-0.5">Service Category</p>
                      <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">{appData.vehicleCategory}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents Overview */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col flex-1">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center">
                      <StickyNote className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px]">Required Documents</h3>
                  </div>
                  <span className="text-[12px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    8/8 Uploaded
                  </span>
                </div>
                <div className="p-4 flex-1">
                  <div className="space-y-3">
                    {[
                      { name: 'Driver License', status: 'verified', color: 'emerald' },
                      { name: 'Aadhaar Card', status: 'verified', color: 'emerald' },
                      { name: 'Vehicle RC', status: 'pending', color: 'amber' },
                      { name: 'Insurance Policy', status: 'verified', color: 'emerald' },
                      { name: 'Pollution Certificate', status: 'verified', color: 'emerald' },
                    ].map((doc, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded bg-${doc.color}-100 text-${doc.color}-600 flex items-center justify-center shrink-0`}>
                            {doc.status === 'verified' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-[#1F2B6D]">{doc.name}</p>
                            <p className="text-[10px] text-slate-500 font-medium capitalize">{doc.status}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                  
                  <button className="w-full mt-4 py-2 rounded-lg border border-slate-200 text-[#1F2B6D] font-bold text-[13px] hover:bg-slate-50 transition-colors shadow-sm">
                    View All Documents
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeStep === 1 && (
        <div className="flex flex-col md:flex-row gap-5 items-start mt-4">
          
          {/* Claim Form Sidebar */}
          <div className="w-full md:w-[260px] shrink-0 flex flex-col gap-2">
            {[
              { id: 'personal', label: 'Personal Information', sub: 'Basic details submitted by driver', icon: User },
              { id: 'address', label: 'Address Information', sub: 'Current and permanent address', icon: MapPin },
              { id: 'emergency', label: 'Emergency Contact', sub: 'Emergency contact details', icon: Phone },
              { id: 'additional', label: 'Additional Information', sub: 'Other information from the form', icon: FileText },
            ].map((item) => {
              const isActive = activeSidebarItem === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSidebarItem(item.id)
                    const element = document.getElementById(`section-${item.id}`)
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-colors relative overflow-hidden ${
                    isActive 
                      ? 'bg-[#EFF3FE] border-[#C3D2FB] border-l-4 border-l-[#1F2B6D] dark:bg-[#1F2B6D]/20 dark:border-[#1F2B6D]/50' 
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 border-l-4 border-l-transparent'
                  }`}
                  style={{ boxShadow: isActive ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : '' }}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-[#DCE4FC] dark:bg-[#1F2B6D] text-[#1F2B6D] dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-[#1F2B6D] dark:text-slate-300'}`}>
                      <item.icon className="w-[18px] h-[18px]" />
                    </div>
                    <div>
                      <div className={`text-[13px] font-bold tracking-tight ${isActive ? 'text-[#1F2B6D] dark:text-white' : 'text-[#1F2B6D] dark:text-slate-300'}`}>{item.label}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-tight">{item.sub}</div>
                    </div>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-[#1F2B6D] dark:text-blue-400 shrink-0 ml-1" />}
                </button>
              )
            })}
          </div>

          {/* Claim Form Main Area - Stacked Cards */}
          <div className="flex-1 w-full space-y-4">
            
            {/* Personal Information Card */}
            <div id="section-personal" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col scroll-mt-24">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px]">Personal Information</h3>
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-[12px] font-semibold flex items-center gap-1">
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
              </div>
              <div className="p-4 flex flex-col sm:flex-row justify-between gap-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-[13px] flex-1">
                  <div>
                    <p className="text-slate-500 mb-0.5">Full Name</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">{appData.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Phone Number</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">{appData.phone}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Email Address</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">{appData.email}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Date of Birth</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">{appData.dob} <span className="text-slate-500 font-normal">({appData.age} years)</span></p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Gender</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">{appData.gender}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Preferred Language</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">{appData.language}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Alternate Number</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">—</p>
                  </div>
                </div>
                
                {/* Profile Photo Area */}
                <div className="shrink-0 flex flex-col items-center gap-3 bg-emerald-50/50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                  <div className="w-24 h-24 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700">
                    <img src="https://i.pravatar.cc/150?img=11" alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-3 py-1.5 rounded-full text-[12px] font-bold shadow-sm border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Profile Photo<br/><span className="text-emerald-500 dark:text-emerald-500 font-medium text-[10px] leading-tight block">Uploaded</span></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information Card */}
            <div id="section-address" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col scroll-mt-24">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px]">Address Information</h3>
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-[12px] font-semibold flex items-center gap-1">
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-8 text-[13px]">
                <div className="flex flex-col gap-2">
                  <span className="text-slate-500 mb-0.5">Current Address</span>
                  <p className="font-semibold text-[#1F2B6D] dark:text-slate-200 leading-relaxed max-w-sm">
                    {appData.address.split(', ').slice(0, 2).join(', ')}<br/>
                    {appData.address.split(', ').slice(2).join(', ')}
                  </p>
                  <div className="mt-2 self-start bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30 px-3 py-1.5 rounded flex items-center gap-2 font-bold text-[11.5px]">
                    <Home className="w-3.5 h-3.5" /> Current Address
                  </div>
                </div>
                <div className="flex flex-col gap-2 relative">
                  {/* Decorative divider for desktop */}
                  <div className="hidden md:block absolute -left-4 top-2 bottom-2 w-px bg-slate-100 dark:bg-slate-800"></div>
                  <span className="text-slate-500 mb-0.5">Permanent Address</span>
                  <p className="font-semibold text-[#1F2B6D] dark:text-slate-200 leading-relaxed max-w-sm">
                    {appData.address.split(', ').slice(0, 2).join(', ')}<br/>
                    {appData.address.split(', ').slice(2).join(', ')}
                  </p>
                  <div className="mt-2 self-start bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30 px-3 py-1.5 rounded flex items-center gap-2 font-bold text-[11.5px]">
                    <MapPin className="w-3.5 h-3.5" /> Same as Current Address
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact Card */}
            <div id="section-emergency" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col scroll-mt-24">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px]">Emergency Contact</h3>
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-[12px] font-semibold flex items-center gap-1">
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-[13px]">
                  <div>
                    <p className="text-slate-500 mb-0.5">Contact Name</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">{appData.emergencyContactName}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Alternate Contact</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">—</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Relationship</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">Brother</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Alternate Number</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">—</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Phone Number</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">{appData.emergencyContactPhone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information Card */}
            <div id="section-additional" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col scroll-mt-24">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px]">Additional Information</h3>
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-[12px] font-semibold flex items-center gap-1">
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-[13px]">
                  <div>
                    <p className="text-slate-500 mb-0.5">How did you hear about us?</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">Online Advertisement</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Have you driven with any other platform?</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">Yes</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Availability</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">Full Time</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">If yes, which one?</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">Rapido</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {activeStep === 2 && (
        <div className="flex flex-col md:flex-row gap-5 items-start mt-4">
          {/* Sidebar for Document Categories */}
          <div className="w-full md:w-[260px] shrink-0 flex flex-col gap-2 sticky top-4">
            {/* Top box: Documents Verification */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm mb-2">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px]">Documents Verification</h3>
              </div>
              <p className="text-[12px] text-slate-500 leading-relaxed">
                Review each document and verify its validity.
              </p>
            </div>

            {documentCategories.map((cat) => {
              const isActive = activeDocCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveDocCategory(cat.id);
                    setSelectedDocument(null);
                  }}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-colors relative overflow-hidden ${
                    isActive 
                      ? 'bg-[#EFF3FE] border-[#C3D2FB] border-l-4 border-l-[#1F2B6D] dark:bg-[#1F2B6D]/20 dark:border-[#1F2B6D]/50' 
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'text-[#1F2B6D] dark:text-blue-400' : 'text-[#1F2B6D] dark:text-slate-300'}`}>
                      {cat.id === 'all' && <FileText className="w-[18px] h-[18px]" />}
                      {cat.id === 'identity' && <User className="w-[18px] h-[18px]" />}
                      {cat.id === 'vehicle' && <Car className="w-[18px] h-[18px]" />}
                    </div>
                    <div className={`text-[13px] font-bold ${isActive ? 'text-[#1F2B6D] dark:text-white' : 'text-[#1F2B6D] dark:text-slate-300'}`}>
                      {cat.label}
                    </div>
                  </div>
                  <div className={`text-[12px] font-bold px-2.5 py-0.5 rounded-full ${
                    isActive ? 'bg-[#1F2B6D] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {cat.count}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Main Documents Grid */}
          <div className="flex-1 w-full flex flex-col gap-4">
            {/* Dynamic sections based on activeDocCategory */}
            {(activeDocCategory === 'all' || activeDocCategory === 'identity') && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center">
                       <User className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px]">Identity Documents ({identityDocuments.length} / {identityDocuments.length})</h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> All Verified
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  {identityDocuments.map((doc) => (
                     <DocumentCard key={doc.id} doc={doc} onClick={() => setSelectedDocument(doc)} />
                  ))}
                </div>
              </div>
            )}

            {(activeDocCategory === 'all' || activeDocCategory === 'vehicle') && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center">
                       <Car className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px]">Vehicle Documents ({vehicleDocuments.length} / {vehicleDocuments.length})</h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> All Verified
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  {vehicleDocuments.map((doc) => (
                     <DocumentCard key={doc.id} doc={doc} onClick={() => setSelectedDocument(doc)} />
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Summary Message */}
            <div className="mt-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-xl p-4 flex items-start gap-3 shadow-sm">
               <div className="mt-0.5"><CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-500" /></div>
               <div>
                  <h4 className="font-bold text-emerald-800 dark:text-emerald-400 text-[14px]">All required documents verified</h4>
                  <p className="text-emerald-600 dark:text-emerald-500/80 text-[13px] mt-0.5">8 of 8 required documents have been successfully verified.</p>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      <DocumentPreviewModal 
        doc={selectedDocument} 
        onClose={() => setSelectedDocument(null)} 
      />

      {/* ─── Step 3 & 4: Final Review & Decision ──────────────────────────────── */}
      {(activeStep === 3 || activeStep === 4) && (
        <div className="space-y-4 mt-2">
          {/* Main 2-column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* ─── LEFT COLUMN (col-span-8) ─────────────────────────────────── */}
            <div className="lg:col-span-8 space-y-4">
              
              {/* 1. Verification Summary Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#EFF3FE] dark:bg-blue-900/30 text-[#1F2B6D] dark:text-blue-400 flex items-center justify-center shrink-0">
                      <FileCheck className="w-5 h-5 text-[#1F2B6D] dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[15px]">
                        Verification Summary
                      </h3>
                      <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                        All verification checks completed. Review the details below and take the final action.
                      </p>
                    </div>
                  </div>
                  <div className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-bold bg-[#EBFBF2] text-[#059669] border border-[#B7F4D1] dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                    Ready for Decision
                  </div>
                </div>

                {/* 4 Summary Tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  {/* Tile 1: Claim Form */}
                  <div className="p-3.5 rounded-xl border border-emerald-100 bg-[#F6FCF8] dark:bg-emerald-950/20 dark:border-emerald-900/30 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[12px] text-slate-800 dark:text-slate-200">Claim Form</h4>
                      <p className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">Completed</p>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">All information verified</p>
                    </div>
                  </div>

                  {/* Tile 2: Identity Documents */}
                  <div className="p-3.5 rounded-xl border border-emerald-100 bg-[#F6FCF8] dark:bg-emerald-950/20 dark:border-emerald-900/30 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center shrink-0">
                      <IdCard className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[12px] text-slate-800 dark:text-slate-200">Identity Documents</h4>
                      <p className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {finalIdentityDocs.length} / {finalIdentityDocs.length} Verified
                      </p>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">Aadhaar, PAN, Driving Licence</p>
                    </div>
                  </div>

                  {/* Tile 3: Vehicle Documents */}
                  <div className="p-3.5 rounded-xl border border-emerald-100 bg-[#F6FCF8] dark:bg-emerald-950/20 dark:border-emerald-900/30 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center shrink-0">
                      <Car className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[12px] text-slate-800 dark:text-slate-200">Vehicle Documents</h4>
                      <p className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {finalVehicleDocs.length} / {finalVehicleDocs.length} Verified
                      </p>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">RC, Insurance, PUC, Permit</p>
                    </div>
                  </div>

                  {/* Tile 4: Pending Issues */}
                  <div className="p-3.5 rounded-xl border border-amber-100 bg-[#FEFBF2] dark:bg-amber-950/20 dark:border-amber-900/30 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-500 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[12px] text-slate-800 dark:text-slate-200">Pending Issues</h4>
                      <p className="text-[12px] font-bold text-slate-800 dark:text-white mt-0.5">None</p>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">All required items verified</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Personal Information & Vehicle Information side-by-side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Personal Information */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center shadow-2xs">
                          <User className="w-3.5 h-3.5 text-white" />
                        </div>
                        <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[13.5px]">Personal Information</h3>
                      </div>
                      <button
                        onClick={() => setActiveStep(1)}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-xs font-semibold flex items-center gap-1 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/40 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        <Edit className="w-3 h-3" /> Edit/View
                      </button>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-2 text-[12px]">
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-slate-500 shrink-0">Full Name</span>
                          <span className="font-bold text-[#1F2B6D] dark:text-slate-200 text-right">{appData.name}</span>
                        </div>
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-slate-500 shrink-0">Phone Number</span>
                          <span className="font-bold text-[#1F2B6D] dark:text-slate-200 text-right font-mono">{appData.phone}</span>
                        </div>
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-slate-500 shrink-0">Email Address</span>
                          <span className="font-bold text-[#1F2B6D] dark:text-slate-200 text-right truncate max-w-[150px]">{appData.email}</span>
                        </div>
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-slate-500 shrink-0">Date of Birth</span>
                          <span className="font-bold text-[#1F2B6D] dark:text-slate-200 text-right">{appData.dob} ({appData.age} years)</span>
                        </div>
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-slate-500 shrink-0">Gender</span>
                          <span className="font-bold text-[#1F2B6D] dark:text-slate-200 text-right">{appData.gender}</span>
                        </div>
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-slate-500 shrink-0">Preferred Language</span>
                          <span className="font-bold text-[#1F2B6D] dark:text-slate-200 text-right">{appData.language}</span>
                        </div>
                        <div className="flex justify-between items-start gap-2 pt-0.5">
                          <span className="text-slate-500 shrink-0">Address</span>
                          <span className="font-bold text-[#1F2B6D] dark:text-slate-200 text-right max-w-[170px] leading-tight text-[11.5px]">
                            {appData.address}
                          </span>
                        </div>
                      </div>

                      {/* Profile Photo Thumbnail */}
                      <div className="w-20 shrink-0 flex flex-col items-center">
                        <div className="w-20 h-24 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm relative">
                          <img
                            src={data.profilePhotoUrl || 'https://i.pravatar.cc/150?img=11'}
                            alt={appData.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center shadow-2xs">
                          <Car className="w-3.5 h-3.5 text-white" />
                        </div>
                        <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[13.5px]">Vehicle Information</h3>
                      </div>
                      <button
                        onClick={() => setActiveStep(1)}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-xs font-semibold flex items-center gap-1 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/40 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        <Edit className="w-3 h-3" /> Edit/View
                      </button>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-2 text-[12px]">
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-slate-500 shrink-0">Vehicle Type</span>
                          <span className="font-bold text-[#1F2B6D] dark:text-slate-200 text-right">{appData.vehicleType}</span>
                        </div>
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-slate-500 shrink-0">Make</span>
                          <span className="font-bold text-[#1F2B6D] dark:text-slate-200 text-right">{appData.vehicleMake}</span>
                        </div>
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-slate-500 shrink-0">Model</span>
                          <span className="font-bold text-[#1F2B6D] dark:text-slate-200 text-right">{appData.vehicleModel}</span>
                        </div>
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-slate-500 shrink-0">Registration Number</span>
                          <span className="font-bold text-[#1F2B6D] dark:text-slate-200 text-right font-mono">{appData.vehicleReg}</span>
                        </div>
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-slate-500 shrink-0">Color</span>
                          <span className="font-bold text-[#1F2B6D] dark:text-slate-200 text-right">{appData.vehicleColor}</span>
                        </div>
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-slate-500 shrink-0">Manufacturing Year</span>
                          <span className="font-bold text-[#1F2B6D] dark:text-slate-200 text-right">{appData.vehicleYear}</span>
                        </div>
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-slate-500 shrink-0">Seating Capacity</span>
                          <span className="font-bold text-[#1F2B6D] dark:text-slate-200 text-right">{appData.vehicleSeats}</span>
                        </div>
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-slate-500 shrink-0">Vehicle Category</span>
                          <span className="font-bold text-[#1F2B6D] dark:text-slate-200 text-right">{appData.vehicleCategory}</span>
                        </div>
                      </div>

                      {/* Vehicle Thumbnail & Plate */}
                      <div className="w-28 shrink-0 flex flex-col items-center gap-2">
                        <div className="w-28 h-24 rounded-lg bg-slate-50 dark:bg-slate-800/50 p-1.5 flex items-center justify-center border border-slate-100 dark:border-slate-800 overflow-hidden">
                          <img
                            src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=300&auto=format&fit=crop&q=80"
                            alt="Vehicle Preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="px-2.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold font-mono tracking-wider text-[#1F2B6D] dark:text-slate-200 shadow-2xs">
                          {appData.vehicleReg}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Documents (8 / 8 Verified) Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center shadow-2xs">
                      <FileText className="w-3.5 h-3.5 text-white" />
                    </div>
                    <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[13.5px]">
                      Documents ({finalIdentityDocs.length + finalVehicleDocs.length} / {finalIdentityDocs.length + finalVehicleDocs.length} Verified)
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveStep(2)}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-xs font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    View All Documents <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Identity Documents Row */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#1F2B6D] dark:text-white">
                      <User className="w-3.5 h-3.5 text-[#1F2B6D] dark:text-blue-400" />
                      <span>Identity Documents ({finalIdentityDocs.length} / {finalIdentityDocs.length})</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {finalIdentityDocs.map((doc) => (
                        <div
                          key={doc.id}
                          onClick={() => setSelectedDocument(doc)}
                          className="group p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer flex flex-col justify-between"
                        >
                          <div className="relative h-20 rounded-lg overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 mb-2 flex items-center justify-center">
                            <img
                              src={doc.image}
                              alt={doc.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs pt-0.5">
                            <span className="font-bold text-[#1F2B6D] dark:text-slate-200 text-[11.5px] truncate mr-1">
                              {doc.name}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                              <Check className="w-2.5 h-2.5 stroke-[3]" /> Verified
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Vehicle Documents Row */}
                  <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#1F2B6D] dark:text-white">
                      <Car className="w-3.5 h-3.5 text-[#1F2B6D] dark:text-blue-400" />
                      <span>Vehicle Documents ({finalVehicleDocs.length} / {finalVehicleDocs.length})</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {finalVehicleDocs.map((doc) => (
                        <div
                          key={doc.id}
                          onClick={() => setSelectedDocument(doc)}
                          className="group p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer flex flex-col justify-between"
                        >
                          <div className="relative h-20 rounded-lg overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 mb-2 flex items-center justify-center">
                            <img
                              src={doc.image}
                              alt={doc.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs pt-0.5">
                            <span className="font-bold text-[#1F2B6D] dark:text-slate-200 text-[11.5px] truncate mr-1">
                              {doc.name}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                              <Check className="w-2.5 h-2.5 stroke-[3]" /> Verified
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* ─── RIGHT COLUMN (col-span-4) ────────────────────────────────── */}
            <div className="lg:col-span-4 space-y-4">
              
              {/* 4. Application Timeline Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center shadow-2xs">
                    <Clock className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[13.5px]">Application Timeline</h3>
                </div>

                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-400 dark:before:bg-emerald-600">
                  {timelineItems.map((item, idx) => (
                    <div key={idx} className="relative">
                      <div
                        className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-slate-900 ${
                          item.isCurrent ? 'bg-blue-600' : 'bg-emerald-500'
                        }`}
                      />
                      <div className="flex items-baseline justify-between gap-2">
                        <p className={`text-xs font-bold ${item.isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {item.title}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">{item.date}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Verification Notes (Optional) Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center shadow-2xs">
                    <StickyNote className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[13.5px]">Verification Notes (Optional)</h3>
                </div>
                <div className="relative">
                  <textarea
                    rows={4}
                    maxLength={500}
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Add internal notes about this application..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] resize-none transition pb-6"
                  />
                  <span className="text-[10px] text-slate-400 absolute right-3 bottom-2 font-mono">
                    {verificationNotes.length}/500
                  </span>
                </div>
              </div>

              {/* 6. Application Decision Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[13.5px]">Application Decision</h3>
                </div>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mb-3.5">
                  Choose the final action for this application. The driver will be notified automatically.
                </p>

                <div className="space-y-2.5">
                  {/* Button 1: Approve Application */}
                  <button
                    onClick={() => {
                      setDecisionReason(verificationNotes)
                      setDecisionModal('approve')
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white transition shadow-sm group cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-[13px]">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Approve Application</span>
                    </div>
                    <span className="text-[10.5px] text-emerald-100 text-right max-w-[170px] leading-tight">
                      Application will be verified and driver can access the app.
                    </span>
                  </button>

                  {/* Button 2: Request Re-submission */}
                  <button
                    onClick={() => {
                      setDecisionReason(verificationNotes)
                      setDecisionModal('reupload')
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white transition shadow-sm group cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-[13px]">
                      <RefreshCw className="w-4 h-4 shrink-0" />
                      <span>Request Re-submission</span>
                    </div>
                    <span className="text-[10.5px] text-amber-100 text-right max-w-[170px] leading-tight">
                      Driver will be asked to re-upload specific information/documents.
                    </span>
                  </button>

                  {/* Button 3: Reject Application */}
                  <button
                    onClick={() => {
                      setDecisionReason(verificationNotes)
                      setDecisionModal('reject')
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-[0.99] text-white transition shadow-sm group cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-[13px]">
                      <X className="w-4 h-4 shrink-0" />
                      <span>Reject Application</span>
                    </div>
                    <span className="text-[10.5px] text-rose-100 text-right max-w-[170px] leading-tight">
                      Application will be rejected with a reason.
                    </span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ─── Decision Confirmation Modal ────────────────────────────────────── */}
      {decisionModal !== 'none' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                  decisionModal === 'approve'
                    ? 'bg-emerald-600'
                    : decisionModal === 'reupload'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                }`}>
                  {decisionModal === 'approve' && <CheckCircle2 className="w-5 h-5" />}
                  {decisionModal === 'reupload' && <RefreshCw className="w-5 h-5" />}
                  {decisionModal === 'reject' && <X className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">
                    {decisionModal === 'approve' && 'Approve Driver Application'}
                    {decisionModal === 'reupload' && 'Request Re-submission'}
                    {decisionModal === 'reject' && 'Reject Driver Application'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Application ID: <span className="font-mono font-semibold">{appData.id}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDecisionModal('none')}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {decisionModal === 'approve' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Driver <span className="font-bold text-[#1F2B6D] dark:text-blue-400">{appData.name}</span> will be verified and activated. An automated activation SMS will be dispatched.
                </p>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Billing Mode
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['commission', 'subscription', 'free'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setBillingMode(mode)}
                        className={`py-2 px-2.5 rounded-lg text-xs font-bold capitalize border transition ${
                          billingMode === mode
                            ? 'bg-[#1F2B6D] text-white border-[#1F2B6D]'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Internal Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={decisionReason}
                    onChange={(e) => setDecisionReason(e.target.value)}
                    placeholder="Add approval notes..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 resize-none outline-none focus:ring-1 focus:ring-[#1F2B6D]"
                  />
                </div>
              </div>
            )}

            {(decisionModal === 'reupload' || decisionModal === 'reject') && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {decisionModal === 'reupload'
                    ? 'The driver will receive an SMS and push notification asking them to re-upload required items.'
                    : 'The driver application will be marked as rejected. Provide a clear reason.'}
                </p>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Quick Preset Reason
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {(decisionModal === 'reupload'
                      ? ['Unclear document photos', 'Document is expired', 'Vehicle details mismatch', 'Selfie unclear']
                      : ['Invalid or fraudulent document', 'Expired commercial license', 'Vehicle age limit exceeded', 'Failed background check']
                    ).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setDecisionReason(preset)}
                        className={`text-[11px] px-2.5 py-1 rounded-full border transition font-medium ${
                          decisionReason === preset
                            ? 'bg-[#1F2B6D] text-white border-[#1F2B6D]'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Reason Details
                  </label>
                  <textarea
                    rows={3}
                    value={decisionReason}
                    onChange={(e) => setDecisionReason(e.target.value)}
                    placeholder="Enter reason for driver..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 resize-none outline-none focus:ring-1 focus:ring-[#1F2B6D]"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDecisionModal('none')}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isApproving || isRejecting || isResubmitting}
                onClick={() => {
                  if (decisionModal === 'approve') {
                    approveApp(
                      { id: id!, notes: decisionReason || verificationNotes, billingMode },
                      {
                        onSuccess: () => {
                          showSuccess('Application Approved', 'Driver account has been verified and activated.')
                          setDecisionModal('none')
                          refetch()
                        },
                        onError: (err: any) => {
                          showError('Approval Failed', err?.message || 'Could not approve application')
                        },
                      },
                    )
                  } else if (decisionModal === 'reupload') {
                    resubmitApp(
                      { id: id!, notes: decisionReason || 'Please re-upload required documents' },
                      {
                        onSuccess: () => {
                          showSuccess('Re-submission Requested', 'Driver has been notified to re-submit.')
                          setDecisionModal('none')
                          refetch()
                        },
                        onError: (err: any) => {
                          showError('Request Failed', err?.message || 'Could not request re-submission')
                        },
                      },
                    )
                  } else if (decisionModal === 'reject') {
                    rejectApp(
                      { id: id!, notes: decisionReason || 'Application rejected' },
                      {
                        onSuccess: () => {
                          showSuccess('Application Rejected', 'Driver application has been rejected.')
                          setDecisionModal('none')
                          refetch()
                        },
                        onError: (err: any) => {
                          showError('Rejection Failed', err?.message || 'Could not reject application')
                        },
                      },
                    )
                  }
                }}
                className={`px-5 py-2 rounded-lg text-xs font-bold text-white transition shadow-sm ${
                  decisionModal === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : decisionModal === 'reupload'
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : 'bg-rose-500 hover:bg-rose-600'
                } ${(isApproving || isRejecting || isResubmitting) ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {(isApproving || isRejecting || isResubmitting)
                  ? 'Processing...'
                  : decisionModal === 'approve'
                    ? 'Confirm Approval'
                    : decisionModal === 'reupload'
                      ? 'Send Re-submission Request'
                      : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

    </PageWrapper>
  )
}

export default ApplicationReviewPage
