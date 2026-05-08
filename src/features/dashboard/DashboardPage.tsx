import { Grid, Box, Card, CardContent, CardHeader, Typography, LinearProgress } from '@mui/material'
import { ShoppingCart, People, Inventory2, AccountBalance } from '@mui/icons-material'
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import KpiCard from './components/KpiCard'
import SalesChart from './components/SalesChart'
import RecentDocs from './components/RecentDocs'
import { formatCurrency } from '@/shared/utils/formatters'

const KPI_DATA = [
  { title: "Bugungi savdo",    value: formatCurrency(8_750_000),  change: 12,  icon: <ShoppingCart />,   color: '#2563EB' },
  { title: 'Faol mijozlar',    value: '142',                       change: 4,   icon: <People />,         color: '#22C55E' },
  { title: 'Ombordagi tovar',  value: '1,248 dona',                change: -3,  icon: <Inventory2 />,     color: '#F59E0B' },
  { title: 'Kassa balansi',    value: formatCurrency(24_300_000), change: 8,   icon: <AccountBalance />, color: '#8B5CF6' },
]

const LOW_STOCK = [
  { name: 'Santexnika quvuri 32mm', current: 12, min: 50,  unit: 'dona' },
  { name: 'Kran 1/2"',              current: 5,  min: 30,  unit: 'dona' },
  { name: 'Suv o\'lchagich',        current: 8,  min: 25,  unit: 'dona' },
]

export default function DashboardPage() {
  const alertRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (alertRef.current) {
      gsap.fromTo(
        alertRef.current.querySelectorAll('.stock-item'),
        { opacity: 0, x: -16 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.1, delay: 0.3, ease: 'power2.out' },
      )
    }
  }, [])

  return (
    <AnimatedPage>
      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {KPI_DATA.map((kpi, i) => (
          <Grid key={kpi.title} size={{ xs: 12, sm: 6, lg: 3 }}>
            <KpiCard {...kpi} index={i} />
          </Grid>
        ))}
      </Grid>

      {/* Charts row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <SalesChart />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardHeader title="Kam qolgan tovarlar" titleTypographyProps={{ fontWeight: 700, variant: 'subtitle1' }} />
            <CardContent sx={{ pt: 0 }} ref={alertRef}>
              {LOW_STOCK.map((item) => {
                const pct = Math.round((item.current / item.min) * 100)
                return (
                  <Box key={item.name} className="stock-item" sx={{ mb: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>{item.name}</Typography>
                      <Typography variant="caption" color="error.main" sx={{ fontWeight: 700 }}>
                        {item.current} {item.unit}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate" value={pct}
                      color={pct < 30 ? 'error' : 'warning'}
                      sx={{ borderRadius: 4, height: 6, bgcolor: 'action.hover' }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Min: {item.min} {item.unit}
                    </Typography>
                  </Box>
                )
              })}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent docs */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <RecentDocs />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardHeader title="Tezkor havolalar" titleTypographyProps={{ fontWeight: 700, variant: 'subtitle1' }} />
            <CardContent>
              {[
                { label: "Yangi savdo hujjati", color: 'primary.main' },
                { label: "Xarid buyurtmasi", color: 'success.main' },
                { label: "To'lov kiritish", color: 'info.main' },
                { label: "Ombor inventarizatsiyasi", color: 'warning.main' },
              ].map((link) => (
                <Box key={link.label} sx={{
                  p: 1.5, mb: 1, borderRadius: 2, border: '1px solid', borderColor: 'divider',
                  cursor: 'pointer', transition: 'all 0.15s',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} color={link.color}>{link.label}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </AnimatedPage>
  )
}
