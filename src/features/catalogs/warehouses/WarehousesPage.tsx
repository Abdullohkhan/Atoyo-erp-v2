import { Button, IconButton, Tooltip, Box, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid } from '@mui/material'
import { Add, Edit, Delete } from '@mui/icons-material'
import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import PageHeader from '@/shared/components/PageHeader/PageHeader'
import DataTable from '@/shared/components/DataTable/DataTable'
import ConfirmDialog from '@/shared/components/ConfirmDialog/ConfirmDialog'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from './store/warehousesSlice'
import type { Warehouse } from '@/shared/types/catalog.types'
import { generateId } from '@/shared/utils/formatters'
import type { TableColumn } from '@/shared/types/common.types'

const COLUMNS: TableColumn<Warehouse>[] = [
  { id: 'code', label: 'Kod', minWidth: 80 },
  { id: 'name', label: 'Nomi', minWidth: 200 },
  { id: 'address', label: 'Manzil', minWidth: 200 },
  { id: 'manager', label: 'Mas\'ul', minWidth: 150 },
  { id: 'isActive', label: 'Holat', minWidth: 80, format: (v) => <Chip label={v ? 'Faol' : 'Nofaol'} color={v ? 'success' : 'default'} size="small" sx={{ borderRadius: 1 }} /> },
]

export default function WarehousesPage() {
  const dispatch = useAppDispatch()
  const { items, loading } = useAppSelector((s) => s.warehouses)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Warehouse | null>(null)
  const [deleting, setDeleting] = useState<Warehouse | null>(null)
  const { control, handleSubmit, reset } = useForm<Partial<Warehouse>>()

  useEffect(() => { dispatch(fetchWarehouses()) }, [dispatch])
  const openCreate = () => { reset({ isActive: true }); setEditing(null); setOpen(true) }
  const openEdit = (w: Warehouse) => { reset(w); setEditing(w); setOpen(true) }

  const onSubmit = async (data: Partial<Warehouse>) => {
    if (editing) await dispatch(updateWarehouse({ id: editing.id, data }))
    else await dispatch(createWarehouse({ id: generateId(), ...data, isActive: true, createdAt: new Date().toISOString() } as any))
    setOpen(false)
  }

  return (
    <AnimatedPage>
      <PageHeader title="Omborlar" subtitle={`Jami: ${items.length}`}
        breadcrumbs={[{ label: 'Kataloglar' }, { label: 'Omborlar' }]}
        actions={<Button variant="contained" startIcon={<Add />} onClick={openCreate}>Qo'shish</Button>}
      />
      <DataTable columns={COLUMNS} rows={items} loading={loading} searchable searchPlaceholder="Ombor qidirish..."
        rowActions={(row) => (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Tahrirlash"><IconButton size="small" onClick={() => openEdit(row)}><Edit fontSize="small" /></IconButton></Tooltip>
            <Tooltip title="O'chirish"><IconButton size="small" color="error" onClick={() => setDeleting(row)}><Delete fontSize="small" /></IconButton></Tooltip>
          </Box>
        )}
      />
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? 'Tahrirlash' : 'Yangi ombor'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            {[{ name: 'code', label: 'Kod', xs: 4 }, { name: 'name', label: 'Nomi', xs: 8 },
              { name: 'address', label: 'Manzil', xs: 12 }, { name: 'manager', label: "Mas'ul shaxs", xs: 12 }].map(({ name, label, xs }) => (
              <Grid key={name} size={{ xs: 12, sm: xs }}>
                <Controller name={name as keyof Warehouse} control={control} render={({ field }) => (
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
      <ConfirmDialog open={!!deleting} message={`"${deleting?.name}" omborini o'chirasizmi?`}
        onConfirm={async () => { if (deleting) { await dispatch(deleteWarehouse(deleting.id)); setDeleting(null) } }}
        onClose={() => setDeleting(null)} />
    </AnimatedPage>
  )
}
