import { useEffect } from 'react'
import { Box, Chip } from '@mui/material'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import PageHeader from '@/shared/components/PageHeader/PageHeader'
import DataTable from '@/shared/components/DataTable/DataTable'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchBalance } from '@/features/warehouse/balance/store/balanceSlice'
import type { StockBalance } from '@/shared/types/common.types'
import { formatCurrency, formatNumber } from '@/shared/utils/formatters'
import type { TableColumn } from '@/shared/types/common.types'

const COLUMNS: TableColumn<StockBalance>[] = [
  { id: 'productCode', label: 'Kod', minWidth: 80 },
  { id: 'productName', label: 'Mahsulot', minWidth: 200 },
  { id: 'warehouseName', label: 'Ombor', minWidth: 140 },
  { id: 'qty', label: 'Miqdor', minWidth: 100, align: 'right',
    format: (v) => <Box sx={{ fontWeight: 700, color: (v as number) < 10 ? 'error.main' : 'success.main' }}>{formatNumber(v as number)}</Box> },
  { id: 'costPrice', label: 'Tannarx', minWidth: 130, align: 'right', format: (v) => formatCurrency(v as number) },
  { id: 'totalValue', label: 'Jami qiymat', minWidth: 150, align: 'right',
    format: (v) => <Chip label={formatCurrency(v as number)} color="primary" variant="outlined" size="small" sx={{ fontWeight: 700, borderRadius: 1 }} /> },
]

export default function StockReportPage() {
  const dispatch = useAppDispatch()
  const { items, loading } = useAppSelector((s) => s.balance)
  useEffect(() => { dispatch(fetchBalance()) }, [dispatch])
  const totalValue = items.reduce((s, b) => s + b.totalValue, 0)
  const lowStock = items.filter(b => b.availableQty < 10).length
  return (
    <AnimatedPage>
      <PageHeader title="Qoldiqlar hisoboti"
        subtitle={`Jami qiymat: ${formatCurrency(totalValue)} | Kam qolgan: ${lowStock} ta`}
        breadcrumbs={[{ label: 'Hisobotlar' }, { label: 'Qoldiqlar' }]}
      />
      <DataTable columns={COLUMNS} rows={items} loading={loading} searchable searchPlaceholder="Mahsulot qidirish..." />
    </AnimatedPage>
  )
}
