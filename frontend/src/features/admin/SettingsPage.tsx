import { useEffect, useState } from 'react'
import { Box, Button, Card, Grid, TextField, Typography } from '@mui/material'
import { Save } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import PageHeader from '@/shared/components/PageHeader/PageHeader'
import { useFetch } from '@/shared/hooks/useFetch'
import { useAction } from '@/shared/hooks/useAction'
import api from '@/lib/axios'

interface Settings {
  company: { name: string; inn: string; address: string; phone: string; bank: string; director: string }
  advancePct: number
  defaultMarkupPct: number
  deadlineDays: number
  defaultVatPct: number
}

export default function SettingsPage() {
  const { t } = useTranslation()
  const { data } = useFetch<Settings>('/settings')
  const { busy, run } = useAction()
  const [s, setS] = useState<Settings | null>(null)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (data) setS(data) }, [data])
  if (!s) return null
  const company = (k: keyof Settings['company'], label: string) => (
    <Grid size={{ xs: 12, sm: 6 }}>
      <TextField fullWidth size="small" label={t(label)} value={s.company[k]} onChange={(e) => setS({ ...s, company: { ...s.company, [k]: e.target.value } })} />
    </Grid>
  )
  const numF = (k: 'advancePct' | 'defaultMarkupPct' | 'deadlineDays' | 'defaultVatPct', label: string) => (
    <Grid size={{ xs: 6, sm: 3 }}>
      <TextField fullWidth size="small" type="number" label={t(label)} value={s[k]} onChange={(e) => setS({ ...s, [k]: Number(e.target.value) })} />
    </Grid>
  )
  return (
    <AnimatedPage>
      <PageHeader title="Sozlamalar" breadcrumbs={[{ label: 'Boshqaruv' }, { label: 'Sozlamalar' }]}
        actions={<Button variant="contained" startIcon={<Save />} disabled={busy} onClick={() => run(() => api.put('/settings', s), 'Saqlandi')}>{t('Saqlash')}</Button>} />
      <Card sx={{ p: 2, borderRadius: 3, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>{t('Kompaniya rekvizitlari (shartnoma va aktda chiqadi)')}</Typography>
        <Grid container spacing={2}>
          {company('name', 'Nomi')}{company('inn', 'INN')}{company('address', 'Manzil')}{company('phone', 'Telefon')}{company('bank', 'Bank rekvizitlari')}{company('director', 'Direktor')}
        </Grid>
      </Card>
      <Card sx={{ p: 2, borderRadius: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>{t('Zayavka sozlamalari')}</Typography>
        <Grid container spacing={2}>
          {numF('advancePct', 'Avans %')}{numF('defaultMarkupPct', 'Ustama %')}{numF('deadlineDays', 'Muddat (kun)')}{numF('defaultVatPct', 'QQS %')}
        </Grid>
        <Box sx={{ mt: 1 }}><Typography variant="caption" color="text.secondary">{t('Yangi zayavkalarga qo\'llanadi.')}</Typography></Box>
      </Card>
    </AnimatedPage>
  )
}
