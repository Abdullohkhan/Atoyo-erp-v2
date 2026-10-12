import {
  Box, Card, Typography, Button, TextField, Grid, MenuItem,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton,
  Autocomplete, Chip, Tooltip, InputAdornment,
} from '@mui/material'
import { Add, Delete, Save, ArrowBack, Search as SearchIcon, CheckCircle, CalendarMonth } from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import dayjs from 'dayjs'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import PageHeader from '@/shared/components/PageHeader/PageHeader'
import DatePickerModal from '@/shared/components/DatePickerModal/DatePickerModal'
import ProductSearchModal from '@/shared/components/ProductSearchModal/ProductSearchModal'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { createSaleOrder } from '@/features/sales/orders/store/saleOrdersSlice'
import { confirmSaleOrder, operationError } from '@/shared/services/operations'
import { fetchBalance } from '@/features/warehouse/balance/store/balanceSlice'
import { notify } from '@/app/uiSlice'
import { CAT_LABELS } from '@/shared/constants'
import { fetchCustomers } from '@/features/catalogs/customers/store/customersSlice'
import { fetchWarehouses } from '@/features/catalogs/warehouses/store/warehousesSlice'
import { fetchProducts } from '@/features/catalogs/products/store/productsSlice'
import type { Product } from '@/shared/types/catalog.types'
import type { Customer } from '@/shared/types/catalog.types'
import type { SaleOrder } from '@/shared/types/document.types'
import { formatCurrency, generateId, generateNumber } from '@/shared/utils/formatters'

interface OrderRow {
  rowId: string
  productId: string
  productName: string
  productCode: string
  category: string
  unit: string
  qty: number
  retailPrice: number
  appliedPrice: number
  total: number
}

const CAT_COLORS: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'error' | 'default'> = {
  electronics: 'info', building: 'warning', chemical: 'error',
  food: 'success', clothing: 'primary', other: 'default',
}

const emptyRow = (): OrderRow => ({
  rowId: generateId(), productId: '', productName: '', productCode: '',
  category: '', unit: 'dona', qty: 1, retailPrice: 0, appliedPrice: 0, total: 0,
})

export default function NewOrderPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const balance = useAppSelector((s) => s.balance.items)
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
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    dispatch(fetchCustomers())
    dispatch(fetchWarehouses())
    dispatch(fetchProducts())
    dispatch(fetchBalance())
  }, [dispatch])

  const effectiveWarehouseId = warehouseId || warehouses[0]?.id || ''
  const available = (productId: string) =>
    balance.find((b) => b.warehouseId === effectiveWarehouseId && b.productId === productId)?.availableQty ?? 0

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
        const updated = { ...r, [field]: value } as OrderRow
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
          appliedPrice: product.price,
          total: r.qty * product.price,
        }
      }),
    )
  }

  const total = rows.reduce((s, r) => s + r.total, 0)
  const validRows = rows.filter((r) => r.productId && r.qty > 0 && r.appliedPrice > 0)
  const isValid = !!customer && !!effectiveWarehouseId && validRows.length > 0
  const stockOk = validRows.every((r) => r.qty <= available(r.productId))

  const handleSave = async (status: 'draft' | 'confirmed') => {
    if (!isValid || !customer || saving) return
    const warehouse = warehouses.find((w) => w.id === effectiveWarehouseId)
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const created = await dispatch(createSaleOrder({
        number: generateNumber('SAV'),
        date: date.toISOString(),
        customerId: customer.id,
        customerName: customer.name,
        warehouseId: effectiveWarehouseId,
        warehouseName: warehouse?.name || '',
        items: validRows.map((r) => ({
          productId: r.productId, productName: r.productName, unit: r.unit,
          qty: r.qty, price: r.appliedPrice, discount: 0, sum: r.total,
        })),
        status: 'draft',
        total,
        paid: 0,
        balance: total,
        createdAt: now,
        updatedAt: now,
      } as Omit<SaleOrder, 'id'>)).unwrap()
      if (status === 'confirmed') {
        try {
          await dispatch(confirmSaleOrder(created.id))
        } catch (e) {
          dispatch(notify({ message: `${t('Qoralama sifatida saqlandi')}: ${operationError(e)}`, severity: 'warning' }))
          navigate('/sales/orders')
          return
        }
      }
      dispatch(notify({ message: t('Spiska saqlandi') }))
      navigate('/sales/orders')
    } catch (e) {
      dispatch(notify({ message: operationError(e), severity: 'error' }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatedPage>
      <PageHeader
        title="Yangi spiska (Sotuv)"
        breadcrumbs={[{ label: 'Savdo' }, { label: 'Yangi buyurtma' }]}
        actions={<Button startIcon={<ArrowBack />} variant="outlined" color="inherit" onClick={() => navigate(-1)}>{t('Orqaga')}</Button>}
      />


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
              renderInput={(params) => <TextField {...params} label={`${t('Mijoz')} *`} size="small" placeholder={t('Ism yoki telefon yozing...')} />}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start !important', py: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{option.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{option.phone}</Typography>
                  {option.debt > 0 && (
                    <Chip label={`${t('Qarz')}: ${formatCurrency(option.debt)}`} color="error" size="small" sx={{ mt: 0.3, height: 18, fontSize: '0.65rem' }} />
                  )}
                </Box>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField select fullWidth size="small" label={t('Ombor')} value={effectiveWarehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
              {warehouses.map((w) => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              fullWidth size="small" label={t('Sana va vaqt')}
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
              <Typography variant="caption" color="text.secondary">{t('Mijoz')}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{customer.name}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">{t('Telefon')}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{customer.phone}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">{t('Joriy qarz')}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }} color={customer.debt > 0 ? 'error.main' : 'success.main'}>
                {formatCurrency(customer.debt)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">{t('Jami xaridlar')}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(customer.totalPurchases)}</Typography>
            </Box>
          </Box>
        )}
      </Card>

      {/* Products table */}
      <Card sx={{ borderRadius: 3, overflow: 'hidden', mb: 2 }}>
        <Box sx={{ px: 2, py: 1.5, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 700 }}>{t('Mahsulotlar')}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button startIcon={<SearchIcon />} size="small" variant="outlined"
              onClick={() => { setActiveRowId(rows[rows.length - 1].rowId); setSearchOpen(true) }}>
              {t('Qidirish')}
              <kbd style={{ marginLeft: 6, padding: '1px 5px', borderRadius: 3, border: '1px solid currentColor', fontSize: '0.65rem' }}>Ctrl+Space</kbd>
            </Button>
            <Button startIcon={<Add />} size="small" variant="contained" onClick={() => setRows((p) => [...p, emptyRow()])}>
              {t('Qator')}
            </Button>
          </Box>
        </Box>
        <Box sx={{ overflowX: 'auto' }}><Table size="small" sx={{ minWidth: 760 }}>
          <TableHead>
            <TableRow>
              <TableCell width={40}>#</TableCell>
              <TableCell>{t('Mahsulot')}</TableCell>
              <TableCell width={90}>{t("O'lchov")}</TableCell>
              <TableCell width={90}>{t('Soni')}</TableCell>
              <TableCell width={130}>{t('Dona narx')}</TableCell>
              <TableCell width={130}>{t("Qo'llaniladigan narx")}</TableCell>
              <TableCell width={130} align="right">{t('Jami')}</TableCell>
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
                              <Chip label={t((CAT_LABELS as Record<string, string>)[row.category] || row.category)}
                                color={CAT_COLORS[row.category] || 'default'} size="small"
                                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, borderRadius: 1 }} />
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary">{row.productCode}</Typography>
                          <Typography variant="caption" sx={{ ml: 1, fontWeight: 600 }} color={row.qty > available(row.productId) ? 'error.main' : 'success.main'}>
                            {t('Mavjud')}: {available(row.productId)}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>{t('Tanlanmagan')}</Typography>
                      )}
                    </Box>
                    <Tooltip title={t('Mahsulot qidirish')}>
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
        </Table></Box>
        <Box sx={{ px: 2, py: 1.5, bgcolor: 'action.hover', display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">{t('Mahsulotlar')}</Typography>
            <Typography sx={{ fontWeight: 700 }}>{t('{{count}} ta', { count: rows.filter((r) => r.productId).length })}</Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">{t('Jami summa')}</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800 }} color="primary.main">{formatCurrency(total)}</Typography>
          </Box>
        </Box>
      </Card>

      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
        <Button variant="outlined" color="inherit" startIcon={<Save />} disabled={!isValid || saving} onClick={() => handleSave('draft')}>
          {t('Qoralama')}
        </Button>
        <Button variant="contained" startIcon={<CheckCircle />} disabled={!isValid || saving || !stockOk} onClick={() => handleSave('confirmed')}>
          {t('Tasdiqlash')}
        </Button>
      </Box>

      <DatePickerModal open={dateModalOpen} value={date}
        onClose={() => setDateModalOpen(false)}
        onConfirm={(d) => { setDate(d); setDateModalOpen(false) }}
        label={t('Sotuv sanasini tanlang')} />
      <ProductSearchModal open={searchOpen} onClose={() => setSearchOpen(false)}
        onSelect={(p) => { if (activeRowId) applyProduct(p, activeRowId) }} />
    </AnimatedPage>
  )
}
