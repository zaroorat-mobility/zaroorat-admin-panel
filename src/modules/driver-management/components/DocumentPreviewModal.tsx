import React, { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  RefreshCw,
  ThumbsDown,
  X,
  XCircle,
} from 'lucide-react'
import { FileImage } from '@/shared/components/FileImage'
import { useFileReadUrl } from '@/shared/hooks/useFileReadUrl'
import { isPdfUrl } from '@/shared/utils/file-ref'
import { useToast } from '@/shared/context/toast'
import { useVerifyApplicationDocument } from '../hooks'
import { fmtReviewDateTime, type ReviewDocumentItem } from '../utils/application-review.utils'

export interface DocumentPreviewModalProps {
  doc: ReviewDocumentItem | null
  applicationId: string
  onClose: () => void
  onOpenDocument: (ref: string, disposition?: 'inline' | 'attachment') => void
}

const PRESET_DOC_REASONS = [
  'Document is unclear',
  'Document is expired',
  "Information doesn't match",
  'Wrong document',
] as const

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  doc,
  applicationId,
  onClose,
  onOpenDocument,
}) => {
  const [action, setAction] = useState<'none' | 'verify' | 'reject' | 'reupload'>('none')
  const [message, setMessage] = useState('')
  const { success: showSuccess, error: showError } = useToast()
  const { mutate: verifyDocument, isPending } = useVerifyApplicationDocument()

  const { url: frontUrl, isPdf: isPdfHook, loading: frontLoading } = useFileReadUrl(doc?.image)
  const isFrontPdf = Boolean(doc?.isPdf || isPdfHook || isPdfUrl(doc?.image))
  const isSinglePdf = isFrontPdf && !doc?.backImage

  useEffect(() => {
    setAction('none')
    setMessage('')
  }, [doc?.id])

  useEffect(() => {
    if (!doc) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (action !== 'none') setAction('none')
        else onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [doc, action, onClose])

  if (!doc) return null

  const handleConfirm = () => {
    let status: 'approved' | 'rejected' | 'reupload_requested' = 'approved'
    if (action === 'reject') status = 'rejected'
    else if (action === 'reupload') status = 'reupload_requested'

    verifyDocument(
      {
        applicationId,
        documentId: doc.rawDoc.id,
        status,
        comment: message.trim(),
      },
      {
        onSuccess: () => {
          if (status === 'approved') {
            showSuccess('Document Verified', `${doc.name} has been marked as verified.`)
          } else if (status === 'reupload_requested') {
            showSuccess('Re-upload Requested', `${doc.name} has been flagged for driver re-upload.`)
          } else {
            showSuccess('Document Rejected', `${doc.name} has been marked as rejected.`)
          }
          setAction('none')
          setMessage('')
          onClose()
        },
        onError: (err) => showError('Update failed', err.message),
      },
    )
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 md:p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget && action === 'none') onClose()
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-full border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-[#1F2B6D] dark:text-blue-400" />
              <h3 className="font-bold text-[#1F2B6D] dark:text-white text-lg leading-none">
                {doc.name}
              </h3>
              {isSinglePdf && (
                <span className="ml-2 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                  PDF Document
                </span>
              )}
            </div>
            <p className="text-[13px] text-slate-500 font-medium">
              Document Number: {doc.number} • Uploaded on {doc.uploaded}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close document preview"
            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Expiry & Prior Review Note Banners */}
        {(doc.isExpired || doc.rawDoc.comment) && (
          <div className="px-6 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 space-y-2">
            {doc.isExpired && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 text-xs text-rose-700 dark:text-rose-300 font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>
                  This document expired on {doc.expiryDate}. Request a valid replacement before
                  approving the application.
                </span>
              </div>
            )}
            {doc.rawDoc.comment && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  <strong className="font-bold">Previous review note:</strong> {doc.rawDoc.comment}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Main Content - Document View */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50 dark:bg-slate-950/50 custom-scrollbar flex justify-center items-start min-h-[400px]">
          {isSinglePdf ? (
            <div className="w-full max-w-3xl flex flex-col gap-2">
              <div className="flex items-center justify-between px-3 py-2 bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 rounded-xl text-[12px] font-semibold text-rose-800 dark:text-rose-300">
                <span className="flex items-center gap-1.5 font-bold">
                  <FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  Complete Digital Document (PDF contains all pages)
                </span>
                <button
                  type="button"
                  onClick={() => onOpenDocument(doc.image, 'inline')}
                  className="text-[#1F2B6D] dark:text-blue-400 hover:underline flex items-center gap-1 text-[12px] font-bold cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
                </button>
              </div>
              <div className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl h-[55vh] min-h-[440px] overflow-hidden shadow-sm flex flex-col">
                {frontLoading && !frontUrl && !isPdfUrl(doc.image) ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-800">
                    <div className="w-8 h-8 border-3 border-rose-500/30 border-t-rose-600 rounded-full animate-spin" />
                    <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                      Loading PDF document...
                    </p>
                  </div>
                ) : (
                  <iframe
                    src={`${frontUrl || doc.image}#toolbar=1`}
                    className="w-full h-full border-0 bg-white"
                    title={`${doc.name} PDF Preview`}
                  />
                )}
              </div>
            </div>
          ) : frontLoading && !doc.backImage && doc.twoSided ? (
            <div className="w-full max-w-3xl min-h-[440px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-3 shadow-sm">
              <div className="w-9 h-9 border-3 border-blue-600/30 border-t-[#1F2B6D] dark:border-t-blue-400 rounded-full animate-spin" />
              <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">
                Loading document preview...
              </p>
            </div>
          ) : doc.twoSided ? (
            <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-4">
              {([
                ['Front', doc.image],
                ['Back', doc.backImage],
              ] as const).map(([side, src]) => (
                <div
                  key={side}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl min-h-[320px] flex flex-col overflow-hidden shadow-sm"
                >
                  <div className="px-3 py-2 text-[12px] font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <span>{side}</span>
                    {src && (
                      <button
                        type="button"
                        onClick={() => onOpenDocument(src, 'inline')}
                        className="text-[11px] text-[#1F2B6D] dark:text-blue-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" /> View Full
                      </button>
                    )}
                  </div>
                  <div className="flex-1 flex items-center justify-center p-2">
                    <FileImage
                      src={src}
                      alt={`${doc.name} (${side.toLowerCase()})`}
                      className="max-w-full h-auto object-contain max-h-[55vh]"
                      fallback={
                        <p className="text-slate-400 dark:text-slate-500 font-medium text-[14px]">
                          {side === 'Back' && !src
                            ? 'Back not provided'
                            : 'No Document Image Available'}
                        </p>
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full max-w-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
              <FileImage
                src={doc.image}
                alt={doc.name}
                className="max-w-full h-auto object-contain max-h-[60vh] z-10"
                fallback={
                  <div className="flex flex-col items-center">
                    <ImageIcon className="w-16 h-16 text-slate-200 dark:text-slate-700 mb-4" />
                    <p className="text-slate-400 dark:text-slate-500 font-medium text-[15px]">
                      No Document Image Available
                    </p>
                  </div>
                }
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-50/50 to-transparent pointer-events-none dark:from-slate-800/30" />
            </div>
          )}
        </div>

        {/* Footer / Actions */}
        <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col">
          {doc.status === 'Verified' ? (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-bold text-emerald-800 dark:text-emerald-400 text-[14px]">
                    Document Verified
                  </p>
                  {doc.rawDoc.verifiedAt && (
                    <p className="text-emerald-600 dark:text-emerald-500/80 text-[12px]">
                      Verified on {fmtReviewDateTime(doc.rawDoc.verifiedAt)}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenDocument(doc.image)}
                disabled={!doc.image}
                className="px-6 py-2.5 rounded-lg border-2 border-[#1F2B6D] text-[#1F2B6D] hover:bg-slate-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-slate-800 font-bold transition-colors text-[14px] flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-end gap-3">
              <div className="mr-auto flex items-center gap-2">
                {([
                  ['Open document', doc.image],
                  ['Open back', doc.backImage],
                ] as const)
                  .filter(([label, src]) => label === 'Open document' || src)
                  .map(([label, src]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => onOpenDocument(src, 'inline')}
                      disabled={!src}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 text-[#1F2B6D] bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-blue-400 dark:hover:bg-slate-800 font-bold transition-all text-[13px] flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ExternalLink className="w-4 h-4" /> {label}
                    </button>
                  ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setMessage('')
                  setAction('reject')
                }}
                className="px-6 py-2.5 rounded-xl border border-rose-200 text-rose-600 bg-rose-50/70 hover:bg-rose-100/80 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-900/30 font-bold transition-all text-[13px] flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <ThumbsDown className="w-4 h-4" /> Reject
              </button>
              <button
                type="button"
                onClick={() => {
                  setMessage('')
                  setAction('reupload')
                }}
                className="px-6 py-2.5 rounded-xl border border-amber-200 text-amber-600 bg-amber-50/70 hover:bg-amber-100/80 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-400 dark:hover:bg-amber-900/30 font-bold transition-all text-[13px] flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <RefreshCw className="w-4 h-4" /> Request Re-upload
              </button>
              <button
                type="button"
                onClick={() => setAction('verify')}
                className="px-7 py-2.5 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white font-bold transition-all shadow-sm text-[13px] flex items-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <CheckCircle2 className="w-4 h-4" /> Verify Document
              </button>
            </div>
          )}
        </div>

        {/* Document Action Confirmation Dialog */}
        {action !== 'none' && (
          <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-center">
              <button
                type="button"
                onClick={() => setAction('none')}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {action === 'verify' && (
                <div>
                  <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                    <Check className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <h3 className="font-bold text-[18px] text-[#1F2B6D] dark:text-white">
                    Verify Document?
                  </h3>
                  <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Are you sure you want to mark this document as verified?
                  </p>

                  <div className="mt-4 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-[#1F2B6D] dark:text-white text-[13px] truncate">
                        {doc.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {doc.number} • Uploaded on {doc.uploaded}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 space-y-2 text-left">
                    <div className="flex items-center gap-2 text-[12px] text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>
                        Document will be marked as{' '}
                        <strong className="text-emerald-800 dark:text-emerald-300 font-semibold">
                          Verified
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Application progress will update automatically</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-5">
                    <button
                      type="button"
                      onClick={() => setAction('none')}
                      className="w-full py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[13px] transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={handleConfirm}
                      className="w-full py-2.5 rounded-lg bg-[#059669] hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-[13px] shadow-sm transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isPending ? 'Verifying...' : 'Yes, Verify Document'}
                    </button>
                  </div>
                </div>
              )}

              {action === 'reject' && (
                <div>
                  <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                    <ThumbsDown className="w-7 h-7 stroke-[2]" />
                  </div>
                  <h3 className="font-bold text-[18px] text-[#1F2B6D] dark:text-white">
                    Reject Document?
                  </h3>
                  <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Please provide a reason for rejecting this document.
                  </p>

                  <div className="mt-4 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-[#1F2B6D] dark:text-white text-[13px] truncate">
                        {doc.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {doc.number} • Uploaded on {doc.uploaded}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 text-left space-y-1.5">
                    <label className="text-[11.5px] font-bold text-slate-700 dark:text-slate-300">
                      Select Rejection Reason
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_DOC_REASONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setMessage(opt)}
                          className={`text-[11px] px-2.5 py-1 rounded-full border transition font-medium cursor-pointer ${
                            message === opt
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    <textarea
                      rows={2}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Provide details for the driver..."
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 resize-none outline-none focus:ring-1 focus:ring-rose-500 dark:text-white mt-1"
                    />
                  </div>

                  <div className="mt-3 p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-800/40 space-y-2 text-left">
                    <div className="flex items-center gap-2 text-[12px] text-slate-700 dark:text-slate-300">
                      <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span>
                        Document will be marked as{' '}
                        <strong className="text-rose-800 dark:text-rose-300 font-semibold">
                          Rejected
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-slate-700 dark:text-slate-300">
                      <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span>Driver will be notified of the rejection reason</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-5">
                    <button
                      type="button"
                      onClick={() => setAction('none')}
                      className="w-full py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[13px] transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!message.trim() || isPending}
                      onClick={handleConfirm}
                      className="w-full py-2.5 rounded-lg bg-[#DC2626] hover:bg-rose-700 active:scale-[0.99] text-white font-bold text-[13px] shadow-sm transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPending ? 'Rejecting...' : 'Yes, Reject Document'}
                    </button>
                  </div>
                </div>
              )}

              {action === 'reupload' && (
                <div>
                  <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                    <RefreshCw className="w-7 h-7 stroke-[2]" />
                  </div>
                  <h3 className="font-bold text-[18px] text-[#1F2B6D] dark:text-white">
                    Request Document Re-upload?
                  </h3>
                  <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Driver will receive a request to upload a fresh copy of this document.
                  </p>

                  <div className="mt-4 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-[#1F2B6D] dark:text-white text-[13px] truncate">
                        {doc.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {doc.number} • Uploaded on {doc.uploaded}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 text-left space-y-1.5">
                    <label className="text-[11.5px] font-bold text-slate-700 dark:text-slate-300">
                      Select Reason
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_DOC_REASONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setMessage(opt)}
                          className={`text-[11px] px-2.5 py-1 rounded-full border transition font-medium cursor-pointer ${
                            message === opt
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    <textarea
                      rows={2}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Instructions for driver on what to re-upload..."
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 resize-none outline-none focus:ring-1 focus:ring-amber-500 dark:text-white mt-1"
                    />
                  </div>

                  <div className="mt-3 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800/40 space-y-2 text-left">
                    <div className="flex items-center gap-2 text-[12px] text-slate-700 dark:text-slate-300">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>
                        Document will be flagged for replacement with your note so the driver must
                        upload a fresh copy
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-slate-700 dark:text-slate-300">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Application approval stays blocked until the replacement is verified</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-5">
                    <button
                      type="button"
                      onClick={() => setAction('none')}
                      className="w-full py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[13px] transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!message.trim() || isPending}
                      onClick={handleConfirm}
                      className="w-full py-2.5 rounded-lg bg-[#F59E0B] hover:bg-amber-600 active:scale-[0.99] text-white font-bold text-[13px] shadow-sm transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPending ? 'Sending Request...' : 'Send Re-upload Request'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
