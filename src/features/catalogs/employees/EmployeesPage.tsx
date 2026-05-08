import { Button, IconButton, Tooltip, Box, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Avatar } from '@mui/material'
import { Add, Edit, Delete } from '@mui/icons-material'
import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import PageHeader from '@/shared/components/PageHeader/PageHeader'
import DataTable from '@/shared/components/DataTable/DataTable'
import ConfirmDialog from '@/shared/components/ConfirmDialog/ConfirmDialog'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee } from './store/employeesSlice'
import type { Employee } from '@/shared/types/catalog.types'
import { formatCurrency, generateId, getInitials } from '@/shared/utils/formatters'
import type { TableColumn } from '@/shared/types/common.types'

const COLUMNS: TableColumn<Employee>[] = [
  { id: 'fullName', label: 'Xodim', minWidth: 200,
    format: (v, _row) => <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', bgcolor: 'primary.main' }}>{getInitials(v as string)}</Avatar>
      {v as string}
    </Box> },
  { id: 'position', label: 'Lavozim', minWidth: 140 },
  { id: 'department', label: "Bo'lim", minWidth: 120 },
  { id: 'phone', label: 'Telefon', minWidth: 130 },
  { id: 'salary', label: 'Maosh', minWidth: 120, align: 'right', format: (v) => formatCurrency(v as number) },
  { id: 'isActive', label: 'Holat', minWidth: 80, format: (v) => <Chip label={v ? 'Faol' : 'Nofaol'} color={v ? 'success' : 'default'} size="small" sx={{ borderRadius: 1 }} /> },
]

export default function EmployeesPage() {
  const dispatch = useAppDispatch()
  const { items, loading } = useAppSelector((s) => s.employees)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [deleting, setDeleting] = useState<Employee | null>(null)
  const { control, handleSubmit, reset } = useForm<Partial<Employee>>()

  useEffect(() => { dispatch(fetchEmployees()) }, [dispatch])
  const openCreate = () => { reset({ isActive: true, salary: 0 }); setEditing(null); setOpen(true) }
  const openEdit = (e: Employee) => { reset(e); setEditing(e); setOpen(true) }

  const onSubmit = async (data: Partial<Employee>) => {
    const now = new Date().toISOString()
    if (editing) await dispatch(updateEmployee({ id: editing.id, data }))
    else await dispatch(createEmployee({ id: generateId(), ...data, isActive: true, createdAt: now } as any))
    setOpen(false)
  }

  return (
    <AnimatedPage>
      <PageHeader title="Xodimlar" subtitle={`Jami: ${items.length}`}
        breadcrumbs={[{ label: 'Kataloglar' }, { label: 'Xodimlar' }]}
        actions={<Button variant="contained" startIcon={<Add />} onClick={openCreate}>Qo'shish</Button>}
      />
      <DataTable columns={COLUMNS} rows={items} loading={loading} searchable searchPlaceholder="Xodim qidirish..."
        rowActions={(row) => (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Tahrirlash"><IconButton size="small" onClick={() => openEdit(row)}><Edit fontSize="small" /></IconButton></Tooltip>
            <Tooltip title="O'chirish"><IconButton size="small" color="error" onClick={() => setDeleting(row)}><Delete fontSize="small" /></IconButton></Tooltip>
          </Box>
        )}
      />
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? 'Tahrirlash' : 'Yangi xodim'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            {[{ name: 'code', label: 'Kod', xs: 4 }, { name: 'fullName', label: 'To\'liq ismi', xs: 8 },
              { name: 'position', label: 'Lavozim', xs: 6 }, { name: 'department', label: "Bo'lim", xs: 6 },
              { name: 'phone', label: 'Telefon', xs: 6 }, { name: 'salary', label: 'Maosh', xs: 6, type: 'number' },
              { name: 'hireDate', label: 'Ishga kirgan sana', xs: 6, type: 'date' }].map(({ name, label, xs, type }) => (
              <Grid key={name} size={{ xs: 12, sm: xs }}>
                <Controller name={name as keyof Employee} control={control} render={({ field }) => (
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
      <ConfirmDialog open={!!deleting} message={`"${deleting?.fullName}" xodimini o'chirasizmi?`}
        onConfirm={async () => { if (deleting) { await dispatch(deleteEmployee(deleting.id)); setDeleting(null) } }}
        onClose={() => setDeleting(null)} />
    </AnimatedPage>
  )
}
