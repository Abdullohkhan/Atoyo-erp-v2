import { Button, IconButton, Tooltip, Box, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid } from '@mui/material'
import { Add, Edit, Delete } from '@mui/icons-material'
import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import PageHeader from '@/shared/components/PageHeader/PageHeader'
import DataTable from '@/shared/components/DataTable/DataTable'
import ConfirmDialog from '@/shared/components/ConfirmDialog/ConfirmDialog'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchSuppliers, createSupplier, updateSupplier, deleteSupplier } from './store/suppliersSlice'
import type { Supplier } from '@/shared/types/catalog.types'
import { formatCurrency, generateId } from '@/shared/utils/formatters'
import type { TableColumn } from '@/shared/types/common.types'

const COLUMNS: TableColumn<Supplier>[] = [
  { id: 'code', label: 'Kod', minWidth: 80 },
  { id: 'name', label: 'Nomi', minWidth: 200 },
  { id: 'phone', label: 'Telefon', minWidth: 130 },
  { id: 'inn', label: 'INN', minWidth: 110 },
  { id: 'balance', label: 'Balans', minWidth: 130, align: 'right', format: (v) => formatCurrency(v as number) },
  { id: 'isActive', label: 'Holat', minWidth: 80, format: (v) => <Chip label={v ? 'Faol' : 'Nofaol'} color={v ? 'success' : 'default'} size="small" sx={{ borderRadius: 1 }} /> },
]

export default function SuppliersPage() {
  const dispatch = useAppDispatch()
  const { items, loading } = useAppSelector((s) => s.suppliers)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [deleting, setDeleting] = useState<Supplier | null>(null)
  const { control, handleSubmit, reset } = useForm<Partial<Supplier>>()

  useEffect(() => { dispatch(fetchSuppliers()) }, [dispatch])
  const openCreate = () => { reset({ isActive: true }); setEditing(null); setOpen(true) }
  const openEdit = (s: Supplier) => { reset(s); setEditing(s); setOpen(true) }

  const onSubmit = async (data: Partial<Supplier>) => {
    const now = new Date().toISOString()
    if (editing) await dispatch(updateSupplier({ id: editing.id, data }))
    else await dispatch(createSupplier({ id: generateId(), ...data, balance: 0, totalSupplied: 0, isActive: true, createdAt: now } as any))
    setOpen(false)
  }

  return (
    <AnimatedPage>
      <PageHeader title="Yetkazuvchilar" subtitle={`Jami: ${items.length}`}
        breadcrumbs={[{ label: 'Kataloglar' }, { label: 'Yetkazuvchilar' }]}
        actions={<Button variant="contained" startIcon={<Add />} onClick={openCreate}>Qo'shish</Button>}
      />
      <DataTable columns={COLUMNS} rows={items} loading={loading} searchable searchPlaceholder="Yetkazuvchi qidirish..."
        rowActions={(row) => (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Tahrirlash"><IconButton size="small" onClick={() => openEdit(row)}><Edit fontSize="small" /></IconButton></Tooltip>
            <Tooltip title="O'chirish"><IconButton size="small" color="error" onClick={() => setDeleting(row)}><Delete fontSize="small" /></IconButton></Tooltip>
          </Box>
        )}
      />
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? 'Tahrirlash' : 'Yangi yetkazuvchi'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            {[{ name: 'code', label: 'Kod', xs: 4 }, { name: 'name', label: 'Nomi', xs: 8 },
              { name: 'phone', label: 'Telefon', xs: 6 }, { name: 'email', label: 'Email', xs: 6 },
              { name: 'address', label: 'Manzil', xs: 8 }, { name: 'inn', label: 'INN', xs: 4 }].map(({ name, label, xs }) => (
              <Grid key={name} size={{ xs: 12, sm: xs }}>
                <Controller name={name as keyof Supplier} control={control} render={({ field }) => (
                  <TextField {...field} value={field.value ?? ''} label={label} fullWidth size="small" />
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
      <ConfirmDialog open={!!deleting} message={`"${deleting?.name}" ni o'chirasizmi?`}
        onConfirm={async () => { if (deleting) { await dispatch(deleteSupplier(deleting.id)); setDeleting(null) } }}
        onClose={() => setDeleting(null)} />
    </AnimatedPage>
  )
}
