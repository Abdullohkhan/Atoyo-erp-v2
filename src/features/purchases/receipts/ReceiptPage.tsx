import {
  Box, Card, Typography, Button, TextField, MenuItem, Grid,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Chip, Alert, Tooltip,
} from '@mui/material'
import {
  Add, Delete, Save, ArrowBack, Search as SearchIcon, CheckCircle,
} from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import dayjs from 'dayjs'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import PageHeader from '@/shared/components/PageHeader/PageHeader'
import DatePickerModal from '@/shared/components/DatePickerModal/DatePickerModal'
import ProductSearchModal from '@/shared/components/ProductSearchModal/ProductSearchModal'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { createReceipt } from './store/receiptsSlice'
import { fetchSuppliers } from '@/features/catalogs/suppliers/store/suppliersSlice'
import { fetchWarehouses } from '@/features/catalogs/warehouses/store/warehousesSlice'
import { fetchProducts } from '@/features/catalogs/products/store/productsSlice'
import type { Product } from '@/shared/types/catalog.types'
import type { ReceiptItem } from './store/receiptsSlice'
import { formatCurrency, generateId } from '@/shared/utils/formatters'

interface RowItem extends ReceiptItem { rowId: string }

const emptyRow = (): RowItem => ({
  rowId: generateId(), productId: '', productName: '', productCode: '',
  unit: 'dona', qty: 1, costPrice: 0, salePrice: 0, total: 0,
})

export default function ReceiptPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.auth.user)
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
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    dispatch(fetchSuppliers())
    dispatch(fetchWarehouses())
    dispatch(fetchProducts())
    if (warehouses.length > 0) setWarehouseId(warehouses[0].id)
  }, [dispatch])

  useEffect(() => {
    if (warehouses.length > 0 && !warehouseId) setWarehouseId(warehouses[0].id)
  }, [warehouses])

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
        const updated = { ...r, [field]: value }
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
  const isValid = supplierId && warehouseId && rows.some((r) => r.productId && r.qty > 0)

  const handleSave = async (status: 'draft' | 'confirmed') => {
    if (!isValid) return
    const supplier = suppliers.find((s) => s.id === supplierId)
    const warehouse = warehouses.find((w) => w.id === warehouseId)
    const validRows = rows.filter((r) => r.productId && r.qty > 0)

    await dispatch(createReceipt({
      id: generateId(),
      number: `KIR-${String(Date.now()).slice(-6)}`,
      date: date.toISOString(),
      supplierId,
      supplierName: supplier?.name || '',
      warehouseId,
      warehouseName: warehouse?.name || '',
      items: validRows.map(({ rowId: _r, ...item }) => item),
      totalCost,
      status,
      notes,
      createdBy: user?.name || '',
      createdAt: new Date().toISOString(),
    } as any))
    setSaved(true)
    setTimeout(() => navigate('/purchases/orders'), 1200)
  }

  return (
    <AnimatedPage>
      <PageHeader
        title="Yuk keldi (Kirim)"
        breadcrumbs={[{ label: 'Xarid' }, { label: 'Yangi kirim' }]}
        actions={
          <Button startIcon={<ArrowBack />} variant="outlined" color="inherit" onClick={() => navigate(-1)}>
            Orqaga
          </Button>
        }
      />

      {saved && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>✅ Kirim saqlandi! Yo'naltirilmoqda...</Alert>}

      {/* Header card */}
      <Card sx={{ p: 2.5, mb: 2, borderRadius: 3 }}>
        <Grid container spacing={2} sx={{ alignItems: "center" }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField select fullWidth size="small" label="Yetkazuvchi *"
              value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              {suppliers.map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField select fullWidth size="small" label="Ombor *"
              value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
              {warehouses.map((w) => (
                <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              fullWidth size="small" label="Sana"
              value={date.format('DD.MM.YYYY HH:mm')}
              onClick={() => setDateModalOpen(true)}
              slotProps={{ input: { readOnly: true, sx: { cursor: 'pointer' } } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 2 }}>
            <TextField fullWidth size="small" label="Izoh" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Grid>
        </Grid>
      </Card>

      {/* Products table */}
      <Card sx={{ borderRadius: 3, overflow: 'hidden', mb: 2 }}>
        <Box sx={{ px: 2, py: 1.5, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 700 }}>Mahsulotlar ro'yxati</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title="Ctrl+Space — mahsulot qidirish">
              <Button startIcon={<SearchIcon />} size="small" variant="outlined"
                onClick={() => { setActiveRowId(rows[rows.length - 1].rowId); setSearchOpen(true) }}>
                Qidirish <kbd style={{ marginLeft: 6, padding: '1px 5px', borderRadius: 3, border: '1px solid currentColor', fontSize: '0.65rem' }}>Ctrl+Space</kbd>
              </Button>
            </Tooltip>
            <Button startIcon={<Add />} size="small" variant="contained" onClick={() => setRows((p) => [...p, emptyRow()])}>
              Qator qo'shish
            </Button>
          </Box>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={40}>#</TableCell>
              <TableCell>Mahsulot nomi</TableCell>
              <TableCell width={90}>O'lchov</TableCell>
              <TableCell width={100}>Soni</TableCell>
              <TableCell width={140}>Kelish narxi</TableCell>
              <TableCell width={140}>Sotuv narxi</TableCell>
              <TableCell width={140} align="right">Jami</TableCell>
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
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>Mahsulot tanlanmagan</Typography>
                      )}
                    </Box>
                    <Tooltip title="Mahsulot qidirish">
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
        </Table>

        {/* Total */}
        <Box sx={{ px: 2, py: 1.5, bgcolor: 'action.hover', display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">Jami qatorlar</Typography>
            <Typography sx={{ fontWeight: 700 }}>{rows.filter((r) => r.productId).length} ta mahsulot</Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">Jami summa</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800 }} color="primary.main">{formatCurrency(totalCost)}</Typography>
          </Box>
        </Box>
      </Card>

      {/* Action buttons */}
      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <Button variant="outlined" color="inherit" startIcon={<Save />} disabled={!isValid}
          onClick={() => handleSave('draft')}>
          Qoralama
        </Button>
        <Button variant="contained" startIcon={<CheckCircle />} disabled={!isValid}
          onClick={() => handleSave('confirmed')}>
          Tasdiqlash va Saqlash
        </Button>
      </Box>

      {/* Modals */}
      <DatePickerModal
        open={dateModalOpen} value={date}
        onClose={() => setDateModalOpen(false)}
        onConfirm={(d) => { setDate(d); setDateModalOpen(false) }}
        label="Kirim sanasini tanlang"
      />
      <ProductSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={(p) => { if (activeRowId) applyProduct(p, activeRowId) }}
      />
    </AnimatedPage>
  )
}
