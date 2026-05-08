import React from 'react'
import {
  Box, Card, TextField, Button, Typography, Alert,
  ToggleButtonGroup, ToggleButton, InputAdornment, IconButton,
  Avatar,
} from '@mui/material'
import {
  Person, Lock, Visibility, VisibilityOff,
  AdminPanelSettings, PointOfSale, AccountBalance,
} from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { loginUser, clearError, type UserRole } from './authSlice'

const ROLE_CONFIG: Record<UserRole, { label: string; icon: React.ReactNode; color: string }> = {
  seller:     { label: 'Sotuvchi',   icon: <PointOfSale />,       color: '#2563EB' },
  accountant: { label: 'Moliyachi',  icon: <AccountBalance />,    color: '#22C55E' },
  owner:      { label: 'Direktor',   icon: <AdminPanelSettings />, color: '#8B5CF6' },
}

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { user, loading, error } = useAppSelector((s) => s.auth)
  const mode = useAppSelector((s) => s.theme.mode)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [role, setRole] = useState<UserRole>('seller')

  useEffect(() => { if (user) navigate('/') }, [user, navigate])
  useEffect(() => { dispatch(clearError()) }, [username, password, dispatch])

  const handleLogin = () => {
    if (!username || !password) return
    dispatch(loginUser({ username, password }))
  }

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: 'background.default',
      background: mode === 'dark'
        ? 'radial-gradient(ellipse at 60% 20%, #1e3a5f 0%, #0B1120 70%)'
        : 'radial-gradient(ellipse at 60% 20%, #dbeafe 0%, #f1f5f9 70%)',
    }}>
      <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card sx={{ width: { xs: '92vw', sm: 420 }, p: 4, borderRadius: 4 }}>

          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, mx: 'auto', mb: 1.5, borderRadius: 2.5, fontSize: '1.4rem', fontWeight: 800 }}>
              1C
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>ERP System</Typography>
            <Typography variant="body2" color="text.secondary">Tizimga kirish</Typography>
          </Box>

          {/* Role tanlash */}
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.06em" }}>
            Rolni tanlang
          </Typography>
          <ToggleButtonGroup
            value={role} exclusive
            onChange={(_: React.MouseEvent<HTMLElement>, v: UserRole | null) => { if (v) setRole(v) }}
            fullWidth sx={{ mt: 0.5, mb: 2.5 }}
          >
            {(Object.entries(ROLE_CONFIG) as [UserRole, typeof ROLE_CONFIG[UserRole]][]).map(([key, cfg]) => (
              <ToggleButton key={key} value={key} sx={{
                borderRadius: 2.5, py: 1, flex: 1, gap: 0.5,
                '&.Mui-selected': { bgcolor: cfg.color + '18', borderColor: cfg.color, color: cfg.color },
              }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
                  {cfg.icon}
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.7rem" }}>{cfg.label}</Typography>
                </Box>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          {/* Login fields */}
          <TextField
            fullWidth label="Foydalanuvchi nomi" size="small" sx={{ mb: 1.5 }}
            value={username} onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Person fontSize="small" color="action" /></InputAdornment> } }}
          />
          <TextField
            fullWidth label="Parol" size="small" sx={{ mb: 2 }}
            type={showPass ? 'text' : 'password'}
            value={password} onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            slotProps={{ input: {
              startAdornment: <InputAdornment position="start"><Lock fontSize="small" color="action" /></InputAdornment>,
              endAdornment: <InputAdornment position="end">
                <IconButton size="small" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </IconButton>
              </InputAdornment>,
            }}}
          />

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          <Button fullWidth variant="contained" size="large" disabled={loading || !username || !password} onClick={handleLogin}
            sx={{ borderRadius: 2.5, py: 1.2, fontWeight: 700 }}>
            {loading ? 'Kirish...' : 'Kirish'}
          </Button>

          <Box sx={{ mt: 2.5, p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary"  sx={{ display: "block",  fontWeight: 600, mb: 0.5  }}>
              💡 Demo kirish ma'lumotlari:
            </Typography>
            <Typography variant="caption" color="text.secondary"  sx={{ display: "block" }}>Direktor: admin / admin123</Typography>
            <Typography variant="caption" color="text.secondary"  sx={{ display: "block" }}>Sotuvchi: seller1 / seller123</Typography>
            <Typography variant="caption" color="text.secondary"  sx={{ display: "block" }}>Moliyachi: accountant / acc123</Typography>
          </Box>
        </Card>
      </motion.div>
    </Box>
  )
}
