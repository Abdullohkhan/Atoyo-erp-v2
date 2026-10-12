import { Grid, Box, Card, CardContent, CardHeader, Typography, LinearProgress } from '@mui/material'
import { ShoppingCart, People, Inventory2, AccountBalance, CheckCircleOutlined } from '@mui/icons-material'
import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { gsap } from 'gsap'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import KpiCard from './components/KpiCard'
import SalesChart from './components/SalesChart'
import RecentDocs from './components/RecentDocs'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { can } from '@/app/permissions'
import { LOW_STOCK_LIMIT } from '@/shared/constants'
import { formatCurrency, formatNumber } from '@/shared/utils/formatters'
import { cashBalance, isBooked, monthlySeries, trend } from '@/shared/services/stats'
import { fetchSaleOrders } from '@/features/sales/orders/store/saleOrdersSlice'
import { fetchPurchaseOrders } from '@/features/purchases/orders/store/purchaseOrdersSlice'
import { fetchCustomers } from '@/features/catalogs/customers/store/customersSlice'
import { fetchBalance } from '@/features/warehouse/balance/store/balanceSlice'
import { fetchPayments } from '@/features/finance/payments/store/paymentsSlice'

export default function DashboardPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const alertRef = useRef<HTMLDivElement>(null)
  const role = useAppSelector((s) => s.auth.user?.role)
  const sales = useAppSelector((s) => s.saleOrders.items)
  const purchases = useAppSelector((s) => s.purchaseOrders.items)
  const customers = useAppSelector((s) => s.customers.items)
  const balance = useAppSelector((s) => s.balance.items)
  const payments = useAppSelector((s) => s.payments.items)
  const showFinance = can(role, 'finance.view')

  useEffect(() => {
    dispatch(fetchSaleOrders()); dispatch(fetchPurchaseOrders()); dispatch(fetchCustomers()); dispatch(fetchBalance())
    if (showFinance) dispatch(fetchPayments())
  }, [dispatch, showFinance])

  const series = useMemo(() => monthlySeries(sales, purchases), [sales, purchases])
  const totalSales = sales.filter((o) => isBooked(o.status)).reduce((s, o) => s + o.total, 0)
  const stockValue = balance.reduce((s, b) => s + b.totalValue, 0)
  const stockQty = balance.reduce((s, b) => s + b.qty, 0)
  const drafts = sales.filter((o) => o.status === 'draft').length
  const lowStock = useMemo(
    () => balance.filter((b) => b.availableQty <= LOW_STOCK_LIMIT).sort((a, b) => a.availableQty - b.availableQty).slice(0, 5),
    [balance],
  )

  useEffect(() => {
    if (alertRef.current && lowStock.length) {
      gsap.fromTo(alertRef.current.querySelectorAll('.stock-item'), { opacity: 0, x: -16 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.1, delay: 0.2, ease: 'power2.out' })
    }
  }, [lowStock.length])

  const kpis = [
    { title: t('Jami savdo'), value: formatCurrency(totalSales), change: trend(series.map((p) => p.savdo)), icon: <ShoppingCart />, color: '#2563EB' },
    { title: t('Faol mijozlar'), value: formatNumber(customers.filter((c) => c.isActive).length), icon: <People />, color: '#22C55E' },
    { title: t('Ombordagi tovar'), value: `${formatNumber(stockQty)} · ${formatCurrency(stockValue)}`, icon: <Inventory2 />, color: '#F59E0B' },
    showFinance
      ? { title: t('Kassa balansi'), value: formatCurrency(cashBalance(payments)), icon: <AccountBalance />, color: '#8B5CF6' }
      : { title: t('Qoralama buyurtmalar'), value: formatNumber(drafts), icon: <AccountBalance />, color: '#8B5CF6' },
  ]

  const links = [
    { label: 'Yangi savdo hujjati', color: 'primary.main', path: '/sales/orders/new', allowed: can(role, 'sales.create') },
    { label: 'Xarid buyurtmasi', color: 'success.main', path: '/purchases/receipts/new', allowed: can(role, 'purchases.create') },
    { label: "To'lov kiritish", color: 'info.main', path: '/finance/payments', allowed: can(role, 'payments.write') },
    { label: 'Ombor qoldiqlari', color: 'warning.main', path: '/warehouse/balance', allowed: true },
  ].filter((l) => l.allowed)

  return (
    <AnimatedPage>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpis.map((kpi, i) => (
          <Grid key={kpi.title} size={{ xs: 12, sm: 6, lg: 3 }}>
            <KpiCard {...kpi} index={i} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <SalesChart data={series} />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardHeader title={t('Kam qolgan tovarlar')} slotProps={{ title: { sx: { fontWeight: 700 }, variant: 'subtitle1' } }} />
            <CardContent sx={{ pt: 0 }} ref={alertRef}>
              {lowStock.length === 0 && (
                <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                  <CheckCircleOutlined color="success" sx={{ fontSize: 40 }} />
                  <Typography variant="body2">{t('Hamma tovar yetarli')}</Typography>
                </Box>
              )}
              {lowStock.map((item) => {
                const pct = Math.min(100, Math.round((item.availableQty / LOW_STOCK_LIMIT) * 100))
                return (
                  <Box key={item.id} className="stock-item" sx={{ mb: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, gap: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>{item.productName}</Typography>
                      <Typography variant="caption" color="error.main" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {formatNumber(item.availableQty)} {item.unit}
                      </Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={pct} color={pct < 30 ? 'error' : 'warning'}
                      sx={{ borderRadius: 4, height: 6, bgcolor: 'action.hover' }} />
                    <Typography variant="caption" color="text.secondary">{item.warehouseName}</Typography>
                  </Box>
                )
              })}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <RecentDocs sales={sales} purchases={purchases} />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardHeader title={t('Tezkor havolalar')} slotProps={{ title: { sx: { fontWeight: 700 }, variant: 'subtitle1' } }} />
            <CardContent>
              {links.map((link) => (
                <Box key={link.path} onClick={() => navigate(link.path)} role="link" tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') navigate(link.path) }}
                  sx={{
                    p: 1.5, mb: 1, borderRadius: 2, border: '1px solid', borderColor: 'divider',
                    cursor: 'pointer', transition: 'all 0.15s',
                    '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                  }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} color={link.color}>{t(link.label)}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </AnimatedPage>
  )
}
