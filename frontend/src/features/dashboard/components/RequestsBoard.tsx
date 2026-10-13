import { Box, Card, CardContent, CardHeader, Chip, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useFetch } from '@/shared/hooks/useFetch'
import { useAppSelector } from '@/app/hooks'
import { PIPELINE, STATUS_INFO, type RequestRow } from '@/features/requests/types'

/** "Jarayondagi ishlar": how many requests sit at each stage, and which ones wait for me. */
export default function RequestsBoard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const me = useAppSelector((s) => s.auth.user)
  const { data } = useFetch<RequestRow[]>('/requests')
  const rows = data ?? []
  const counts = new Map<string, number>()
  rows.forEach((r) => counts.set(r.status, (counts.get(r.status) ?? 0) + 1))
  const waiting = rows.filter((r) => {
    const perm = STATUS_INFO[r.status].perm
    return !!perm && me?.roleKey !== 'owner' && !!me?.permissions.includes(perm as never)
  })

  return (
    <Card sx={{ borderRadius: 3, height: '100%' }}>
      <CardHeader title={t('Jarayondagi ishlar')} slotProps={{ title: { sx: { fontWeight: 700 }, variant: 'subtitle1' } }}
        action={<Chip size="small" color={waiting.length ? 'error' : 'default'} label={t('Meni kutyapti: {{count}}', { count: waiting.length })} onClick={() => navigate('/requests')} />} />
      <CardContent sx={{ pt: 0 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)', lg: 'repeat(7, 1fr)' }, gap: 1 }}>
          {PIPELINE.filter((s) => s !== 'COMPLETED').map((s) => (
            <Box key={s} onClick={() => navigate('/requests')} sx={{
              p: 1.25, borderRadius: 2, border: '1px solid', borderColor: counts.get(s) ? `${STATUS_INFO[s].color}.main` : 'divider',
              cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' },
            }}>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>{counts.get(s) ?? 0}</Typography>
              <Typography variant="caption" color="text.secondary">{t(STATUS_INFO[s].short)}</Typography>
            </Box>
          ))}
        </Box>
        {waiting.slice(0, 5).map((r) => (
          <Box key={r.id} onClick={() => navigate(`/requests/${r.id}`)} sx={{ mt: 1, p: 1, borderRadius: 2, bgcolor: 'action.hover', cursor: 'pointer', display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{r.number}</Typography>
            <Typography variant="body2" noWrap sx={{ flex: 1 }}>{r.title} · {r.customerName}</Typography>
            <Chip size="small" color={STATUS_INFO[r.status].color} label={t(STATUS_INFO[r.status].short)} />
          </Box>
        ))}
      </CardContent>
    </Card>
  )
}
