import { Box, Button, Typography } from '@mui/material'
import { ErrorOutlined } from '@mui/icons-material'
import { useRouteError, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

/** Shown instead of a blank screen when a page throws while rendering. */
export default function RouteError() {
  const error = useRouteError()
  const navigate = useNavigate()
  const { t } = useTranslation()
  if (import.meta.env.DEV) console.error(error)
  return (
    <Box sx={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, p: 3, textAlign: 'center' }}>
      <ErrorOutlined color="error" sx={{ fontSize: 56 }} />
      <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('Kutilmagan xatolik yuz berdi')}</Typography>
      <Typography variant="body2" color="text.secondary">{t("Sahifani qayta yuklang yoki bosh sahifaga qayting.")}</Typography>
      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
        <Button variant="outlined" onClick={() => window.location.reload()}>{t('Qayta yuklash')}</Button>
        <Button variant="contained" onClick={() => navigate('/')}>{t('Bosh sahifa')}</Button>
      </Box>
    </Box>
  )
}
