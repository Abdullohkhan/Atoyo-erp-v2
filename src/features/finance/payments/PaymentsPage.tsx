import { useEffect, useState } from 'react'
import { Button, Box, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, MenuItem } from '@mui/material'
import { Add } from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import PageHeader from '@/shared/components/PageHeader/PageHeader'
import DataTable from '@/shared/components/DataTable/DataTable'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchPayments, createPayment } from './store/paymentsSlice'
import type { Payment } from '@/shared/types/document.types'
import { formatCurrency, formatDate, generateId } from '@/shared/utils/formatters'
import type { TableColumn } from '@/shared/types/common.types'

const COLUMNS: TableColumn<Payment>[] = [
  { id: 'number', label: 'Raqam', minWidth: 120 },
  { id: 'date', label: 'Sana', minWidth: 100, format: (v) => formatDate(v as string) },
  { id: 'direction', label: 'Yo\'nalish', minWidth: 100,
    format: (v) => <Chip label={v === 'income' ? 'Kirim' : 'Chiqim'} color={v === 'income' ? 'success' : 'error'} size="small" sx={{ fontWeight: 700, borderRadius: 1 }} /> },
  { id: 'type', label: 'Turi', minWidth: 100, format: (v) => ({ cash: 'Naqd', card: 'Karta', transfer: "O'tkazma" }[v as string] || v as string) },
  { id: 'counterpartyName', label: 'Kontragent', minWidth: 160 },
  { id: 'category', label: 'Kategoriya', minWidth: 130 },
  { id: 'amount', label: 'Summa', minWidth: 140, align: 'right',
    format: (v, row) => <Box sx={{ fontWeight: 700, color: row.direction === 'income' ? 'success.main' : 'error.main' }}>{formatCurrency(v as number)}</Box> },
]

export default function PaymentsPage() {
  const dispatch = useAppDispatch()
  const { items, loading } = useAppSelector((s) => s.payments)
  const [open, setOpen] = useState(false)
  const { control, handleSubmit, reset } = useForm<Partial<Payment>>()

  useEffect(() => { dispatch(fetchPayments()) }, [dispatch])

  const totalIncome = items.filter(p => p.direction === 'income').reduce((s, p) => s + p.amount, 0)
  const totalExpense = items.filter(p => p.direction === 'expense').reduce((s, p) => s + p.amount, 0)

  const onSubmit = async (data: Partial<Payment>) => {
    await dispatch(createPayment({ id: generateId(), ...data, createdAt: new Date().toISOString() } as any))
    setOpen(false)
    reset()
  }

  return (
    <AnimatedPage>
      <PageHeader
        title="To'lovlar"
        subtitle={`Kirim: ${formatCurrency(totalIncome)} | Chiqim: ${formatCurrency(totalExpense)} | Balans: ${formatCurrency(totalIncome - totalExpense)}`}
        breadcrumbs={[{ label: 'Moliya' }, { label: "To'lovlar" }]}
        actions={<Button variant="contained" startIcon={<Add />} onClick={() => { reset({ direction: 'income', type: 'cash', date: new Date().toISOString().slice(0, 10) }); setOpen(true) }}>To'lov kiritish</Button>}
      />
      <DataTable columns={COLUMNS} rows={items} loading={loading} searchable searchPlaceholder="To'lov qidirish..." />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Yangi to'lov</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid size={{ xs: 6 }}>
              <Controller name="direction" control={control} render={({ field }) => (
                <TextField {...field} value={field.value ?? 'income'} select label="Yo'nalish" fullWidth size="small">
                  <MenuItem value="income">Kirim</MenuItem>
                  <MenuItem value="expense">Chiqim</MenuItem>
                </TextField>
              )} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Controller name="type" control={control} render={({ field }) => (
                <TextField {...field} value={field.value ?? 'cash'} select label="Turi" fullWidth size="small">
                  <MenuItem value="cash">Naqd</MenuItem>
                  <MenuItem value="card">Karta</MenuItem>
                  <MenuItem value="transfer">O'tkazma</MenuItem>
                </TextField>
              )} />
            </Grid>
            {[{ name: 'number', label: 'Raqam', xs: 6 }, { name: 'date', label: 'Sana', xs: 6, type: 'date' },
              { name: 'amount', label: 'Summa', xs: 6, type: 'number' }, { name: 'category', label: 'Kategoriya', xs: 6 },
              { name: 'counterpartyName', label: 'Kontragent', xs: 12 }, { name: 'description', label: 'Izoh', xs: 12 }].map(({ name, label, xs, type }) => (
              <Grid key={name} size={{ xs: 12, sm: xs }}>
                <Controller name={name as keyof Payment} control={control} render={({ field }) => (
                  <TextField {...field} value={field.value ?? ''} label={label} fullWidth size="small" type={type} slotProps={{ inputLabel: type === 'date' ? { shrink: true } : {} }} />
                )} />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setOpen(false)} variant="outlined" color="inherit">Bekor</Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained">Saqlash</Button>
        </DialogActions>
      </Dialog>
    </AnimatedPage>
  )
}
