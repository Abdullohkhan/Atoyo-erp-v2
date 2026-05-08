import { Button, IconButton, Tooltip, Box, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Typography, Avatar } from '@mui/material'
import { Add, Edit, Delete, OpenInNew } from '@mui/icons-material'
import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import PageHeader from '@/shared/components/PageHeader/PageHeader'
import DataTable from '@/shared/components/DataTable/DataTable'
import ConfirmDialog from '@/shared/components/ConfirmDialog/ConfirmDialog'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchCustomers, createCustomer, updateCustomer, deleteCustomer } from './store/customersSlice'
import type { Customer } from '@/shared/types/catalog.types'
import { formatCurrency, generateId, getInitials } from '@/shared/utils/formatters'
import type { TableColumn } from '@/shared/types/common.types'

const schema = z.object({
  name: z.string().min(2), code: z.string().min(1), phone: z.string().min(9),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(), inn: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const COLUMNS: TableColumn<Customer>[] = [
  { id: 'name', label: 'Mijoz', minWidth: 200,
    format: (v) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', bgcolor: 'primary.main', borderRadius: 1.5 }}>
          {getInitials(v as string)}
        </Avatar>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>{v as string}</Typography>
      </Box>
    ),
  },
  { id: 'phone', label: 'Telefon', minWidth: 140 },
  { id: 'address', label: 'Manzil', minWidth: 180 },
  { id: 'debt', label: 'Qarz / Balans', minWidth: 150, align: 'right',
    format: (v) => (
      <Chip
        label={formatCurrency(v as number)}
        color={(v as number) > 0 ? 'error' : 'success'} size="small"
        sx={{ fontWeight: 700, borderRadius: 1 }}
      />
    ),
  },
  { id: 'totalPurchases', label: 'Jami xarid', minWidth: 140, align: 'right',
    format: (v) => formatCurrency(v as number),
  },
  { id: 'isActive', label: 'Holat', minWidth: 80,
    format: (v) => <Chip label={v ? 'Faol' : 'Nofaol'} color={v ? 'success' : 'default'} size="small" sx={{ borderRadius: 1 }} />,
  },
]

export default function CustomersPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { items, loading } = useAppSelector((s) => s.customers)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [deleting, setDeleting] = useState<Customer | null>(null)
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) as any })

  useEffect(() => { dispatch(fetchCustomers()) }, [dispatch])

  const openCreate = () => { reset({ name: '', code: '', phone: '' }); setEditing(null); setOpen(true) }
  const openEdit = (c: Customer) => { reset(c); setEditing(c); setOpen(true) }

  const onSubmit = async (data: FormData) => {
    const now = new Date().toISOString()
    if (editing) await dispatch(updateCustomer({ id: editing.id, data }))
    else await dispatch(createCustomer({ id: generateId(), ...data, debt: 0, totalPurchases: 0, isActive: true, createdAt: now, email: data.email || '', address: data.address || '', inn: data.inn || '' } as any))
    setOpen(false)
  }

  return (
    <AnimatedPage>
      <PageHeader
        title="Mijozlar" subtitle={`Jami: ${items.length} ta mijoz`}
        breadcrumbs={[{ label: 'Kataloglar' }, { label: 'Mijozlar' }]}
        actions={<Button variant="contained" startIcon={<Add />} onClick={openCreate}>Yangi mijoz</Button>}
      />
      <DataTable
        columns={COLUMNS} rows={items} loading={loading} searchable
        searchPlaceholder="Mijoz qidirish (ism, telefon)..."
        onRowClick={(row) => navigate(`/catalogs/customers/${row.id}`)}
        rowActions={(row) => (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Batafsil"><IconButton size="small" color="primary" onClick={() => navigate(`/catalogs/customers/${row.id}`)}><OpenInNew fontSize="small" /></IconButton></Tooltip>
            <Tooltip title="Tahrirlash"><IconButton size="small" onClick={() => openEdit(row)}><Edit fontSize="small" /></IconButton></Tooltip>
            <Tooltip title="O'chirish"><IconButton size="small" color="error" onClick={() => setDeleting(row)}><Delete fontSize="small" /></IconButton></Tooltip>
          </Box>
        )}
      />
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? 'Mijozni tahrirlash' : 'Yangi mijoz qo\'shish'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            {[
              { name: 'code', label: 'Kod', xs: 4 }, { name: 'name', label: "To'liq ismi", xs: 8 },
              { name: 'phone', label: 'Telefon', xs: 6 }, { name: 'email', label: 'Email', xs: 6 },
              { name: 'address', label: 'Do\'kon manzili', xs: 8 }, { name: 'inn', label: 'INN', xs: 4 },
            ].map(({ name, label, xs }) => (
              <Grid key={name} size={{ xs: 12, sm: xs }}>
                <Controller name={name as keyof FormData} control={control} render={({ field }) => (
                  <TextField {...field} value={field.value ?? ''} label={label} fullWidth size="small"
                    error={!!errors[name as keyof FormData]} helperText={errors[name as keyof FormData]?.message} />
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
      <ConfirmDialog open={!!deleting} message={`"${deleting?.name}" mijozini o'chirasizmi?`}
        onConfirm={async () => { if (deleting) { await dispatch(deleteCustomer(deleting.id)); setDeleting(null) } }}
        onClose={() => setDeleting(null)} />
    </AnimatedPage>
  )
}
