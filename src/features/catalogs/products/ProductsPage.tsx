import {
  Button, Chip, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem,
  Grid, Box, Switch, FormControlLabel,
} from '@mui/material'
import { Add, Edit, Delete, CheckCircle, Cancel } from '@mui/icons-material'
import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import PageHeader from '@/shared/components/PageHeader/PageHeader'
import DataTable from '@/shared/components/DataTable/DataTable'
import ConfirmDialog from '@/shared/components/ConfirmDialog/ConfirmDialog'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchProducts, createProduct, updateProduct, deleteProduct } from './store/productsSlice'
import type { Product, ProductCategory, UnitOfMeasure } from '@/shared/types/catalog.types'
import { formatCurrency, generateId } from '@/shared/utils/formatters'
import type { TableColumn } from '@/shared/types/common.types'

const CATEGORIES: ProductCategory[] = ['electronics', 'clothing', 'food', 'building', 'chemical', 'other']
const UNITS: UnitOfMeasure[] = ['dona', 'kg', 'litr', 'm', 'm²', 'm³', 'quti', 'juft']
const CAT_LABELS: Record<ProductCategory, string> = {
  electronics: 'Elektronika', clothing: 'Kiyim', food: 'Oziq-ovqat',
  building: 'Qurilish', chemical: 'Kimyo', other: 'Boshqa',
}

const schema = z.object({
  name: z.string().min(2, "Nomi kamida 2 ta harf"),
  code: z.string().min(1, "Kod kiritilsin"),
  unit: z.enum(['dona', 'kg', 'litr', 'm', 'm²', 'm³', 'quti', 'juft']),
  category: z.enum(['electronics', 'clothing', 'food', 'building', 'chemical', 'other']),
  price: z.coerce.number().min(0),
  costPrice: z.coerce.number().min(0),
  barcode: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean(),
})
type FormData = z.infer<typeof schema>

const COLUMNS: TableColumn<Product>[] = [
  { id: 'code',      label: 'Kod',       minWidth: 80 },
  { id: 'name',      label: 'Nomi',      minWidth: 180 },
  { id: 'category',  label: 'Kategoriya', minWidth: 110,
    format: (v) => <Chip label={CAT_LABELS[v as ProductCategory]} size="small" sx={{ borderRadius: 1 }} /> },
  { id: 'unit',      label: "O'lchov",   minWidth: 70 },
  { id: 'price',     label: 'Narxi',     minWidth: 120, align: 'right',
    format: (v) => formatCurrency(v as number) },
  { id: 'costPrice', label: 'Tannarxi',  minWidth: 120, align: 'right',
    format: (v) => formatCurrency(v as number) },
  { id: 'isActive',  label: 'Holat',     minWidth: 80, align: 'center',
    format: (v) => v ? <CheckCircle color="success" fontSize="small" /> : <Cancel color="error" fontSize="small" /> },
]

export default function ProductsPage() {
  const dispatch = useAppDispatch()
  const { items: products, loading } = useAppSelector((s) => s.products)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { isActive: true, unit: 'dona', category: 'other', price: 0, costPrice: 0 },
  })

  useEffect(() => { dispatch(fetchProducts()) }, [dispatch])

  const openCreate = () => { reset({ isActive: true, unit: 'dona', category: 'other', price: 0, costPrice: 0 }); setEditing(null); setDialogOpen(true) }
  const openEdit = (p: Product) => { reset(p); setEditing(p); setDialogOpen(true) }

  const onSubmit = async (data: FormData) => {
    const now = new Date().toISOString()
    if (editing) {
      await dispatch(updateProduct({ id: editing.id, data: { ...data, updatedAt: now } }))
    } else {
      await dispatch(createProduct({ id: generateId(), ...data, createdAt: now, updatedAt: now } as any))
    }
    setDialogOpen(false)
  }

  const handleDelete = async () => {
    if (deleting) { await dispatch(deleteProduct(deleting.id)); setDeleting(null) }
  }

  return (
    <AnimatedPage>
      <PageHeader
        title="Mahsulotlar"
        subtitle={`Jami: ${products.length} ta mahsulot`}
        breadcrumbs={[{ label: 'Kataloglar' }, { label: 'Mahsulotlar' }]}
        actions={<Button variant="contained" startIcon={<Add />} onClick={openCreate}>Qo'shish</Button>}
      />

      <DataTable
        columns={COLUMNS} rows={products} loading={loading} searchable
        searchPlaceholder="Mahsulot qidirish..."
        rowActions={(row) => (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Tahrirlash"><IconButton size="small" onClick={() => openEdit(row)}><Edit fontSize="small" /></IconButton></Tooltip>
            <Tooltip title="O'chirish"><IconButton size="small" color="error" onClick={() => setDeleting(row)}><Delete fontSize="small" /></IconButton></Tooltip>
          </Box>
        )}
      />

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            {([
              { name: 'code', label: 'Kod', xs: 4 },
              { name: 'name', label: 'Nomi', xs: 8 },
              { name: 'price', label: 'Narxi (UZS)', xs: 6, type: 'number' },
              { name: 'costPrice', label: 'Tannarxi (UZS)', xs: 6, type: 'number' },
              { name: 'barcode', label: 'Shtrix-kod', xs: 6 },
              { name: 'description', label: 'Izoh', xs: 6 },
            ] as const).map(({ name, label, xs, ...rest }) => (
              <Grid key={name} size={{ xs: 12, sm: xs }}>
                <Controller name={name as keyof FormData} control={control} render={({ field }) => (
                  <TextField {...field} label={label} fullWidth size="small" type={(rest as {type?:string}).type} error={!!errors[name as keyof FormData]} helperText={errors[name as keyof FormData]?.message} />
                )} />
              </Grid>
            ))}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller name="unit" control={control} render={({ field }) => (
                <TextField {...field} select label="O'lchov birligi" fullWidth size="small">
                  {UNITS.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                </TextField>
              )} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller name="category" control={control} render={({ field }) => (
                <TextField {...field} select label="Kategoriya" fullWidth size="small">
                  {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{CAT_LABELS[c]}</MenuItem>)}
                </TextField>
              )} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Controller name="isActive" control={control} render={({ field }) => (
                <FormControlLabel control={<Switch checked={field.value} onChange={field.onChange} />} label="Faol" />
              )} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined" color="inherit">Bekor</Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained">Saqlash</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleting} message={`"${deleting?.name}" mahsulotini o'chirasizmi?`}
        onConfirm={handleDelete} onClose={() => setDeleting(null)}
      />
    </AnimatedPage>
  )
}
