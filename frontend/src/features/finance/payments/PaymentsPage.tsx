import { useEffect, useMemo, useState } from 'react'
import { Button, Box, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Grid } from '@mui/material'
import { Add } from '@mui/icons-material'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import PageHeader from '@/shared/components/PageHeader/PageHeader'
import DataTable from '@/shared/components/DataTable/DataTable'
import { useAppDispatch, useAppSelector, useCan } from '@/app/hooks'
import { fetchPayments } from './store/paymentsSlice'
import { fetchCustomers } from '@/features/catalogs/customers/store/customersSlice'
import { fetchSuppliers } from '@/features/catalogs/suppliers/store/suppliersSlice'
import { recordPayment } from '@/shared/services/operations'
import { useAction } from '@/shared/hooks/useAction'
import { PAYMENT_TYPES } from '@/shared/constants'
import type { Payment } from '@/shared/types/document.types'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import { positive, reqStr, optStr } from '@/shared/utils/validation'
import type { TableColumn } from '@/shared/types/common.types'

const schema = z.object({
  direction: z.enum(['income', 'expense']),
  type: z.enum(['cash', 'card', 'transfer']),
  number: optStr,
  date: reqStr(),
  amount: positive,
  category: reqStr(),
  counterpartyId: optStr,
  description: optStr,
})
type FormData = z.infer<typeof schema>

const defaults = (): FormData => ({
  direction: 'income', type: 'cash', number: '', date: new Date().toISOString().slice(0, 10),
  amount: undefined as unknown as number, category: '', counterpartyId: '', description: '',
})

export default function PaymentsPage() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const { items, loading } = useAppSelector((s) => s.payments)
  const customers = useAppSelector((s) => s.customers.items)
  const suppliers = useAppSelector((s) => s.suppliers.items)
  const canWrite = useCan('payments.write')
  const { busy, run } = useAction()
  const [open, setOpen] = useState(false)
  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: defaults(),
  })
  const direction = useWatch({ control, name: 'direction' })

  useEffect(() => { dispatch(fetchPayments()); dispatch(fetchCustomers()); dispatch(fetchSuppliers()) }, [dispatch])

  const totalIncome = items.filter((p) => p.direction === 'income').reduce((s, p) => s + p.amount, 0)
  const totalExpense = items.filter((p) => p.direction === 'expense').reduce((s, p) => s + p.amount, 0)
  const counterparties = direction === 'income' ? customers : suppliers

  const columns = useMemo<TableColumn<Payment>[]>(() => [
    { id: 'number', label: 'Raqam', minWidth: 120 },
    { id: 'date', label: 'Sana', minWidth: 100, format: (v) => formatDate(v as string), exportValue: (r) => formatDate(r.date) },
    { id: 'direction', label: "Yo'nalish", minWidth: 100,
      format: (v) => <Chip label={v === 'income' ? t('Kirim') : t('Chiqim')} color={v === 'income' ? 'success' : 'error'} size="small" sx={{ fontWeight: 700, borderRadius: 1 }} />,
      exportValue: (r) => (r.direction === 'income' ? t('Kirim') : t('Chiqim')) },
    { id: 'type', label: 'Turi', minWidth: 100, format: (v) => t(PAYMENT_TYPES[v as string] || (v as string)), exportValue: (r) => t(PAYMENT_TYPES[r.type] || r.type) },
    { id: 'counterpartyName', label: 'Kontragent', minWidth: 160 },
    { id: 'category', label: 'Kategoriya', minWidth: 130 },
    { id: 'amount', label: 'Summa', minWidth: 140, align: 'right',
      format: (v, row) => <Box sx={{ fontWeight: 700, color: row.direction === 'income' ? 'success.main' : 'error.main' }}>{formatCurrency(v as number)}</Box> },
  ], [t])

  const onSubmit = handleSubmit(async (d) => {
    const cp = counterparties.find((c) => c.id === d.counterpartyId)
    const ok = await run(() => dispatch(recordPayment({
      direction: d.direction, type: d.type, number: d.number || undefined, date: d.date, amount: d.amount, category: d.category,
      description: d.description || undefined, counterpartyId: cp?.id, counterpartyName: cp?.name,
    })), "To'lov saqlandi")
    if (ok) setOpen(false)
  })

  const err = (k: keyof FormData) => {
    const m = errors[k]?.message
    return { error: !!m, helperText: m ? t(m) : undefined }
  }

  return (
    <AnimatedPage>
      <PageHeader
        title="To'lovlar"
        subtitle={t('Kirim: {{income}} | Chiqim: {{expense}} | Balans: {{balance}}', { income: formatCurrency(totalIncome), expense: formatCurrency(totalExpense), balance: formatCurrency(totalIncome - totalExpense) })}
        breadcrumbs={[{ label: 'Moliya' }, { label: "To'lovlar" }]}
        actions={canWrite && <Button variant="contained" startIcon={<Add />} onClick={() => { reset(defaults()); setOpen(true) }}>{t("To'lov kiritish")}</Button>}
      />
      <DataTable columns={columns} rows={items} loading={loading} searchable exportName="tolovlar" searchPlaceholder="To'lov qidirish..." />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{t("Yangi to'lov")}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller name="direction" control={control} render={({ field }) => (
                <TextField {...field} select label={t("Yo'nalish")} fullWidth size="small" onChange={(e) => { field.onChange(e); setValue('counterpartyId', '') }}>
                  <MenuItem value="income">{t('Kirim')}</MenuItem>
                  <MenuItem value="expense">{t('Chiqim')}</MenuItem>
                </TextField>
              )} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller name="type" control={control} render={({ field }) => (
                <TextField {...field} select label={t('Turi')} fullWidth size="small">
                  {Object.entries(PAYMENT_TYPES).map(([k, v]) => <MenuItem key={k} value={k}>{t(v)}</MenuItem>)}
                </TextField>
              )} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller name="number" control={control} render={({ field }) => (
                <TextField {...field} value={field.value ?? ''} label={t('Raqam')} placeholder={t('Avtomatik')} fullWidth size="small" {...err('number')} />
              )} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller name="date" control={control} render={({ field }) => (
                <TextField {...field} type="date" label={t('Sana')} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} {...err('date')} />
              )} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller name="amount" control={control} render={({ field }) => (
                <TextField {...field} value={field.value ?? ''} type="number" label={t('Summa')} fullWidth size="small"
                  onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} {...err('amount')} />
              )} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller name="category" control={control} render={({ field }) => (
                <TextField {...field} label={t('Kategoriya')} fullWidth size="small" {...err('category')} />
              )} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Controller name="counterpartyId" control={control} render={({ field }) => (
                <TextField {...field} value={field.value ?? ''} select fullWidth size="small"
                  label={direction === 'income' ? t('Mijoz') : t('Yetkazuvchi')}
                  helperText={t("Tanlansa to'lov ochiq hujjatlarga (eskisidan boshlab) taqsimlanadi")}>
                  <MenuItem value="">{t('— Tanlanmagan —')}</MenuItem>
                  {counterparties.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </TextField>
              )} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Controller name="description" control={control} render={({ field }) => (
                <TextField {...field} value={field.value ?? ''} label={t('Izoh')} fullWidth size="small" />
              )} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setOpen(false)} variant="outlined" color="inherit">{t('Bekor')}</Button>
          <Button onClick={onSubmit} variant="contained" disabled={busy}>{t('Saqlash')}</Button>
        </DialogActions>
      </Dialog>
    </AnimatedPage>
  )
}
