import { Card, CardContent, CardHeader, Grid, Typography, useTheme } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import PageHeader from '@/shared/components/PageHeader/PageHeader'
import { useAppSelector } from '@/app/hooks'
import { formatCurrency, formatNumber } from '@/shared/utils/formatters'

const MONTHLY = [
  { name: 'Yan', savdo: 42, xarid: 28 }, { name: 'Fev', savdo: 58, xarid: 35 },
  { name: 'Mar', savdo: 51, xarid: 31 }, { name: 'Apr', savdo: 74, xarid: 44 },
  { name: 'May', savdo: 68, xarid: 39 }, { name: 'Iyn', savdo: 89, xarid: 52 },
  { name: 'Iyl', savdo: 95, xarid: 58 },
]
const PIE_COLORS = ['#2563EB', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6']

export default function SalesReportPage() {
  const theme = useTheme()
  const orders = useAppSelector((s) => s.saleOrders.items)
  const confirmed = orders.filter(o => o.status === 'completed')
  const totalRevenue = confirmed.reduce((s, o) => s + o.total, 0)
  const totalPaid = confirmed.reduce((s, o) => s + o.paid, 0)

  return (
    <AnimatedPage>
      <PageHeader title="Savdo hisoboti" breadcrumbs={[{ label: 'Hisobotlar' }, { label: 'Savdo' }]} />
      <Grid container spacing={2}>
        {[
          { label: "Jami savdo", value: formatCurrency(totalRevenue), color: 'primary.main' },
          { label: "To'langan", value: formatCurrency(totalPaid), color: 'success.main' },
          { label: 'Hujjatlar soni', value: formatNumber(confirmed.length), color: 'info.main' },
          { label: "O'rtacha chek", value: confirmed.length ? formatCurrency(totalRevenue / confirmed.length) : '0', color: 'warning.main' },
        ].map((stat) => (
          <Grid key={stat.label} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="caption" color="text.secondary" sx={{  textTransform: 'uppercase', fontSize: '0.7rem' , fontWeight: 600 }}>{stat.label}</Typography>
                <Typography variant="h5" color={stat.color} sx={{ fontWeight: 800, mt: 1 }}>{stat.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader title="Oylik savdo dinamikasi (mln UZS)" titleTypographyProps={{ fontWeight: 700, variant: 'subtitle1' }} />
            <CardContent sx={{ pt: 0 }}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={MONTHLY}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 12 }} />
                  <Legend />
                  <Bar dataKey="savdo" fill={theme.palette.primary.main} radius={[6, 6, 0, 0]} name="Savdo" />
                  <Bar dataKey="xarid" fill={theme.palette.success.main} radius={[6, 6, 0, 0]} name="Xarid" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardHeader title="Kategoriya bo'yicha" titleTypographyProps={{ fontWeight: 700, variant: 'subtitle1' }} />
            <CardContent sx={{ pt: 0 }}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={[{ name: 'Elektronika', value: 35 }, { name: 'Qurilish', value: 28 }, { name: 'Kimyo', value: 18 }, { name: 'Boshqa', value: 19 }]}
                    dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3}>
                    {PIE_COLORS.map((color, i) => <Cell key={i} fill={color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${v}%`} contentStyle={{ backgroundColor: theme.palette.background.paper, borderRadius: 12 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </AnimatedPage>
  )
}
