import { useEffect, useMemo, useState } from 'react'
import { Button, Box, IconButton, Tooltip } from '@mui/material'
import { Add, Visibility, CheckCircle, Cancel } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import PageHeader from '@/shared/components/PageHeader/PageHeader'
import DataTable from '@/shared/components/DataTable/DataTable'
import StatusChip from '@/shared/components/StatusChip/StatusChip'
import DocumentDialog from '@/shared/components/DocumentDialog/DocumentDialog'
import ConfirmDialog from '@/shared/components/ConfirmDialog/ConfirmDialog'
import { useAppDispatch, useAppSelector, useCan } from '@/app/hooks'
import { fetchPurchaseOrders } from './store/purchaseOrdersSlice'
import { confirmPurchaseOrder, cancelPurchaseOrder } from '@/shared/services/operations'
import { useAction } from '@/shared/hooks/useAction'
import { STATUS_LABELS } from '@/shared/constants'
import type { PurchaseOrder } from '@/shared/types/document.types'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import type { TableColumn } from '@/shared/types/common.types'

export default function PurchaseOrdersPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { items, loading } = useAppSelector((s) => s.purchaseOrders)
  const canCreate = useCan('purchases.create')
  const canConfirm = useCan('purchases.confirm')
  const canCancel = useCan('purchases.cancel')
  const { busy, run } = useAction()
  const [viewing, setViewing] = useState<PurchaseOrder | null>(null)
  const [cancelling, setCancelling] = useState<PurchaseOrder | null>(null)

  useEffect(() => { dispatch(fetchPurchaseOrders()) }, [dispatch])

  const columns = useMemo<TableColumn<PurchaseOrder>[]>(() => [
    { id: 'number', label: 'Raqam', minWidth: 120 },
    { id: 'date', label: 'Sana', minWidth: 100, format: (v) => formatDate(v as string), exportValue: (r) => formatDate(r.date) },
    { id: 'supplierName', label: 'Yetkazuvchi', minWidth: 180 },
    { id: 'warehouseName', label: 'Ombor', minWidth: 130 },
    { id: 'total', label: 'Summa', minWidth: 140, align: 'right', format: (v) => formatCurrency(v as number) },
    { id: 'balance', label: 'Qoldiq', minWidth: 130, align: 'right',
      format: (v) => <Box sx={{ color: (v as number) > 0 ? 'warning.main' : 'success.main', fontWeight: 700 }}>{formatCurrency(v as number)}</Box> },
    { id: 'status', label: 'Holat', minWidth: 120, format: (v) => <StatusChip status={v as string} />, exportValue: (r) => t(STATUS_LABELS[r.status] ?? r.status) },
  ], [t])

  return (
    <AnimatedPage>
      <PageHeader title="Xarid buyurtmalari" subtitle={t('Jami: {{count}}', { count: items.length })}
        breadcrumbs={[{ label: 'Xarid' }, { label: 'Buyurtmalar' }]}
        actions={canCreate && <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/purchases/receipts/new')}>{t('Yangi xarid')}</Button>}
      />
      <DataTable columns={columns} rows={items} loading={loading} searchable exportName="xarid_buyurtmalari" searchPlaceholder="Xarid qidirish..."
        onRowClick={setViewing}
        rowActions={(row) => (
          <Box sx={{ display: 'inline-flex', gap: 0.5 }}>
            <Tooltip title={t("Ko'rish")}><IconButton size="small" onClick={() => setViewing(row)}><Visibility fontSize="small" /></IconButton></Tooltip>
            {row.status === 'draft' && canConfirm && (
              <Tooltip title={t('Qabul qilish')}><span><IconButton size="small" color="success" disabled={busy}
                onClick={() => run(() => dispatch(confirmPurchaseOrder(row.id)), 'Xarid qabul qilindi')}><CheckCircle fontSize="small" /></IconButton></span></Tooltip>
            )}
            {row.status !== 'cancelled' && (canCancel || (row.status === 'draft' && canConfirm)) && (
              <Tooltip title={t('Bekor qilish')}><IconButton size="small" color="error" onClick={() => setCancelling(row)}><Cancel fontSize="small" /></IconButton></Tooltip>
            )}
          </Box>
        )}
      />
      {viewing && (
        <DocumentDialog open onClose={() => setViewing(null)} title={`${t('Xarid')} ${viewing.number}`}
          items={viewing.items} total={viewing.total}
          meta={[
            { label: 'Yetkazuvchi', value: viewing.supplierName }, { label: 'Ombor', value: viewing.warehouseName },
            { label: 'Sana', value: formatDate(viewing.date) }, { label: 'Holat', value: <StatusChip status={viewing.status} /> },
            { label: "To'langan", value: formatCurrency(viewing.paid) }, { label: 'Qoldiq', value: formatCurrency(viewing.balance) },
          ]} />
      )}
      <ConfirmDialog open={!!cancelling} confirmLabel="Bekor qilish" loading={busy}
        message={t('{{number}} xaridini bekor qilasizmi?', { number: cancelling?.number })}
        onClose={() => setCancelling(null)}
        onConfirm={async () => {
          if (!cancelling) return
          await run(() => dispatch(cancelPurchaseOrder(cancelling.id)), 'Xarid bekor qilindi')
          setCancelling(null)
        }} />
    </AnimatedPage>
  )
}
