export interface BillingInvoice {
  id: string
  invoiceNumber: string
  bookingId: string | null
  recipientName: string
  recipientType: 'rider' | 'driver'
  date: string
  amount: number
  taxAmount: number
  status: 'generated' | 'pending'
  hsnCode: string
  fromRoute: string | null
  toRoute: string | null
  rideId: string | null
  recipientUserId: string | null
}

export interface InvoiceTemplate {
  id: string
  name: string
  headerLogoText: string
  address: string
  gstin: string
  footerTerms: string
  cgstRate: number
  sgstRate: number
  igstRate: number
  appliesTo: 'ride' | 'school' | 'services'
  isDefault: boolean
}

export type CreateInvoiceTemplateInput = Omit<InvoiceTemplate, 'id'>
