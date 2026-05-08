import { useEffect } from 'react'
import { Button } from '@mui/material'
import { Add } from '@mui/icons-material'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import PageHeader from '@/shared/components/PageHeader/PageHeader'
import DataTable from '@/shared/components/DataTable/DataTable'
import StatusChip from '@/shared/components/StatusChip/StatusChip'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchMovements } from './store/movementsSlice'
import type { StockMovement } from '@/shared/types/document.types'
import { formatDate } from '@/shared/utils/formatters'
import type { TableColumn } from '@/shared/types/common.types'

const TYPE_LABELS: Record<string, string> = {
  receipt: 'Kirim', dispatch: 'Chiqim', transfer: "Ko'chirish", writeoff: 'Hisobdan chiqarish', adjustment: 'Tuzatish',
}

const COLUMNS: TableColumn<StockMovement>[] = [
  { id: 'number', label: 'Raqam', minWidth: 120 },
  { id: 'date', label: 'Sana', minWidth: 100, format: (v) => formatDate(v as string) },
  { id: 'type', label: 'Turi', minWidth: 130, format: (v) => TYPE_LABELS[v as string] || (v as string) },
  { id: 'fromWarehouseName', label: 'Dan', minWidth: 140 },
  { id: 'toWarehouseName', label: 'Ga', minWidth: 140 },
  { id: 'status', label: 'Holat', minWidth: 120, format: (v) => <StatusChip status={v as string} /> },
]

export default function MovementsPage() {
  const dispatch = useAppDispatch()
  const { items, loading } = useAppSelector((s) => s.movements)
  useEffect(() => { dispatch(fetchMovements()) }, [dispatch])
  return (
    <AnimatedPage>
      <PageHeader title="Tovar harakati" subtitle={`Jami: ${items.length}`}
        breadcrumbs={[{ label: 'Ombor' }, { label: 'Harakat' }]}
        actions={<Button variant="contained" startIcon={<Add />}>Yangi harakat</Button>}
      />
      <DataTable columns={COLUMNS} rows={items} loading={loading} searchable searchPlaceholder="Hujjat qidirish..." />
    </AnimatedPage>
  )
}
