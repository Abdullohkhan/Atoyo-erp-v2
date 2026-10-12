import { useEffect, useMemo, useState } from 'react'
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from '@mui/material'
import { Add } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import PageHeader from '@/shared/components/PageHeader/PageHeader'
import DataTable from '@/shared/components/DataTable/DataTable'
import StatusChip from '@/shared/components/StatusChip/StatusChip'
import { useAppDispatch, useAppSelector, useCan } from '@/app/hooks'
import { fetchMovements } from './store/movementsSlice'
import { fetchBalance } from '@/features/warehouse/balance/store/balanceSlice'
import { fetchWarehouses } from '@/features/catalogs/warehouses/store/warehousesSlice'
import { createStockMovement } from '@/shared/services/operations'
import { useAction } from '@/shared/hooks/useAction'
import { MOVEMENT_TYPES, STATUS_LABELS } from '@/shared/constants'
import type { StockMovement } from '@/shared/types/document.types'
import { formatDate, formatNumber } from '@/shared/utils/formatters'
import type { TableColumn } from '@/shared/types/common.types'

export default function MovementsPage() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const { items, loading } = useAppSelector((s) => s.movements)
  const balance = useAppSelector((s) => s.balance.items)
  const warehouses = useAppSelector((s) => s.warehouses.items)
  const canCreate = useCan('movements.create')
  const { busy, run } = useAction()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'transfer' | 'writeoff'>('transfer')
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [productId, setProductId] = useState('')
  const [qty, setQty] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => { dispatch(fetchMovements()); dispatch(fetchBalance()); dispatch(fetchWarehouses()) }, [dispatch])

  const stockHere = balance.filter((b) => b.warehouseId === fromId && b.availableQty > 0)
  const selected = stockHere.find((b) => b.productId === productId)
  const qtyNum = Number(qty)
  const qtyError = qty !== '' && (!(qtyNum > 0) || (selected ? qtyNum > selected.availableQty : false))
  const valid = !!fromId && !!selected && qtyNum > 0 && !qtyError && (type === 'writeoff' || (!!toId && toId !== fromId))

  const reset = () => { setFromId(''); setToId(''); setProductId(''); setQty(''); setNotes(''); setType('transfer') }

  const submit = async () => {
    if (!selected) return
    const from = warehouses.find((w) => w.id === fromId)
    const to = warehouses.find((w) => w.id === toId)
    const ok = await run(() => dispatch(createStockMovement({
      type, fromWarehouseId: fromId, fromWarehouseName: from?.name ?? '',
      toWarehouseId: type === 'transfer' ? toId : undefined, toWarehouseName: type === 'transfer' ? to?.name : undefined,
      item: { productId: selected.productId, productName: selected.productName, unit: selected.unit, qty: qtyNum, price: selected.costPrice, discount: 0, sum: qtyNum * selected.costPrice },
      notes,
    })), 'Harakat saqlandi')
    if (ok) { setOpen(false); reset() }
  }

  const columns = useMemo<TableColumn<StockMovement>[]>(() => [
    { id: 'number', label: 'Raqam', minWidth: 120 },
    { id: 'date', label: 'Sana', minWidth: 100, format: (v) => formatDate(v as string), exportValue: (r) => formatDate(r.date) },
    { id: 'type', label: 'Turi', minWidth: 130, format: (v) => t(MOVEMENT_TYPES[v as string] || (v as string)), exportValue: (r) => t(MOVEMENT_TYPES[r.type] || r.type) },
    { id: 'fromWarehouseName', label: 'Dan', minWidth: 140 },
    { id: 'toWarehouseName', label: 'Ga', minWidth: 140 },
    { id: 'items', label: 'Mahsulot', minWidth: 200,
      format: (_v, r) => r.items.map((i) => `${i.productName} × ${formatNumber(i.qty)}`).join(', '),
      exportValue: (r) => r.items.map((i) => `${i.productName} × ${i.qty}`).join(', ') },
    { id: 'status', label: 'Holat', minWidth: 120, format: (v) => <StatusChip status={v as string} />, exportValue: (r) => t(STATUS_LABELS[r.status] ?? r.status) },
  ], [t])

  return (
    <AnimatedPage>
      <PageHeader title="Tovar harakati" subtitle={t('Jami: {{count}}', { count: items.length })}
        breadcrumbs={[{ label: 'Ombor' }, { label: 'Harakat' }]}
        actions={canCreate && <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>{t('Yangi harakat')}</Button>}
      />
      <DataTable columns={columns} rows={items} loading={loading} searchable exportName="tovar_harakati" searchPlaceholder="Hujjat qidirish..." />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{t('Yangi harakat')}</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField select size="small" fullWidth sx={{ mt: 1 }} label={t('Turi')} value={type} onChange={(e) => setType(e.target.value as 'transfer' | 'writeoff')}>
            <MenuItem value="transfer">{t("Ko'chirish")}</MenuItem>
            <MenuItem value="writeoff">{t('Hisobdan chiqarish')}</MenuItem>
          </TextField>
          <TextField select size="small" fullWidth label={t('Dan')} value={fromId} onChange={(e) => { setFromId(e.target.value); setProductId('') }}>
            {warehouses.map((w) => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
          </TextField>
          {type === 'transfer' && (
            <TextField select size="small" fullWidth label={t('Ga')} value={toId} onChange={(e) => setToId(e.target.value)}>
              {warehouses.filter((w) => w.id !== fromId).map((w) => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
            </TextField>
          )}
          <TextField select size="small" fullWidth label={t('Mahsulot')} value={productId} onChange={(e) => setProductId(e.target.value)} disabled={!fromId}
            helperText={fromId && stockHere.length === 0 ? t("Omborda tovar yo'q") : undefined}>
            {stockHere.map((b) => <MenuItem key={b.productId} value={b.productId}>{b.productName} ({t('Mavjud')}: {formatNumber(b.availableQty)})</MenuItem>)}
          </TextField>
          <TextField size="small" fullWidth type="number" label={t('Soni')} value={qty} onChange={(e) => setQty(e.target.value)}
            error={qtyError} helperText={qtyError ? t("Miqdor noto'g'ri yoki mavjuddan ko'p") : undefined} />
          <TextField size="small" fullWidth label={t('Izoh')} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setOpen(false)} variant="outlined" color="inherit">{t('Bekor')}</Button>
          <Button onClick={submit} variant="contained" disabled={!valid || busy}>{t('Saqlash')}</Button>
        </DialogActions>
      </Dialog>
    </AnimatedPage>
  )
}
