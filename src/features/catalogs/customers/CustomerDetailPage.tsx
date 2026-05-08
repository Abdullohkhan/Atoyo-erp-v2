import {
  Box, Card, Typography, Button, Grid, Tab, Tabs, Chip,
  Table, TableHead, TableRow, TableCell, TableBody, Avatar, Divider,
} from '@mui/material'
import { ArrowBack, FileDownload, Phone, LocationOn } from '@mui/icons-material'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import * as XLSX from 'xlsx'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import StatusChip from '@/shared/components/StatusChip/StatusChip'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchCustomers } from './store/customersSlice'
import { fetchSaleOrders } from '@/features/sales/orders/store/saleOrdersSlice'
import { fetchPayments } from '@/features/finance/payments/store/paymentsSlice'
import { formatCurrency, formatDateTime, getInitials } from '@/shared/utils/formatters'

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [tab, setTab] = useState(0)

  const customer = useAppSelector((s) => s.customers.items.find((c) => c.id === id))
  const allOrders = useAppSelector((s) => s.saleOrders.items)
  const allPayments = useAppSelector((s) => s.payments.items)

  const orders = allOrders.filter((o) => o.customerId === id)
  const payments = allPayments.filter((p) => p.counterpartyId === id)

  const totalBought = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)
  const totalPaid = payments.filter(p => p.direction === 'income').reduce((s, p) => s + p.amount, 0)

  useEffect(() => {
    dispatch(fetchCustomers())
    dispatch(fetchSaleOrders())
    dispatch(fetchPayments())
  }, [dispatch])

  const exportExcel = () => {
    const wb = XLSX.utils.book_new()

    // Orders sheet
    const ordersData = orders.map((o) => ({
      'Raqam': o.number,
      'Sana': formatDateTime(o.date),
      'Ombor': o.warehouseName,
      'Jami summa': o.total,
      "To'langan": o.paid,
      'Qoldiq': o.balance,
      'Holat': o.status,
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ordersData), 'Buyurtmalar')

    // Payments sheet
    const paymentsData = payments.map((p) => ({
      'Raqam': p.number,
      'Sana': formatDateTime(p.date),
      "Yo'nalish": p.direction === 'income' ? 'Kirim' : 'Chiqim',
      'Turi': p.type,
      'Summa': p.amount,
      'Kategoriya': p.category,
      'Izoh': p.description,
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(paymentsData), "To'lovlar")

    XLSX.writeFile(wb, `mijoz_${customer?.name || id}_hisobot.xlsx`)
  }

  if (!customer) {
    return (
      <AnimatedPage>
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">Mijoz topilmadi</Typography>
          <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>Orqaga</Button>
        </Box>
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        <Button startIcon={<ArrowBack />} variant="outlined" color="inherit" size="small" onClick={() => navigate(-1)}>
          Mijozlar
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button startIcon={<FileDownload />} variant="outlined" color="success" onClick={exportExcel}>
          Excel yuklab olish
        </Button>
      </Box>

      {/* Customer info card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Card sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.4rem', fontWeight: 800, borderRadius: 2.5 }}>
              {getInitials(customer.name)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>{customer.name}</Typography>
                <Chip label={customer.code} variant="outlined" size="small" sx={{ fontFamily: 'monospace', borderRadius: 1 }} />
                <Chip label={customer.isActive ? 'Faol' : 'Nofaol'} color={customer.isActive ? 'success' : 'default'} size="small" sx={{ borderRadius: 1 }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mt: 0.5, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Phone fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">{customer.phone}</Typography>
                </Box>
                {customer.address && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">{customer.address}</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            {[
              { label: 'Joriy qarz', value: formatCurrency(customer.debt), color: customer.debt > 0 ? 'error.main' : 'success.main' },
              { label: 'Jami xaridlar', value: formatCurrency(totalBought), color: 'primary.main' },
              { label: "Jami to'lovlar", value: formatCurrency(totalPaid), color: 'success.main' },
              { label: "Buyurtmalar soni", value: `${orders.length} ta`, color: 'text.primary' },
            ].map((stat) => (
              <Grid key={stat.label} size={{ xs: 6, sm: 3 }}>
                <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary"  sx={{ display: "block" }}>{stat.label}</Typography>
                  <Typography sx={{ fontWeight: 800, color: stat.color }}>{stat.value}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Card>
      </motion.div>

      {/* Tabs */}
      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}>
          <Tab label={`Buyurtmalar (${orders.length})`} />
          <Tab label={`To'lovlar (${payments.length})`} />
        </Tabs>

        {tab === 0 && (
          <Box>
            {orders.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                <Typography>Buyurtmalar yo'q</Typography>
              </Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Raqam</TableCell>
                    <TableCell>Sana</TableCell>
                    <TableCell>Ombor</TableCell>
                    <TableCell align="right">Summa</TableCell>
                    <TableCell align="right">To'langan</TableCell>
                    <TableCell align="right">Qoldiq</TableCell>
                    <TableCell>Holat</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id} hover>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.8rem' }}>{o.number}</TableCell>
                      <TableCell>{formatDateTime(o.date)}</TableCell>
                      <TableCell>{o.warehouseName}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(o.total)}</TableCell>
                      <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>{formatCurrency(o.paid)}</TableCell>
                      <TableCell align="right" sx={{ color: o.balance > 0 ? 'error.main' : 'success.main', fontWeight: 700 }}>
                        {formatCurrency(o.balance)}
                      </TableCell>
                      <TableCell><StatusChip status={o.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        )}

        {tab === 1 && (
          <Box>
            {payments.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                <Typography>To'lovlar yo'q</Typography>
              </Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Raqam</TableCell>
                    <TableCell>Sana</TableCell>
                    <TableCell>Yo'nalish</TableCell>
                    <TableCell>Turi</TableCell>
                    <TableCell align="right">Summa</TableCell>
                    <TableCell>Kategoriya</TableCell>
                    <TableCell>Izoh</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.number}</TableCell>
                      <TableCell>{formatDateTime(p.date)}</TableCell>
                      <TableCell>
                        <Chip label={p.direction === 'income' ? 'Kirim' : 'Chiqim'}
                          color={p.direction === 'income' ? 'success' : 'error'} size="small"
                          sx={{ fontWeight: 700, borderRadius: 1 }} />
                      </TableCell>
                      <TableCell>{{ cash: 'Naqd', card: 'Karta', transfer: "O'tkazma" }[p.type] || p.type}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: p.direction === 'income' ? 'success.main' : 'error.main' }}>
                        {formatCurrency(p.amount)}
                      </TableCell>
                      <TableCell>{p.category}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{p.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        )}
      </Card>
    </AnimatedPage>
  )
}
