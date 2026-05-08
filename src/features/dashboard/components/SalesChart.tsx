import { Card, CardContent, CardHeader, useTheme } from '@mui/material'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatNumber } from '@/shared/utils/formatters'

const data = [
  { month: 'Yan', savdo: 42000000, xarid: 28000000 },
  { month: 'Fev', savdo: 58000000, xarid: 35000000 },
  { month: 'Mar', savdo: 51000000, xarid: 31000000 },
  { month: 'Apr', savdo: 74000000, xarid: 44000000 },
  { month: 'May', savdo: 68000000, xarid: 39000000 },
  { month: 'Iyn', savdo: 89000000, xarid: 52000000 },
  { month: 'Iyl', savdo: 95000000, xarid: 58000000 },
]

export default function SalesChart() {
  const theme = useTheme()
  return (
    <Card sx={{ borderRadius: 3, height: '100%' }}>
      <CardHeader title="Savdo va Xarid dinamikasi" titleTypographyProps={{ fontWeight: 700, variant: 'subtitle1' }} />
      <CardContent sx={{ pt: 0 }}>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="savdoGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
                <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="xaridGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.3} />
                <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
            <XAxis dataKey="month" tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => formatNumber(v / 1000000) + 'M'} tick={{ fill: theme.palette.text.secondary, fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
            <Tooltip
              formatter={(value) => [formatNumber(Number(value)) + ' UZS', '']}
              contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 12 }}
              labelStyle={{ fontWeight: 700 }}
            />
            <Legend formatter={(v) => v === 'savdo' ? 'Savdo' : 'Xarid'} />
            <Area type="monotone" dataKey="savdo" stroke={theme.palette.primary.main} strokeWidth={2.5} fill="url(#savdoGrad)" dot={false} activeDot={{ r: 5 }} />
            <Area type="monotone" dataKey="xarid" stroke={theme.palette.success.main} strokeWidth={2.5} fill="url(#xaridGrad)" dot={false} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
