import { Button, Box, IconButton, Tooltip } from '@mui/material'
import { Add, Visibility, CheckCircle, Cancel } from '@mui/icons-material'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import PageHeader from '@/shared/components/PageHeader/PageHeader'
import DataTable from '@/shared/components/DataTable/DataTable'
import StatusChip from '@/shared/components/StatusChip/StatusChip'
import DocumentDialog from '@/shared/components/DocumentDialog/DocumentDialog'
import ConfirmDialog from '@/shared/components/ConfirmDialog/ConfirmDialog'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector, useCan } from '@/app/hooks'
import { fetchSaleOrders } from './store/saleOrdersSlice'
import { confirmSaleOrder, cancelSaleOrder } from '@/shared/services/operations'
import { useAction } from '@/shared/hooks/useAction'
import { STATUS_LABELS } from '@/shared/constants'
import type { SaleOrder } from '@/shared/types/document.types'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import type { TableColumn } from '@/shared/types/common.types'

export default function SaleOrdersPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { items, loading } = useAppSelector((s) => s.saleOrders)
  const canCreate = useCan('sales.create')
  const canConfirm = useCan('sales.confirm')
  const canCancel = useCan('sales.cancel')
  const { busy, run } = useAction()
  const [viewing, setViewing] = useState<SaleOrder | null>(null)
  const [cancelling, setCancelling] = useState<SaleOrder | null>(null)

  useEffect(() => { dispatch(fetchSaleOrders()) }, [dispatch])

  const totalRevenue = items.filter((o) => o.status !== 'cancelled' && o.status !== 'draft').reduce((s, o) => s + o.total, 0)

  const columns = useMemo<TableColumn<SaleOrder>[]>(() => [
    { id: 'number', label: 'Raqam', minWidth: 120 },
    { id: 'date', label: 'Sana', minWidth: 100, format: (v) => formatDate(v as string), exportValue: (r) => formatDate(r.date) },
    { id: 'customerName', label: 'Mijoz', minWidth: 180 },
    { id: 'warehouseName', label: 'Ombor', minWidth: 130 },
    { id: 'total', label: 'Summa', minWidth: 140, align: 'right', format: (v) => formatCurrency(v as number) },
    { id: 'paid', label: "To'langan", minWidth: 130, align: 'right', format: (v) => formatCurrency(v as number) },
    { id: 'balance', label: 'Qoldiq', minWidth: 130, align: 'right',
      format: (v) => <Box sx={{ color: (v as number) > 0 ? 'error.main' : 'success.main', fontWeight: 700 }}>{formatCurrency(v as number)}</Box> },
    { id: 'status', label: 'Holat', minWidth: 120, format: (v) => <StatusChip status={v as string} />, exportValue: (r) => t(STATUS_LABELS[r.status] ?? r.status) },
  ], [t])

  return (
    <AnimatedPage>
      <PageHeader title="Savdo buyurtmalari" subtitle={t('Jami: {{count}} ta | Aylanma: {{sum}}', { count: items.length, sum: formatCurrency(totalRevenue) })}
        breadcrumbs={[{ label: 'Savdo' }, { label: 'Buyurtmalar' }]}
        actions={canCreate && <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/sales/orders/new')}>{t('Yangi spiska')}</Button>}
      />
      <DataTable columns={columns} rows={items} loading={loading} searchable exportName="savdo_buyurtmalari" searchPlaceholder="Buyurtma qidirish..."
        onRowClick={setViewing}
        rowActions={(row) => (
          <Box sx={{ display: 'inline-flex', gap: 0.5 }}>
            <Tooltip title={t('Ko\'rish')}><IconButton size="small" onClick={() => setViewing(row)}><Visibility fontSize="small" /></IconButton></Tooltip>
            {row.status === 'draft' && canConfirm && (
              <Tooltip title={t('Tasdiqlash')}><span><IconButton size="small" color="success" disabled={busy}
                onClick={() => run(() => dispatch(confirmSaleOrder(row.id)), 'Buyurtma tasdiqlandi')}><CheckCircle fontSize="small" /></IconButton></span></Tooltip>
            )}
            {row.status !== 'cancelled' && (canCancel || (row.status === 'draft' && canConfirm)) && (
              <Tooltip title={t('Bekor qilish')}><IconButton size="small" color="error" onClick={() => setCancelling(row)}><Cancel fontSize="small" /></IconButton></Tooltip>
            )}
          </Box>
        )}
      />
      {viewing && (
        <DocumentDialog open onClose={() => setViewing(null)} title={`${t('Buyurtma')} ${viewing.number}`}
          items={viewing.items} total={viewing.total}
          meta={[
            { label: 'Mijoz', value: viewing.customerName }, { label: 'Ombor', value: viewing.warehouseName },
            { label: 'Sana', value: formatDate(viewing.date) }, { label: 'Holat', value: <StatusChip status={viewing.status} /> },
            { label: "To'langan", value: formatCurrency(viewing.paid) }, { label: 'Qoldiq', value: formatCurrency(viewing.balance) },
          ]} />
      )}
      <ConfirmDialog open={!!cancelling} confirmLabel="Bekor qilish" loading={busy}
        message={t('{{number}} buyurtmasini bekor qilasizmi?', { number: cancelling?.number })}
        onClose={() => setCancelling(null)}
        onConfirm={async () => {
          if (!cancelling) return
          await run(() => dispatch(cancelSaleOrder(cancelling.id)), 'Buyurtma bekor qilindi')
          setCancelling(null)
        }} />
    </AnimatedPage>
  )
}
