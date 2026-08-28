import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type { PaginatedResponse, QueryParams } from '@/shared/types'
import type { BillingInvoice, CreateInvoiceTemplateInput, InvoiceTemplate } from '../types'

export const getInvoices = async (
  params?: QueryParams,
): Promise<PaginatedResponse<BillingInvoice>> => {
  const response = await api.get<PaginatedResponse<BillingInvoice>>(API_ENDPOINTS.invoices.list, {
    params: {
      ...params,
      recipientType: params?.recipientType ?? 'all',
    },
  })
  return response.data
}

export const getInvoiceById = async (id: string): Promise<BillingInvoice> => {
  const response = await api.get<{ data: BillingInvoice }>(API_ENDPOINTS.invoices.detail(id))
  return response.data.data
}

export const getInvoiceTemplates = async (): Promise<InvoiceTemplate[]> => {
  const response = await api.get<{ data: InvoiceTemplate[] }>(API_ENDPOINTS.invoiceTemplates.list)
  return response.data.data
}

export const createInvoiceTemplate = async (
  data: CreateInvoiceTemplateInput,
): Promise<InvoiceTemplate> => {
  const response = await api.post<{ data: InvoiceTemplate }>(
    API_ENDPOINTS.invoiceTemplates.create,
    data,
  )
  return response.data.data
}

export const updateInvoiceTemplate = async (
  id: string,
  data: Partial<CreateInvoiceTemplateInput>,
): Promise<InvoiceTemplate> => {
  const response = await api.patch<{ data: InvoiceTemplate }>(
    API_ENDPOINTS.invoiceTemplates.update(id),
    data,
  )
  return response.data.data
}

export const deleteInvoiceTemplate = async (id: string): Promise<void> => {
  await api.delete(API_ENDPOINTS.invoiceTemplates.delete(id))
}

export const setDefaultInvoiceTemplate = async (id: string): Promise<InvoiceTemplate> => {
  const response = await api.post<{ data: InvoiceTemplate }>(
    API_ENDPOINTS.invoiceTemplates.setDefault(id),
  )
  return response.data.data
}

export function buildPreviewContext(
  invoice: BillingInvoice,
  template: InvoiceTemplate,
): Record<string, string> {
  const totalGstRate = template.cgstRate + template.sgstRate + template.igstRate
  const baseMultiplier = 1 + totalGstRate / 100
  const taxableValue = invoice.amount / baseMultiplier
  const gstAmount = invoice.amount - taxableValue
  const cgstAmount = taxableValue * (template.cgstRate / 100)
  const sgstAmount = taxableValue * (template.sgstRate / 100)

  return {
    invoice_number: invoice.invoiceNumber,
    invoice_date: invoice.date,
    customer_name: invoice.recipientType === 'rider' ? invoice.recipientName : 'Zaroorat Mobility',
    customer_contact: '',
    driver_name: invoice.recipientType === 'driver' ? invoice.recipientName : 'Demo Driver',
    driver_id: 'DRV0001',
    trip_id: invoice.bookingId ?? '',
    booking_id: invoice.bookingId ?? '',
    fare_breakdown: `₹${taxableValue.toFixed(2)} (base) + ₹${gstAmount.toFixed(2)} (GST)`,
    total_amount: `₹${invoice.amount.toFixed(2)}`,
    amount_in_words: `${invoice.amount.toFixed(2)} Rupees Only`,
    commission_amount:
      invoice.recipientType === 'driver'
        ? `₹${invoice.amount.toFixed(2)}`
        : `₹${(invoice.amount * 0.07).toFixed(2)}`,
    subscription_plan: '—',
    subscription_amount: '—',
    tax_breakdown: `CGST: ₹${cgstAmount.toFixed(2)} | SGST: ₹${sgstAmount.toFixed(2)} | IGST: ₹0.00`,
    company_gstin: template.gstin,
    company_address: template.address,
  }
}

export const substitutePreview = (
  content: string,
  context: Record<string, string>,
): string => content.replace(/\{\{(\w+)\}\}/g, (_, key) => context[key] ?? `{{${key}}}`)
