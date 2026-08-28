import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryParams } from '@/shared/types'
import type { CreateInvoiceTemplateInput } from '../types'
import * as invoiceApi from '../api'

const QK = {
  invoices: (params?: QueryParams) => ['pricing-management', 'invoices', params],
  invoice: (id: string) => ['pricing-management', 'invoice', id],
  templates: () => ['pricing-management', 'invoice-templates'],
}

export const useInvoices = (params?: QueryParams) =>
  useQuery({
    queryKey: QK.invoices(params),
    queryFn: () => invoiceApi.getInvoices(params),
  })

export const useInvoice = (id: string) =>
  useQuery({
    queryKey: QK.invoice(id),
    queryFn: () => invoiceApi.getInvoiceById(id),
    enabled: !!id,
  })

export const useInvoiceTemplates = () =>
  useQuery({
    queryKey: QK.templates(),
    queryFn: () => invoiceApi.getInvoiceTemplates(),
  })

export const useCreateInvoiceTemplate = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateInvoiceTemplateInput) => invoiceApi.createInvoiceTemplate(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.templates() }),
  })
}

export const useUpdateInvoiceTemplate = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateInvoiceTemplateInput> }) =>
      invoiceApi.updateInvoiceTemplate(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.templates() }),
  })
}

export const useDeleteInvoiceTemplate = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invoiceApi.deleteInvoiceTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.templates() }),
  })
}

export const useSetDefaultInvoiceTemplate = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invoiceApi.setDefaultInvoiceTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.templates() }),
  })
}
