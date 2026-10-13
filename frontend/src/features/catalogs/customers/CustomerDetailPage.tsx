import {
  Box, Card, Typography, Button, Grid, Tab, Tabs, Chip,
  Table, TableHead, TableRow, TableCell, TableBody, Avatar, Divider,
} from '@mui/material'
import { ArrowBack, FileDownload, Phone, LocationOn } from '@mui/icons-material'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { exportSheetsToExcel } from '@/shared/utils/excel'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import StatusChip from '@/shared/components/StatusChip/StatusChip'
import { useAppDispatch, useAppSelector, useCan } from '@/app/hooks'
import { fetchCustomers } from './store/customersSlice'
import { fetchSaleOrders } from '@/features/sales/orders/store/saleOrdersSlice'
import { fetchPayments } from '@/features/finance/payments/store/paymentsSlice'
import { STATUS_LABELS, PAYMENT_TYPES } from '@/shared/constants'
import { formatCurrency, formatDateTime, getInitials } from '@/shared/utils/formatters'

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const [tab, setTab] = useState(0)
  const canSales = useCan('sales.view')
  const canPayments = useCan('payments.view')

  const customer = useAppSelector((s) => s.customers.items.find((c) => c.id === id))
  const allOrders = useAppSelector((s) => s.saleOrders.items)
  const allPayments = useAppSelector((s) => s.payments.items)

  const orders = allOrders.filter((o) => o.customerId === id)
  const payments = allPayments.filter((p) => p.counterpartyId === id)

  const totalBought = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)
  const totalPaid = payments.filter(p => p.direction === 'income').reduce((s, p) => s + p.amount, 0)

  useEffect(() => {
    dispatch(fetchCustomers())
    if (canSales) dispatch(fetchSaleOrders())
    if (canPayments) dispatch(fetchPayments())
  }, [dispatch, canSales, canPayments])

  const exportExcel = () => {
    const col = (header: string, key: string) => ({ header: t(header), key })
    void exportSheetsToExcel(`mijoz_${customer?.name || id}_hisobot`, [
      {
        name: t('Buyurtmalar'),
        columns: [col('Raqam', 'number'), col('Sana', 'date'), col('Ombor', 'warehouse'), col('Jami summa', 'total'), col("To'langan", 'paid'), col('Qoldiq', 'balance'), col('Holat', 'status')],
        rows: orders.map((o) => ({ number: o.number, date: formatDateTime(o.date), warehouse: o.warehouseName, total: o.total, paid: o.paid, balance: o.balance, status: t(STATUS_LABELS[o.status] ?? o.status) })),
      },
      {
        name: t("To'lovlar"),
        columns: [col('Raqam', 'number'), col('Sana', 'date'), col("Yo'nalish", 'direction'), col('Turi', 'type'), col('Summa', 'amount'), col('Kategoriya', 'category'), col('Izoh', 'description')],
        rows: payments.map((p) => ({ number: p.number, date: formatDateTime(p.date), direction: p.direction === 'income' ? t('Kirim') : t('Chiqim'), type: t(PAYMENT_TYPES[p.type] ?? p.type), amount: p.amount, category: p.category, description: p.description })),
      },
    ])
  }

  if (!customer) {
    return (
      <AnimatedPage>
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">{t('Mijoz topilmadi')}</Typography>
          <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>{t('Orqaga')}</Button>
        </Box>
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        <Button startIcon={<ArrowBack />} variant="outlined" color="inherit" size="small" onClick={() => navigate(-1)}>
          {t('Mijozlar')}
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button startIcon={<FileDownload />} variant="outlined" color="success" onClick={exportExcel}>
          {t('Excel yuklab olish')}
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
                <Chip label={customer.isActive ? t('Faol') : t('Nofaol')} color={customer.isActive ? 'success' : 'default'} size="small" sx={{ borderRadius: 1 }} />
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
              { label: t('Joriy qarz'), value: formatCurrency(customer.debt), color: customer.debt > 0 ? 'error.main' : 'success.main' },
              { label: t('Jami xaridlar'), value: formatCurrency(totalBought), color: 'primary.main' },
              { label: t("Jami to'lovlar"), value: formatCurrency(totalPaid), color: 'success.main' },
              { label: t('Buyurtmalar soni'), value: t('{{count}} ta', { count: orders.length }), color: 'text.primary' },
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
          <Tab label={`${t('Buyurtmalar')} (${orders.length})`} />
          <Tab label={`${t("To'lovlar")} (${payments.length})`} />
        </Tabs>

        {tab === 0 && (
          <Box>
            {orders.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                <Typography>{t("Buyurtmalar yo'q")}</Typography>
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto' }}><Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('Raqam')}</TableCell>
                    <TableCell>{t('Sana')}</TableCell>
                    <TableCell>{t('Ombor')}</TableCell>
                    <TableCell align="right">{t('Summa')}</TableCell>
                    <TableCell align="right">{t("To'langan")}</TableCell>
                    <TableCell align="right">{t('Qoldiq')}</TableCell>
                    <TableCell>{t('Holat')}</TableCell>
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
              </Table></Box>
            )}
          </Box>
        )}

        {tab === 1 && (
          <Box>
            {payments.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                <Typography>{t("To'lovlar yo'q")}</Typography>
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto' }}><Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('Raqam')}</TableCell>
                    <TableCell>{t('Sana')}</TableCell>
                    <TableCell>{t("Yo'nalish")}</TableCell>
                    <TableCell>{t('Turi')}</TableCell>
                    <TableCell align="right">{t('Summa')}</TableCell>
                    <TableCell>{t('Kategoriya')}</TableCell>
                    <TableCell>{t('Izoh')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.number}</TableCell>
                      <TableCell>{formatDateTime(p.date)}</TableCell>
                      <TableCell>
                        <Chip label={p.direction === 'income' ? t('Kirim') : t('Chiqim')}
                          color={p.direction === 'income' ? 'success' : 'error'} size="small"
                          sx={{ fontWeight: 700, borderRadius: 1 }} />
                      </TableCell>
                      <TableCell>{t(PAYMENT_TYPES[p.type] ?? p.type)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: p.direction === 'income' ? 'success.main' : 'error.main' }}>
                        {formatCurrency(p.amount)}
                      </TableCell>
                      <TableCell>{p.category}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{p.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></Box>
            )}
          </Box>
        )}
      </Card>
    </AnimatedPage>
  )
}
