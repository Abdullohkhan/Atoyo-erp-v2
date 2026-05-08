// Sales Invoices Page
import { useEffect } from 'react'
import { Button } from '@mui/material'
import { Add } from '@mui/icons-material'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import PageHeader from '@/shared/components/PageHeader/PageHeader'
import DataTable from '@/shared/components/DataTable/DataTable'
import StatusChip from '@/shared/components/StatusChip/StatusChip'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchInvoices } from './store/invoicesSlice'
import type { Invoice } from '@/shared/types/document.types'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import type { TableColumn } from '@/shared/types/common.types'

const COLUMNS: TableColumn<Invoice>[] = [
  { id: 'number', label: 'Raqam', minWidth: 120 },
  { id: 'date', label: 'Sana', minWidth: 100, format: (v) => formatDate(v as string) },
  { id: 'counterpartyName', label: 'Kontragent', minWidth: 180 },
  { id: 'amount', label: 'Summa', minWidth: 140, align: 'right', format: (v) => formatCurrency(v as number) },
  { id: 'dueDate', label: 'Muddat', minWidth: 100, format: (v) => formatDate(v as string) },
  { id: 'status', label: 'Holat', minWidth: 120, format: (v) => <StatusChip status={v as string} /> },
]

export default function InvoicesPage() {
  const dispatch = useAppDispatch()
  const { items, loading } = useAppSelector((s) => s.saleInvoices)
  useEffect(() => { dispatch(fetchInvoices()) }, [dispatch])
  return (
    <AnimatedPage>
      <PageHeader title="Savdo fakturalari" subtitle={`Jami: ${items.length}`}
        breadcrumbs={[{ label: 'Savdo' }, { label: 'Fakturalar' }]}
        actions={<Button variant="contained" startIcon={<Add />}>Yangi faktura</Button>}
      />
      <DataTable columns={COLUMNS} rows={items} loading={loading} searchable searchPlaceholder="Faktura qidirish..." />
    </AnimatedPage>
  )
}
