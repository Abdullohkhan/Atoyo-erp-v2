import { useEffect } from 'react'
import { Button, Box } from '@mui/material'
import { Add } from '@mui/icons-material'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import PageHeader from '@/shared/components/PageHeader/PageHeader'
import DataTable from '@/shared/components/DataTable/DataTable'
import StatusChip from '@/shared/components/StatusChip/StatusChip'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchPurchaseOrders } from './store/purchaseOrdersSlice'
import type { PurchaseOrder } from '@/shared/types/document.types'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import type { TableColumn } from '@/shared/types/common.types'

const COLUMNS: TableColumn<PurchaseOrder>[] = [
  { id: 'number', label: 'Raqam', minWidth: 120 },
  { id: 'date', label: 'Sana', minWidth: 100, format: (v) => formatDate(v as string) },
  { id: 'supplierName', label: 'Yetkazuvchi', minWidth: 180 },
  { id: 'warehouseName', label: 'Ombor', minWidth: 130 },
  { id: 'total', label: 'Summa', minWidth: 140, align: 'right', format: (v) => formatCurrency(v as number) },
  { id: 'balance', label: 'Qoldiq', minWidth: 130, align: 'right',
    format: (v) => <Box sx={{ color: (v as number) > 0 ? 'warning.main' : 'success.main', fontWeight: 700 }}>{formatCurrency(v as number)}</Box> },
  { id: 'status', label: 'Holat', minWidth: 120, format: (v) => <StatusChip status={v as string} /> },
]

export default function PurchaseOrdersPage() {
  const dispatch = useAppDispatch()
  const { items, loading } = useAppSelector((s) => s.purchaseOrders)
  useEffect(() => { dispatch(fetchPurchaseOrders()) }, [dispatch])
  return (
    <AnimatedPage>
      <PageHeader title="Xarid buyurtmalari" subtitle={`Jami: ${items.length}`}
        breadcrumbs={[{ label: 'Xarid' }, { label: 'Buyurtmalar' }]}
        actions={<Button variant="contained" startIcon={<Add />}>Yangi xarid</Button>}
      />
      <DataTable columns={COLUMNS} rows={items} loading={loading} searchable searchPlaceholder="Xarid qidirish..." />
    </AnimatedPage>
  )
}
