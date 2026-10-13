import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LOW_STOCK_LIMIT } from '@/shared/constants'
import { Box, Chip } from '@mui/material'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import PageHeader from '@/shared/components/PageHeader/PageHeader'
import DataTable from '@/shared/components/DataTable/DataTable'
import { useAppDispatch, useAppSelector, useCan } from '@/app/hooks'
import { fetchBalance } from '@/features/warehouse/balance/store/balanceSlice'
import type { StockBalance } from '@/shared/types/common.types'
import { formatCurrency, formatNumber } from '@/shared/utils/formatters'
import type { TableColumn } from '@/shared/types/common.types'

const makeColumns = (): TableColumn<StockBalance>[] => [
  { id: 'productCode', label: 'Kod', minWidth: 80 },
  { id: 'productName', label: 'Mahsulot', minWidth: 200 },
  { id: 'warehouseName', label: 'Ombor', minWidth: 140 },
  { id: 'qty', label: 'Miqdor', minWidth: 100, align: 'right',
    format: (v) => <Box sx={{ fontWeight: 700, color: (v as number) <= LOW_STOCK_LIMIT ? 'error.main' : 'success.main' }}>{formatNumber(v as number)}</Box> },
  { id: 'costPrice', label: 'Tannarx', minWidth: 130, align: 'right', format: (v) => formatCurrency(v as number) },
  { id: 'totalValue', label: 'Jami qiymat', minWidth: 150, align: 'right',
    format: (v) => <Chip label={formatCurrency(v as number)} color="primary" variant="outlined" size="small" sx={{ fontWeight: 700, borderRadius: 1 }} /> },
]

export default function StockReportPage() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const { items, loading } = useAppSelector((s) => s.balance)
  const showCost = useCan('costs.view')
  const columns = useMemo(() => makeColumns().filter((c) => showCost || !['costPrice', 'totalValue'].includes(String(c.id))), [showCost])
  useEffect(() => { dispatch(fetchBalance()) }, [dispatch])
  const totalValue = items.reduce((s, b) => s + (b.totalValue ?? 0), 0)
  const lowStock = items.filter(b => b.availableQty <= LOW_STOCK_LIMIT).length
  return (
    <AnimatedPage>
      <PageHeader title="Qoldiqlar hisoboti"
        subtitle={t('Jami qiymat: {{value}} | Kam qolgan: {{count}} ta', { value: formatCurrency(totalValue), count: lowStock })}
        breadcrumbs={[{ label: 'Hisobotlar' }, { label: 'Qoldiqlar' }]}
      />
      <DataTable columns={columns} rows={items} loading={loading} searchable exportName="qoldiqlar_hisoboti" searchPlaceholder="Mahsulot qidirish..." />
    </AnimatedPage>
  )
}
