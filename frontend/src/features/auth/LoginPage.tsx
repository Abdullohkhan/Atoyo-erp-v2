import {
  Box, Card, TextField, Button, Typography, Alert, Chip,
  InputAdornment, IconButton, Avatar,
} from '@mui/material'
import {
  Person, Lock, Visibility, VisibilityOff,
  AdminPanelSettings, PointOfSale, AccountBalance,
} from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { loginUser, clearError } from './authSlice'
import LanguageSwitcher from '@/shared/components/LanguageSwitcher/LanguageSwitcher'
import { ROLE_LABELS } from '@/shared/constants'

// Demo accounts are shown only in development builds.
const DEMO = [
  { role: 'owner', username: 'admin', password: 'admin123', icon: <AdminPanelSettings fontSize="small" /> },
  { role: 'seller', username: 'seller1', password: 'seller123', icon: <PointOfSale fontSize="small" /> },
  { role: 'accountant', username: 'accountant', password: 'acc123', icon: <AccountBalance fontSize="small" /> },
]

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, loading, error } = useAppSelector((s) => s.auth)
  const mode = useAppSelector((s) => s.theme.mode)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

  useEffect(() => { if (user) navigate('/', { replace: true }) }, [user, navigate])

  const handleLogin = () => {
    if (!username || !password || loading) return
    dispatch(loginUser({ username, password }))
  }

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
      background: mode === 'dark'
        ? 'radial-gradient(ellipse at 60% 20%, #1e3a5f 0%, #0B1120 70%)'
        : 'radial-gradient(ellipse at 60% 20%, #dbeafe 0%, #f1f5f9 70%)',
    }}>
      <Box sx={{ position: 'absolute', top: 12, right: 12 }}><LanguageSwitcher /></Box>
      <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card sx={{ width: { xs: '92vw', sm: 420 }, p: { xs: 3, sm: 4 }, borderRadius: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, mx: 'auto', mb: 1.5, borderRadius: 2.5, fontSize: '1.4rem', fontWeight: 800 }}>
              1C
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>ERP System</Typography>
            <Typography variant="body2" color="text.secondary">{t('Tizimga kirish')}</Typography>
          </Box>

          <TextField
            fullWidth label={t('Foydalanuvchi nomi')} size="small" sx={{ mb: 1.5 }} autoComplete="username"
            value={username} onChange={(e) => { setUsername(e.target.value); dispatch(clearError()) }}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Person fontSize="small" color="action" /></InputAdornment> } }}
          />
          <TextField
            fullWidth label={t('Parol')} size="small" sx={{ mb: 2 }} autoComplete="current-password"
            type={showPass ? 'text' : 'password'}
            value={password} onChange={(e) => { setPassword(e.target.value); dispatch(clearError()) }}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            slotProps={{ input: {
              startAdornment: <InputAdornment position="start"><Lock fontSize="small" color="action" /></InputAdornment>,
              endAdornment: <InputAdornment position="end">
                <IconButton size="small" aria-label={t("Parolni ko'rsatish")} onClick={() => setShowPass(!showPass)}>
                  {showPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </IconButton>
              </InputAdornment>,
            }}}
          />

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          <Button fullWidth variant="contained" size="large" disabled={loading || !username || !password} onClick={handleLogin}
            sx={{ borderRadius: 2.5, py: 1.2, fontWeight: 700 }}>
            {loading ? t('Kirish...') : t('Kirish')}
          </Button>

          {import.meta.env.DEV && (
            <Box sx={{ mt: 2.5, p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, mb: 1 }}>
                {t('Demo hisoblar (bosing):')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {DEMO.map((d) => (
                  <Chip key={d.role} icon={d.icon} label={t(ROLE_LABELS[d.role])} clickable size="small"
                    onClick={() => { setUsername(d.username); setPassword(d.password); dispatch(clearError()) }} />
                ))}
              </Box>
            </Box>
          )}
        </Card>
      </motion.div>
    </Box>
  )
}
