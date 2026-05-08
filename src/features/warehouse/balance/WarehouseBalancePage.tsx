import { useEffect } from 'react'
import { Box, Chip } from '@mui/material'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import PageHeader from '@/shared/components/PageHeader/PageHeader'
import DataTable from '@/shared/components/DataTable/DataTable'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchBalance } from './store/balanceSlice'
import type { StockBalance } from '@/shared/types/common.types'
import { formatCurrency, formatNumber } from '@/shared/utils/formatters'
import type { TableColumn } from '@/shared/types/common.types'

const COLUMNS: TableColumn<StockBalance>[] = [
  { id: 'productCode', label: 'Kod', minWidth: 80 },
  { id: 'productName', label: 'Mahsulot', minWidth: 200 },
  { id: 'warehouseName', label: 'Ombor', minWidth: 140 },
  { id: 'unit', label: "O'lchov", minWidth: 80 },
  { id: 'qty', label: 'Qoldiq', minWidth: 100, align: 'right',
    format: (v) => <Box sx={{ fontWeight: 700, color: (v as number) < 10 ? 'error.main' : 'text.primary' }}>{formatNumber(v as number)}</Box> },
  { id: 'reservedQty', label: 'Band', minWidth: 100, align: 'right', format: (v) => formatNumber(v as number) },
  { id: 'availableQty', label: 'Mavjud', minWidth: 100, align: 'right',
    format: (v) => <Chip label={formatNumber(v as number)} color={(v as number) > 0 ? 'success' : 'error'} size="small" sx={{ fontWeight: 700, borderRadius: 1 }} /> },
  { id: 'totalValue', label: 'Qiymat', minWidth: 140, align: 'right', format: (v) => formatCurrency(v as number) },
]

export default function WarehouseBalancePage() {
  const dispatch = useAppDispatch()
  const { items, loading } = useAppSelector((s) => s.balance)
  useEffect(() => { dispatch(fetchBalance()) }, [dispatch])
  const totalValue = items.reduce((s, b) => s + b.totalValue, 0)
  return (
    <AnimatedPage>
      <PageHeader title="Ombor qoldiqlari" subtitle={`Jami qiymat: ${formatCurrency(totalValue)}`}
        breadcrumbs={[{ label: 'Ombor' }, { label: 'Qoldiqlar' }]}
      />
      <DataTable columns={COLUMNS} rows={items} loading={loading} searchable searchPlaceholder="Mahsulot qidirish..." />
    </AnimatedPage>
  )
}
