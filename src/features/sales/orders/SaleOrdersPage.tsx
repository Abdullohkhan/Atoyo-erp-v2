import { Button, Box } from '@mui/material'
import { Add } from '@mui/icons-material'
import { useEffect } from 'react'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import PageHeader from '@/shared/components/PageHeader/PageHeader'
import DataTable from '@/shared/components/DataTable/DataTable'
import StatusChip from '@/shared/components/StatusChip/StatusChip'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchSaleOrders } from './store/saleOrdersSlice'
import type { SaleOrder } from '@/shared/types/document.types'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import type { TableColumn } from '@/shared/types/common.types'

const COLUMNS: TableColumn<SaleOrder>[] = [
  { id: 'number', label: 'Raqam', minWidth: 120 },
  { id: 'date', label: 'Sana', minWidth: 100, format: (v) => formatDate(v as string) },
  { id: 'customerName', label: 'Mijoz', minWidth: 180 },
  { id: 'warehouseName', label: 'Ombor', minWidth: 130 },
  { id: 'total', label: 'Summa', minWidth: 140, align: 'right', format: (v) => formatCurrency(v as number) },
  { id: 'paid', label: "To'langan", minWidth: 130, align: 'right', format: (v) => formatCurrency(v as number) },
  { id: 'balance', label: 'Qoldiq', minWidth: 130, align: 'right',
    format: (v) => <Box sx={{ color: (v as number) > 0 ? 'error.main' : 'success.main', fontWeight: 700 }}>{formatCurrency(v as number)}</Box> },
  { id: 'status', label: 'Holat', minWidth: 120, format: (v) => <StatusChip status={v as string} /> },
]

export default function SaleOrdersPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { items, loading } = useAppSelector((s) => s.saleOrders)

  useEffect(() => { dispatch(fetchSaleOrders()) }, [dispatch])

  const totalRevenue = items.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)

  return (
    <AnimatedPage>
      <PageHeader title="Savdo buyurtmalari" subtitle={`Jami: ${items.length} ta | Aylanma: ${formatCurrency(totalRevenue)}`}
        breadcrumbs={[{ label: 'Savdo' }, { label: 'Buyurtmalar' }]}
        actions={<Button variant="contained" startIcon={<Add />} onClick={() => navigate('/sales/orders/new')}>Yangi spiska</Button>}
      />
      <DataTable columns={COLUMNS} rows={items} loading={loading} searchable searchPlaceholder="Buyurtma qidirish..." />
    </AnimatedPage>
  )
}
