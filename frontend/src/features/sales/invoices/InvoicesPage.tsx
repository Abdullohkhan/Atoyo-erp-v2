import { useEffect, useMemo, useState } from 'react'
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from '@mui/material'
import { Add } from '@mui/icons-material'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import PageHeader from '@/shared/components/PageHeader/PageHeader'
import DataTable from '@/shared/components/DataTable/DataTable'
import StatusChip from '@/shared/components/StatusChip/StatusChip'
import { useAppDispatch, useAppSelector, useCan } from '@/app/hooks'
import { fetchInvoices } from './store/invoicesSlice'
import { fetchSaleOrders } from '@/features/sales/orders/store/saleOrdersSlice'
import { fetchPurchaseOrders } from '@/features/purchases/orders/store/purchaseOrdersSlice'
import { createInvoiceFor } from '@/shared/services/operations'
import { useAction } from '@/shared/hooks/useAction'
import { STATUS_LABELS } from '@/shared/constants'
import type { Invoice } from '@/shared/types/document.types'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import type { TableColumn } from '@/shared/types/common.types'

export default function InvoicesPage() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const { items, loading } = useAppSelector((s) => s.saleInvoices)
  const sales = useAppSelector((s) => s.saleOrders.items)
  const purchases = useAppSelector((s) => s.purchaseOrders.items)
  const canCreate = useCan('invoices.create')
  const { busy, run } = useAction()
  const [open, setOpen] = useState(false)
  const [docKey, setDocKey] = useState('')
  const [dueDate, setDueDate] = useState(dayjs().add(14, 'day').format('YYYY-MM-DD'))

  const canSales = useCan('sales.view')
  const canPurchases = useCan('purchases.view')
  useEffect(() => {
    dispatch(fetchInvoices())
    if (canSales) dispatch(fetchSaleOrders())
    if (canPurchases) dispatch(fetchPurchaseOrders())
  }, [dispatch, canSales, canPurchases])

  // Confirmed documents that do not have an invoice yet.
  const candidates = useMemo(() => {
    const has = new Set(items.map((i) => i.orderId))
    const ok = (s: string) => s === 'confirmed' || s === 'completed'
    return [
      ...sales.filter((o) => ok(o.status) && !has.has(o.id)).map((o) => ({ key: `sale:${o.id}`, label: `${o.number} — ${o.customerName} (${formatCurrency(o.total)})` })),
      ...purchases.filter((o) => ok(o.status) && !has.has(o.id)).map((o) => ({ key: `purchase:${o.id}`, label: `${o.number} — ${o.supplierName} (${formatCurrency(o.total)})` })),
    ]
  }, [items, sales, purchases])

  const columns = useMemo<TableColumn<Invoice>[]>(() => [
    { id: 'number', label: 'Raqam', minWidth: 120 },
    { id: 'date', label: 'Sana', minWidth: 100, format: (v) => formatDate(v as string), exportValue: (r) => formatDate(r.date) },
    { id: 'type', label: 'Turi', minWidth: 100, format: (v) => (v === 'sale' ? t('Savdo') : t('Xarid')), exportValue: (r) => (r.type === 'sale' ? t('Savdo') : t('Xarid')) },
    { id: 'counterpartyName', label: 'Kontragent', minWidth: 180 },
    { id: 'amount', label: 'Summa', minWidth: 140, align: 'right', format: (v) => formatCurrency(v as number) },
    { id: 'dueDate', label: 'Muddat', minWidth: 100, format: (v) => formatDate(v as string), exportValue: (r) => formatDate(r.dueDate) },
    { id: 'status', label: 'Holat', minWidth: 120, format: (v) => <StatusChip status={v as string} />, exportValue: (r) => t(STATUS_LABELS[r.status] ?? r.status) },
  ], [t])

  const submit = async () => {
    const [type, id] = docKey.split(':')
    const ok = await run(() => dispatch(createInvoiceFor(type as 'sale' | 'purchase', id, dueDate)), 'Faktura yaratildi')
    if (ok) { setOpen(false); setDocKey('') }
  }

  return (
    <AnimatedPage>
      <PageHeader title="Fakturalar" subtitle={t('Jami: {{count}}', { count: items.length })}
        breadcrumbs={[{ label: 'Savdo' }, { label: 'Fakturalar' }]}
        actions={canCreate && <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>{t('Yangi faktura')}</Button>}
      />
      <DataTable columns={columns} rows={items} loading={loading} searchable exportName="fakturalar" searchPlaceholder="Faktura qidirish..." />
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{t('Yangi faktura')}</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField select size="small" fullWidth sx={{ mt: 1 }} label={t('Hujjat')} value={docKey} onChange={(e) => setDocKey(e.target.value)}
            helperText={candidates.length === 0 ? t("Fakturasiz tasdiqlangan hujjat yo'q") : undefined}>
            {candidates.map((c) => <MenuItem key={c.key} value={c.key}>{c.label}</MenuItem>)}
          </TextField>
          <TextField size="small" fullWidth type="date" label={t('Muddat')} value={dueDate} onChange={(e) => setDueDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setOpen(false)} variant="outlined" color="inherit">{t('Bekor')}</Button>
          <Button onClick={submit} variant="contained" disabled={!docKey || !dueDate || busy}>{t('Saqlash')}</Button>
        </DialogActions>
      </Dialog>
    </AnimatedPage>
  )
}
