import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { useApplication, useVerifyApplicationDocument } from '../../hooks'
import {
  ArrowLeft,
  Copy,
  User,
  Calendar,
  Globe,
  MapPin,
  ShieldAlert,
  FileText,
  ShieldCheck,
  Edit,
  Clock,
  Car,
  StickyNote,
  ArrowRight,
  CheckCircle2,
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
  Image as ImageIcon
} from 'lucide-react'

export const ApplicationReviewPage: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  
  const [activeStep, setActiveStep] = useState<number>(2) // Default to 2 (Documents) for testing
  const [activeSidebarItem, setActiveSidebarItem] = useState<string>('personal')
  const [activeDocCategory, setActiveDocCategory] = useState<string>('all')
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null)

  const { data, isLoading } = useApplication(id || '')

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
    id: data.applicationId || data.id,
    name: data.driverName,
    phone: data.mobileNumber,
    email: data.email || '—',
    dob: data.dateOfBirth || '—',
    age: '—',
    gender: data.gender ? data.gender.charAt(0).toUpperCase() + data.gender.slice(1).toLowerCase() : '—',
    language: data.preferredLanguage || '—',
    address: [data.addressLine1, data.addressLine2, data.city, data.state, data.postcode].filter(Boolean).join(', ') || '—',
    emergencyContactName: data.emergencyContactName || '—',
    emergencyContactPhone: data.emergencyContactNumber || '—',
    
    vehicleType: data.vehicleType ? data.vehicleType.charAt(0).toUpperCase() + data.vehicleType.slice(1) : '—',
    vehicleMake: data.vehicle?.brand || '—',
    vehicleModel: data.vehicle?.model || '—',
    vehicleReg: data.vehicle?.registrationPlate || '—',
    vehicleColor: data.vehicle?.color || '—',
    vehicleYear: data.vehicle?.manufacturingYear || '—',
    vehicleSeats: data.vehicle?.seatsCapacity || '—',
    vehicleCategory: data.vehicle?.vehicleCategory || '—',
    
    submittedDate: data.submittedAt || '—',
    assignedTo: 'Admin',
    assignedDate: '—',
    progress: 100,
  }

  const identityDocuments = (data.documents || []).filter(d => d.category === 'driver').map(d => ({
    id: d.id,
    name: getDocName(d.docType),
    number: d.docNumber || '—',
    issuedBy: '—',
    issueDate: d.issuedDate || '—',
    expiryDate: d.expiryDate || '—',
    uploaded: d.createdAt || '—',
    status: getStatusLabel(d.verifyStatus),
    image: d.fileUrl,
    rawDoc: d
  }))

  const vehicleDocuments = (data.documents || []).filter(d => d.category === 'vehicle').map(d => ({
    id: d.id,
    name: getDocName(d.docType),
    number: d.docNumber || '—',
    issuedBy: '—',
    issueDate: d.issuedDate || '—',
    expiryDate: d.expiryDate || '—',
    uploaded: d.createdAt || '—',
    status: getStatusLabel(d.verifyStatus),
    image: d.fileUrl,
    rawDoc: d
  }))

  const documentCategories = [
    { id: 'all', label: 'All Documents', count: (data.documents || []).length },
    { id: 'identity', label: 'Identity Documents', count: identityDocuments.length },
    { id: 'vehicle', label: 'Vehicle Documents', count: vehicleDocuments.length },
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
            const isCompleted = idx < activeStep || idx === 0 || idx === 2; // Hardcoding checkmarks for 0 and 2 based on screenshot

            return (
              <React.Fragment key={step}>
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveStep(idx)}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[13px] shadow-sm transition-colors ${
                    isCompleted 
                      ? 'bg-emerald-500 text-white' 
                      : isActive 
                        ? 'bg-[#1F2B6D] text-white' 
                        : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : (idx + 1)}
                  </div>
                  <span className={`font-bold text-[13px] ${
                    isActive ? 'text-[#1F2B6D]' : isCompleted ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    {step}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className="flex-1 h-px bg-slate-200 mx-3"></div>
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

      {/* Additional Steps Placeholder */}
      {activeStep > 2 && (
        <div className="mt-8 flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 border-dashed">
          <p className="text-[#1F2B6D] dark:text-white font-bold text-lg mb-2">Coming Soon</p>
          <p className="text-slate-500 text-sm">This step is not implemented yet.</p>
        </div>
      )}

    </PageWrapper>
  )
}

export default ApplicationReviewPage
