import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LOW_STOCK_LIMIT } from '@/shared/constants'
import { Box, Chip } from '@mui/material'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import PageHeader from '@/shared/components/PageHeader/PageHeader'
import DataTable from '@/shared/components/DataTable/DataTable'
import { useAppDispatch, useAppSelector, useCan } from '@/app/hooks'
import { fetchBalance } from './store/balanceSlice'
import type { StockBalance } from '@/shared/types/common.types'
import { formatCurrency, formatNumber } from '@/shared/utils/formatters'
import type { TableColumn } from '@/shared/types/common.types'

const makeColumns = (): TableColumn<StockBalance>[] => [
  { id: 'productCode', label: 'Kod', minWidth: 80 },
  { id: 'productName', label: 'Mahsulot', minWidth: 200 },
  { id: 'warehouseName', label: 'Ombor', minWidth: 140 },
  { id: 'unit', label: "O'lchov", minWidth: 80 },
  { id: 'qty', label: 'Qoldiq', minWidth: 100, align: 'right',
    format: (v) => <Box sx={{ fontWeight: 700, color: (v as number) <= LOW_STOCK_LIMIT ? 'error.main' : 'text.primary' }}>{formatNumber(v as number)}</Box> },
  { id: 'reservedQty', label: 'Band', minWidth: 100, align: 'right', format: (v) => formatNumber(v as number) },
  { id: 'availableQty', label: 'Mavjud', minWidth: 100, align: 'right',
    format: (v) => <Chip label={formatNumber(v as number)} color={(v as number) > 0 ? 'success' : 'error'} size="small" sx={{ fontWeight: 700, borderRadius: 1 }} /> },
  { id: 'totalValue', label: 'Qiymat', minWidth: 140, align: 'right', format: (v) => formatCurrency(v as number) },
]

export default function WarehouseBalancePage() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const { items, loading } = useAppSelector((s) => s.balance)
  const showCost = useCan('costs.view')
  const columns = useMemo(() => makeColumns().filter((c) => showCost || !['costPrice', 'totalValue'].includes(String(c.id))), [showCost])
  useEffect(() => { dispatch(fetchBalance()) }, [dispatch])
  const totalValue = items.reduce((s, b) => s + (b.totalValue ?? 0), 0)
  return (
    <AnimatedPage>
      <PageHeader title="Ombor qoldiqlari" subtitle={t('Jami qiymat: {{value}}', { value: formatCurrency(totalValue) })}
        breadcrumbs={[{ label: 'Ombor' }, { label: 'Qoldiqlar' }]}
      />
      <DataTable columns={columns} rows={items} loading={loading} searchable exportName="ombor_qoldiqlari" searchPlaceholder="Mahsulot qidirish..." />
    </AnimatedPage>
  )
}
