import {
  Box, Card, Typography, Button, TextField, MenuItem, Grid,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Chip, Tooltip,
} from '@mui/material'
import {
  Add, Delete, Save, ArrowBack, Search as SearchIcon, CheckCircle,
} from '@mui/icons-material'
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
import { createPurchase, operationError } from '@/shared/services/operations'
import { notify } from '@/app/uiSlice'
import { fetchSuppliers } from '@/features/catalogs/suppliers/store/suppliersSlice'
import { fetchWarehouses } from '@/features/catalogs/warehouses/store/warehousesSlice'
import { fetchProducts } from '@/features/catalogs/products/store/productsSlice'
import type { Product } from '@/shared/types/catalog.types'
import { formatCurrency, generateId } from '@/shared/utils/formatters'

interface RowItem {
  rowId: string
  productId: string
  productName: string
  productCode: string
  unit: string
  qty: number
  costPrice: number
  salePrice: number
  total: number
}

const emptyRow = (): RowItem => ({
  rowId: generateId(), productId: '', productName: '', productCode: '',
  unit: 'dona', qty: 1, costPrice: 0, salePrice: 0, total: 0,
})

export default function ReceiptPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const suppliers = useAppSelector((s) => s.suppliers.items)
  const warehouses = useAppSelector((s) => s.warehouses.items)

  const [supplierId, setSupplierId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [date, setDate] = useState(dayjs())
  const [notes, setNotes] = useState('')
  const [rows, setRows] = useState<RowItem[]>([emptyRow()])
  const [dateModalOpen, setDateModalOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [activeRowId, setActiveRowId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    dispatch(fetchSuppliers())
    dispatch(fetchWarehouses())
    dispatch(fetchProducts())
  }, [dispatch])

  const effectiveWarehouseId = warehouseId || warehouses[0]?.id || ''

  // Ctrl+Space shortcut
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

  const updateRow = (rowId: string, field: keyof RowItem, value: unknown) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.rowId !== rowId) return r
        const updated = { ...r, [field]: value } as RowItem
        updated.total = updated.qty * updated.costPrice
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
          unit: product.unit,
          costPrice: product.costPrice,
          salePrice: product.price,
          total: r.qty * product.costPrice,
        }
      }),
    )
  }

  const openSearchForRow = (rowId: string) => {
    setActiveRowId(rowId)
    setSearchOpen(true)
  }

  const totalCost = rows.reduce((s, r) => s + r.total, 0)
  const isValid = !!supplierId && !!effectiveWarehouseId && rows.some((r) => r.productId && r.qty > 0 && r.costPrice > 0)

  const handleSave = async (status: 'draft' | 'confirmed') => {
    if (!isValid || saving) return
    const validRows = rows.filter((r) => r.productId && r.qty > 0 && r.costPrice > 0)
    setSaving(true)
    try {
      await dispatch(createPurchase({
        date: date.toISOString(),
        supplierId,
        warehouseId: effectiveWarehouseId,
        items: validRows.map((r) => ({ productId: r.productId, qty: r.qty, price: r.costPrice, salePrice: r.salePrice || undefined })),
        confirm: status === 'confirmed',
        notes: notes || undefined,
      }))
      dispatch(notify({ message: t('Kirim saqlandi') }))
      navigate('/purchases/orders')
    } catch (e) {
      dispatch(notify({ message: operationError(e), severity: 'error' }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatedPage>
      <PageHeader
        title="Yuk keldi (Kirim)"
        breadcrumbs={[{ label: 'Xarid' }, { label: 'Yangi kirim' }]}
        actions={
          <Button startIcon={<ArrowBack />} variant="outlined" color="inherit" onClick={() => navigate(-1)}>
            {t('Orqaga')}
          </Button>
        }
      />

            {/* Header card */}
      <Card sx={{ p: 2.5, mb: 2, borderRadius: 3 }}>
        <Grid container spacing={2} sx={{ alignItems: "center" }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField select fullWidth size="small" label={`${t('Yetkazuvchi')} *`}
              value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              {suppliers.map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField select fullWidth size="small" label={`${t('Ombor')} *`}
              value={effectiveWarehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
              {warehouses.map((w) => (
                <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              fullWidth size="small" label={t('Sana')}
              value={date.format('DD.MM.YYYY HH:mm')}
              onClick={() => setDateModalOpen(true)}
              slotProps={{ input: { readOnly: true, sx: { cursor: 'pointer' } } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 2 }}>
            <TextField fullWidth size="small" label={t('Izoh')} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Grid>
        </Grid>
      </Card>

      {/* Products table */}
      <Card sx={{ borderRadius: 3, overflow: 'hidden', mb: 2 }}>
        <Box sx={{ px: 2, py: 1.5, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 700 }}>{t("Mahsulotlar ro'yxati")}</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Tooltip title={t('Ctrl+Space — mahsulot qidirish')}>
              <Button startIcon={<SearchIcon />} size="small" variant="outlined"
                onClick={() => { setActiveRowId(rows[rows.length - 1].rowId); setSearchOpen(true) }}>
                {t('Qidirish')} <kbd style={{ marginLeft: 6, padding: '1px 5px', borderRadius: 3, border: '1px solid currentColor', fontSize: '0.65rem' }}>Ctrl+Space</kbd>
              </Button>
            </Tooltip>
            <Button startIcon={<Add />} size="small" variant="contained" onClick={() => setRows((p) => [...p, emptyRow()])}>
              {t("Qator qo'shish")}
            </Button>
          </Box>
        </Box>
        <Box sx={{ overflowX: 'auto' }}><Table size="small" sx={{ minWidth: 760 }}>
          <TableHead>
            <TableRow>
              <TableCell width={40}>#</TableCell>
              <TableCell>{t('Mahsulot nomi')}</TableCell>
              <TableCell width={90}>{t("O'lchov")}</TableCell>
              <TableCell width={100}>{t('Soni')}</TableCell>
              <TableCell width={140}>{t('Kelish narxi')}</TableCell>
              <TableCell width={140}>{t('Sotuv narxi')}</TableCell>
              <TableCell width={140} align="right">{t('Jami')}</TableCell>
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
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.productName}</Typography>
                          <Typography variant="caption" color="text.secondary">{row.productCode}</Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>{t('Mahsulot tanlanmagan')}</Typography>
                      )}
                    </Box>
                    <Tooltip title={t('Mahsulot qidirish')}>
                      <IconButton size="small" color="primary" onClick={() => openSearchForRow(row.rowId)}>
                        <SearchIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={row.unit} size="small" variant="outlined" sx={{ borderRadius: 1 }} />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small" type="number" value={row.qty}
                    onChange={(e) => updateRow(row.rowId, 'qty', Math.max(1, +e.target.value))}
                    slotProps={{ input: { inputProps: { min: 1, style: { textAlign: 'center' } } } }}
                    sx={{ width: 80 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small" type="number" value={row.costPrice}
                    onChange={(e) => updateRow(row.rowId, 'costPrice', +e.target.value)}
                    sx={{ width: 120 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small" type="number" value={row.salePrice}
                    onChange={(e) => updateRow(row.rowId, 'salePrice', +e.target.value)}
                    sx={{ width: 120 }}
                  />
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

        {/* Total */}
        <Box sx={{ px: 2, py: 1.5, bgcolor: 'action.hover', display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">{t('Jami qatorlar')}</Typography>
            <Typography sx={{ fontWeight: 700 }}>{t('{{count}} ta mahsulot', { count: rows.filter((r) => r.productId).length })}</Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">{t('Jami summa')}</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800 }} color="primary.main">{formatCurrency(totalCost)}</Typography>
          </Box>
        </Box>
      </Card>

      {/* Action buttons */}
      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <Button variant="outlined" color="inherit" startIcon={<Save />} disabled={!isValid || saving}
          onClick={() => handleSave('draft')}>
          {t('Qoralama')}
        </Button>
        <Button variant="contained" startIcon={<CheckCircle />} disabled={!isValid || saving}
          onClick={() => handleSave('confirmed')}>
          {t('Tasdiqlash va Saqlash')}
        </Button>
      </Box>

      {/* Modals */}
      <DatePickerModal
        open={dateModalOpen} value={date}
        onClose={() => setDateModalOpen(false)}
        onConfirm={(d) => { setDate(d); setDateModalOpen(false) }}
        label={t('Kirim sanasini tanlang')}
      />
      <ProductSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={(p) => { if (activeRowId) applyProduct(p, activeRowId) }}
      />
    </AnimatedPage>
  )
}
