import {
  Box, Card, Typography, Button, TextField, Grid, MenuItem,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton,
  Autocomplete, Chip, Alert, Tooltip, InputAdornment,
} from '@mui/material'
import { Add, Delete, Save, ArrowBack, Search as SearchIcon, CheckCircle, CalendarMonth } from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import dayjs from 'dayjs'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import PageHeader from '@/shared/components/PageHeader/PageHeader'
import DatePickerModal from '@/shared/components/DatePickerModal/DatePickerModal'
import ProductSearchModal from '@/shared/components/ProductSearchModal/ProductSearchModal'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { createSaleOrder } from '@/features/sales/orders/store/saleOrdersSlice'
import { fetchCustomers } from '@/features/catalogs/customers/store/customersSlice'
import { fetchWarehouses } from '@/features/catalogs/warehouses/store/warehousesSlice'
import { fetchProducts } from '@/features/catalogs/products/store/productsSlice'
import type { Product } from '@/shared/types/catalog.types'
import type { Customer } from '@/shared/types/catalog.types'
import { formatCurrency, generateId } from '@/shared/utils/formatters'

interface OrderRow {
  rowId: string
  productId: string
  productName: string
  productCode: string
  category: string
  unit: string
  qty: number
  retailPrice: number
  wholesalePrice: number
  appliedPrice: number
  total: number
}

const CAT_LABELS: Record<string, string> = {
  electronics: 'Elektronika', building: 'Qurilish', chemical: 'Kimyo',
  food: 'Oziq-ovqat', clothing: 'Kiyim', other: 'Boshqa',
}
const CAT_COLORS: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'error' | 'default'> = {
  electronics: 'info', building: 'warning', chemical: 'error',
  food: 'success', clothing: 'primary', other: 'default',
}

const emptyRow = (): OrderRow => ({
  rowId: generateId(), productId: '', productName: '', productCode: '',
  category: '', unit: 'dona', qty: 1, retailPrice: 0, wholesalePrice: 0, appliedPrice: 0, total: 0,
})

export default function NewOrderPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const customers = useAppSelector((s) => s.customers.items)
  const warehouses = useAppSelector((s) => s.warehouses.items)

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [customerInput, setCustomerInput] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [date, setDate] = useState(dayjs())
  const [rows, setRows] = useState<OrderRow[]>([emptyRow()])
  const [dateModalOpen, setDateModalOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [activeRowId, setActiveRowId] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    dispatch(fetchCustomers())
    dispatch(fetchWarehouses())
    dispatch(fetchProducts())
  }, [dispatch])

  useEffect(() => {
    if (warehouses.length > 0 && !warehouseId) setWarehouseId(warehouses[0].id)
  }, [warehouses])

  // Ctrl+Space
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault()
        setActiveRowId(rows[rows.length - 1].rowId)
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [rows])

  const updateRow = (rowId: string, field: keyof OrderRow, value: unknown) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.rowId !== rowId) return r
        const updated = { ...r, [field]: value }
        updated.total = updated.qty * updated.appliedPrice
        return updated
      }),
    )
  }

  const applyProduct = (product: Product, rowId: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.rowId !== rowId) return r
        return {
          ...r,
          productId: product.id,
          productName: product.name,
          productCode: product.code,
          category: product.category,
          unit: product.unit,
          retailPrice: product.price,
          wholesalePrice: product.costPrice,
          appliedPrice: product.price,
          total: r.qty * product.price,
        }
      }),
    )
  }

  const total = rows.reduce((s, r) => s + r.total, 0)
  const isValid = customer && warehouseId && rows.some((r) => r.productId && r.qty > 0)

  const handleSave = async (status: 'draft' | 'confirmed') => {
    if (!isValid || !customer) return
    const warehouse = warehouses.find((w) => w.id === warehouseId)
    const validRows = rows.filter((r) => r.productId && r.qty > 0)

    await dispatch(createSaleOrder({
      id: generateId(),
      number: `SAV-${String(Date.now()).slice(-6)}`,
      date: date.toISOString(),
      customerId: customer.id,
      customerName: customer.name,
      warehouseId,
      warehouseName: warehouse?.name || '',
      items: validRows.map((r) => ({
        productId: r.productId,
        productName: r.productName,
        unit: r.unit,
        qty: r.qty,
        price: r.appliedPrice,
        discount: 0,
        sum: r.total,
      })),
      status,
      total,
      paid: 0,
      balance: total,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any))
    setSaved(true)
    setTimeout(() => navigate('/sales/orders'), 1200)
  }

  return (
    <AnimatedPage>
      <PageHeader
        title="Yangi spiska (Sotuv)"
        breadcrumbs={[{ label: 'Savdo' }, { label: 'Yangi buyurtma' }]}
        actions={<Button startIcon={<ArrowBack />} variant="outlined" color="inherit" onClick={() => navigate(-1)}>Orqaga</Button>}
      />

      {saved && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>✅ Spiska saqlandi!</Alert>}

      {/* Header */}
      <Card sx={{ p: 2.5, mb: 2, borderRadius: 3 }}>
        <Grid container spacing={2} sx={{ alignItems: "center" }}>
          {/* Client autocomplete */}
          <Grid size={{ xs: 12, sm: 5 }}>
            <Autocomplete
              options={customers}
              getOptionLabel={(c) => c.name}
              value={customer}
              onChange={(_, v) => setCustomer(v)}
              inputValue={customerInput}
              onInputChange={(_, v) => setCustomerInput(v)}
              filterOptions={(opts, { inputValue }) =>
                inputValue.length >= 1
                  ? opts.filter((o) => o.name.toLowerCase().includes(inputValue.toLowerCase()) || o.phone.includes(inputValue))
                  : opts.slice(0, 8)
              }
              renderInput={(params) => <TextField {...params} label="Mijoz *" size="small" placeholder="3 ta harf yozing..." />}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start !important', py: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{option.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{option.phone}</Typography>
                  {option.debt > 0 && (
                    <Chip label={`Qarz: ${formatCurrency(option.debt)}`} color="error" size="small" sx={{ mt: 0.3, height: 18, fontSize: '0.65rem' }} />
                  )}
                </Box>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField select fullWidth size="small" label="Ombor" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
              {warehouses.map((w) => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              fullWidth size="small" label="Sana va vaqt"
              value={date.format('DD.MM.YYYY HH:mm')}
              onClick={() => setDateModalOpen(true)}
              slotProps={{ input: {
                readOnly: true, sx: { cursor: 'pointer' },
                endAdornment: <InputAdornment position="end"><CalendarMonth fontSize="small" color="action" /></InputAdornment>,
              }}}
            />
          </Grid>
        </Grid>

        {/* Customer info bar */}
        {customer && (
          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 2, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Mijoz</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{customer.name}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Telefon</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{customer.phone}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Joriy qarz</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }} color={customer.debt > 0 ? 'error.main' : 'success.main'}>
                {formatCurrency(customer.debt)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Jami xaridlar</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(customer.totalPurchases)}</Typography>
            </Box>
          </Box>
        )}
      </Card>

      {/* Products table */}
      <Card sx={{ borderRadius: 3, overflow: 'hidden', mb: 2 }}>
        <Box sx={{ px: 2, py: 1.5, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 700 }}>Mahsulotlar</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button startIcon={<SearchIcon />} size="small" variant="outlined"
              onClick={() => { setActiveRowId(rows[rows.length - 1].rowId); setSearchOpen(true) }}>
              Qidirish
              <kbd style={{ marginLeft: 6, padding: '1px 5px', borderRadius: 3, border: '1px solid currentColor', fontSize: '0.65rem' }}>Ctrl+Space</kbd>
            </Button>
            <Button startIcon={<Add />} size="small" variant="contained" onClick={() => setRows((p) => [...p, emptyRow()])}>
              Qator
            </Button>
          </Box>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={40}>#</TableCell>
              <TableCell>Mahsulot</TableCell>
              <TableCell width={90}>O'lchov</TableCell>
              <TableCell width={90}>Soni</TableCell>
              <TableCell width={130}>Dona narx</TableCell>
              <TableCell width={130}>Optom narx</TableCell>
              <TableCell width={130}>Qo'llaniladigan narx</TableCell>
              <TableCell width={130} align="right">Jami</TableCell>
              <TableCell width={48} />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, idx) => (
              <motion.tr key={row.rowId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{idx + 1}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    <Box sx={{ flex: 1 }}>
                      {row.productId ? (
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.productName}</Typography>
                            {row.category && (
                              <Chip label={CAT_LABELS[row.category] || row.category}
                                color={CAT_COLORS[row.category] || 'default'} size="small"
                                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, borderRadius: 1 }} />
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary">{row.productCode}</Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>Tanlanmagan</Typography>
                      )}
                    </Box>
                    <Tooltip title="Mahsulot qidirish">
                      <IconButton size="small" color="primary" onClick={() => { setActiveRowId(row.rowId); setSearchOpen(true) }}>
                        <SearchIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={row.unit || '—'} size="small" variant="outlined" sx={{ borderRadius: 1, fontSize: '0.75rem' }} />
                </TableCell>
                <TableCell>
                  <TextField size="small" type="number" value={row.qty}
                    onChange={(e) => updateRow(row.rowId, 'qty', Math.max(1, +e.target.value))}
                    slotProps={{ input: { inputProps: { min: 1, style: { textAlign: 'center' } } } }}
                    sx={{ width: 75 }} />
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600 }}>{formatCurrency(row.retailPrice)}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>{formatCurrency(row.wholesalePrice)}</Typography>
                </TableCell>
                <TableCell>
                  <TextField size="small" type="number" value={row.appliedPrice}
                    onChange={(e) => updateRow(row.rowId, 'appliedPrice', +e.target.value)}
                    sx={{ width: 120 }}
                    slotProps={{ input: { sx: { fontWeight: 700, color: 'primary.main' } } }} />
                </TableCell>
                <TableCell align="right">
                  <Typography sx={{ fontWeight: 700 }} color="primary.main">{formatCurrency(row.total)}</Typography>
                </TableCell>
                <TableCell>
                  <IconButton size="small" color="error" onClick={() => setRows((p) => p.filter((r) => r.rowId !== row.rowId))}>
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
        <Box sx={{ px: 2, py: 1.5, bgcolor: 'action.hover', display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">Mahsulotlar</Typography>
            <Typography sx={{ fontWeight: 700 }}>{rows.filter((r) => r.productId).length} ta</Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">Jami summa</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800 }} color="primary.main">{formatCurrency(total)}</Typography>
          </Box>
        </Box>
      </Card>

      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
        <Button variant="outlined" color="inherit" startIcon={<Save />} disabled={!isValid} onClick={() => handleSave('draft')}>
          Qoralama
        </Button>
        <Button variant="contained" startIcon={<CheckCircle />} disabled={!isValid} onClick={() => handleSave('confirmed')}>
          Tasdiqlash
        </Button>
      </Box>

      <DatePickerModal open={dateModalOpen} value={date}
        onClose={() => setDateModalOpen(false)}
        onConfirm={(d) => { setDate(d); setDateModalOpen(false) }}
        label="Sotuv sanasini tanlang" />
      <ProductSearchModal open={searchOpen} onClose={() => setSearchOpen(false)}
        onSelect={(p) => { if (activeRowId) applyProduct(p, activeRowId) }} />
    </AnimatedPage>
  )
}
