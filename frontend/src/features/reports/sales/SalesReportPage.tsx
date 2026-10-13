import { Card, CardContent, CardHeader, Grid, Typography, useTheme, Box, TextField, Button } from '@mui/material'
import { FileDownload } from '@mui/icons-material'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import PageHeader from '@/shared/components/PageHeader/PageHeader'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { formatCurrency, formatNumber } from '@/shared/utils/formatters'
import { isBooked, monthlySeries, salesByCategory } from '@/shared/services/stats'
import { CAT_LABELS } from '@/shared/constants'
import { exportToExcel } from '@/shared/utils/excel'
import { dayjsLocale } from '@/i18n'
import { fetchSaleOrders } from '@/features/sales/orders/store/saleOrdersSlice'
import { fetchPurchaseOrders } from '@/features/purchases/orders/store/purchaseOrdersSlice'
import { fetchProducts } from '@/features/catalogs/products/store/productsSlice'

const PIE_COLORS = ['#2563EB', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#0EA5E9']

export default function SalesReportPage() {
  const theme = useTheme()
  const dispatch = useAppDispatch()
  const { t, i18n } = useTranslation()
  const allSales = useAppSelector((s) => s.saleOrders.items)
  const allPurchases = useAppSelector((s) => s.purchaseOrders.items)
  const products = useAppSelector((s) => s.products.items)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  useEffect(() => { dispatch(fetchSaleOrders()); dispatch(fetchPurchaseOrders()); dispatch(fetchProducts()) }, [dispatch])

  const inRange = (date: string) => (!from || date.slice(0, 10) >= from) && (!to || date.slice(0, 10) <= to)
  const sales = useMemo(() => allSales.filter((o) => inRange(o.date)), [allSales, from, to]) // eslint-disable-line react-hooks/exhaustive-deps
  const purchases = useMemo(() => allPurchases.filter((o) => inRange(o.date)), [allPurchases, from, to]) // eslint-disable-line react-hooks/exhaustive-deps

  const booked = sales.filter((o) => isBooked(o.status))
  const totalRevenue = booked.reduce((s, o) => s + o.total, 0)
  const totalPaid = booked.reduce((s, o) => s + o.paid, 0)
  const monthly = useMemo(() => monthlySeries(sales, purchases, 12).filter((p) => p.savdo || p.xarid)
    .map((p) => ({ ...p, name: dayjs(`${p.key}-01`).locale(dayjsLocale(i18n.language)).format('MMM YY'), savdo: Math.round(p.savdo / 1e6 * 10) / 10, xarid: Math.round(p.xarid / 1e6 * 10) / 10 })), [sales, purchases, i18n.language])
  const byCategory = useMemo(() => salesByCategory(sales, products).map((c) => ({ name: t(CAT_LABELS[c.category as keyof typeof CAT_LABELS] ?? c.category), value: c.value })), [sales, products, t])
  const totalCat = byCategory.reduce((s, c) => s + c.value, 0)

  const tooltipStyle = { backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 12 }

  const handleExport = () => {
    void exportToExcel('savdo_hisoboti', [
      { header: t('Raqam'), key: 'number' }, { header: t('Sana'), key: 'date' }, { header: t('Mijoz'), key: 'customer' },
      { header: t('Summa'), key: 'total' }, { header: t("To'langan"), key: 'paid' }, { header: t('Qoldiq'), key: 'balance' },
    ], booked.map((o) => ({ number: o.number, date: dayjs(o.date).format('DD.MM.YYYY'), customer: o.customerName, total: o.total, paid: o.paid, balance: o.balance })))
  }

  return (
    <AnimatedPage>
      <PageHeader title="Savdo hisoboti" breadcrumbs={[{ label: 'Hisobotlar' }, { label: 'Savdo' }]}
        actions={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField size="small" type="date" label={t('Dan')} value={from} onChange={(e) => setFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField size="small" type="date" label={t('Ga')} value={to} onChange={(e) => setTo(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            <Button variant="outlined" startIcon={<FileDownload />} onClick={handleExport} disabled={booked.length === 0}>Excel</Button>
          </Box>
        } />
      <Grid container spacing={2}>
        {[
          { label: 'Jami savdo', value: formatCurrency(totalRevenue), color: 'primary.main' },
          { label: "To'langan", value: formatCurrency(totalPaid), color: 'success.main' },
          { label: 'Hujjatlar soni', value: formatNumber(booked.length), color: 'info.main' },
          { label: "O'rtacha chek", value: formatCurrency(booked.length ? totalRevenue / booked.length : 0), color: 'warning.main' },
        ].map((stat) => (
          <Grid key={stat.label} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 600 }}>{t(stat.label)}</Typography>
                <Typography variant="h5" color={stat.color} sx={{ fontWeight: 800, mt: 1, wordBreak: 'break-word' }}>{stat.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader title={t('Oylik savdo dinamikasi (mln UZS)')} slotProps={{ title: { sx: { fontWeight: 700 }, variant: 'subtitle1' } }} />
            <CardContent sx={{ pt: 0 }}>
              {monthly.length === 0 ? <Typography color="text.secondary" sx={{ py: 10, textAlign: 'center' }}>{t("Ma'lumot topilmadi")}</Typography> : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    <Bar dataKey="savdo" fill={theme.palette.primary.main} radius={[6, 6, 0, 0]} name={t('Savdo')} />
                    <Bar dataKey="xarid" fill={theme.palette.success.main} radius={[6, 6, 0, 0]} name={t('Xarid')} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardHeader title={t("Kategoriya bo'yicha")} slotProps={{ title: { sx: { fontWeight: 700 }, variant: 'subtitle1' } }} />
            <CardContent sx={{ pt: 0 }}>
              {byCategory.length === 0 ? <Typography color="text.secondary" sx={{ py: 10, textAlign: 'center' }}>{t("Ma'lumot topilmadi")}</Typography> : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3}>
                      {byCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `${formatCurrency(Number(v))} (${totalCat ? Math.round((Number(v) / totalCat) * 100) : 0}%)`} contentStyle={tooltipStyle} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </AnimatedPage>
  )
}
