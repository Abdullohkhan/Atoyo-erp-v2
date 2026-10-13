import { Card, CardContent, CardHeader, Typography, useTheme } from '@mui/material'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { dayjsLocale } from '@/i18n'
import { formatNumber } from '@/shared/utils/formatters'
import type { MonthPoint } from '@/shared/services/stats'

export default function SalesChart({ data }: { data: MonthPoint[] }) {
  const theme = useTheme()
  const { t, i18n } = useTranslation()
  const rows = data.map((p) => ({ ...p, label: dayjs(`${p.key}-01`).locale(dayjsLocale(i18n.language)).format('MMM') }))
  return (
    <Card sx={{ borderRadius: 3, height: '100%' }}>
      <CardHeader title={t('Savdo va Xarid dinamikasi')} slotProps={{ title: { sx: { fontWeight: 700 }, variant: 'subtitle1' } }} />
      <CardContent sx={{ pt: 0 }}>
        {rows.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 10, textAlign: 'center' }}>{t("Ma'lumot topilmadi")}</Typography>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={rows} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
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
              <XAxis dataKey="label" tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => formatNumber(v / 1000000) + 'M'} tick={{ fill: theme.palette.text.secondary, fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
              <Tooltip
                formatter={(value, name) => [formatNumber(Number(value)) + ' UZS', name === 'savdo' ? t('Savdo') : t('Xarid')]}
                contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 12 }}
                labelStyle={{ fontWeight: 700 }}
              />
              <Legend formatter={(v) => (v === 'savdo' ? t('Savdo') : t('Xarid'))} />
              <Area type="monotone" dataKey="savdo" stroke={theme.palette.primary.main} strokeWidth={2.5} fill="url(#savdoGrad)" dot={false} activeDot={{ r: 5 }} />
              <Area type="monotone" dataKey="xarid" stroke={theme.palette.success.main} strokeWidth={2.5} fill="url(#xaridGrad)" dot={false} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
