import {
  AppBar, Toolbar, IconButton, Typography, Box, Tooltip, Badge, useTheme, Avatar, Button, Menu, MenuItem,
  ListItemText, ListItemIcon, Divider, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material'
import {
  Menu as MenuIcon, DarkMode, LightMode, Notifications, Search, Logout, Add, Key, DoneAll,
} from '@mui/icons-material'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector, useCan } from '@/app/hooks'
import { toggleTheme } from '@/app/themeSlice'
import { notify } from '@/app/uiSlice'
import { changePassword, logoutUser, refreshMe } from '@/features/auth/authSlice'
import { fetchNotifications, markAllRead, markRead } from '@/features/notifications/notificationsSlice'
import LanguageSwitcher from '@/shared/components/LanguageSwitcher/LanguageSwitcher'
import { formatDateTime, getInitials } from '@/shared/utils/formatters'

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/requests': 'Zayavkalar',
  '/documents/contracts': 'Shartnomalar',
  '/documents/acts': 'Dalolatnomalar',
  '/notifications': 'Bildirishnomalar',
  '/catalogs/products': 'Mahsulotlar',
  '/catalogs/customers': 'Mijozlar',
  '/catalogs/suppliers': 'Yetkazuvchilar',
  '/catalogs/employees': 'Xodimlar',
  '/catalogs/warehouses': 'Omborlar',
  '/sales/orders': 'Savdo buyurtmalari',
  '/sales/orders/new': 'Yangi spiska',
  '/sales/invoices': 'Fakturalar',
  '/purchases/orders': 'Xarid buyurtmalari',
  '/purchases/receipts/new': 'Yuk keldi',
  '/warehouse/balance': 'Ombor qoldiqlari',
  '/warehouse/movements': 'Tovar harakati',
  '/finance/payments': "To'lovlar",
  '/reports/sales': 'Savdo hisoboti',
  '/reports/stock': 'Qoldiqlar hisoboti',
  '/admin/users': 'Foydalanuvchilar',
  '/admin/roles': 'Rollar va ruxsatlar',
  '/admin/templates': 'Shartnoma shablonlari',
  '/admin/settings': 'Sozlamalar',
  '/admin/audit': 'Audit jurnali',
}

const POLL_MS = 30_000

interface Props {
  onToggleSidebar: () => void
  onOpenSearch: () => void
}

export default function Topbar({ onToggleSidebar, onOpenSearch }: Props) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const { t } = useTranslation()
  const mode = useAppSelector((s) => s.theme.mode)
  const user = useAppSelector((s) => s.auth.user)
  const { items: notes, unread } = useAppSelector((s) => s.notifications)
  const canRequest = useCan('requests.create')
  const canSell = useCan('sales.create')
  const canReceive = useCan('purchases.create')
  const [bellAnchor, setBellAnchor] = useState<HTMLElement | null>(null)
  const [userAnchor, setUserAnchor] = useState<HTMLElement | null>(null)
  const [pwOpen, setPwOpen] = useState(false)
  const [pw, setPw] = useState({ oldPassword: '', newPassword: '' })

  const path = location.pathname
  const title = t(ROUTE_TITLES[path]
    || (path.startsWith('/requests/') ? 'Zayavka' : path.startsWith('/catalogs/customers/') ? 'Mijoz' : 'ERP System'))

  // Notifications come from the server; permissions are re-read in case the owner changed them.
  useEffect(() => {
    const tick = () => { dispatch(fetchNotifications()); dispatch(refreshMe()) }
    tick()
    const id = window.setInterval(tick, POLL_MS)
    return () => window.clearInterval(id)
  }, [dispatch])

  const savePassword = async () => {
    const r = await dispatch(changePassword(pw))
    if (changePassword.fulfilled.match(r)) {
      dispatch(notify({ message: t("Parol o'zgartirildi. Qayta kiring.") }))
      setPwOpen(false)
      dispatch(logoutUser())
    } else {
      dispatch(notify({ message: r.payload ?? t('Xatolik yuz berdi'), severity: 'error' }))
    }
  }

  return (
    <AppBar position="sticky" elevation={0}
      sx={{ bgcolor: 'background.paper', borderBottom: `1px solid ${theme.palette.divider}`, color: 'text.primary', zIndex: (th) => th.zIndex.drawer - 1 }}>
      <Toolbar sx={{ gap: 0.5, minHeight: '56px !important' }}>
        <IconButton onClick={onToggleSidebar} size="small" edge="start" aria-label={t('Menyu')}><MenuIcon /></IconButton>
        <Typography variant="h6" noWrap sx={{ flex: 1, fontSize: { xs: '1rem', sm: '1.1rem' }, fontWeight: 700, ml: 1 }}>{title}</Typography>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, mr: 0.5 }}>
          {canRequest && <Button size="small" startIcon={<Add />} variant="contained" sx={{ borderRadius: 2, fontSize: '0.75rem' }} onClick={() => navigate('/requests')}>{t('Zayavka')}</Button>}
          {canSell && <Button size="small" startIcon={<Add />} variant="outlined" sx={{ borderRadius: 2, fontSize: '0.75rem' }} onClick={() => navigate('/sales/orders/new')}>{t('Spiska')}</Button>}
          {canReceive && <Button size="small" startIcon={<Add />} variant="outlined" color="success" sx={{ borderRadius: 2, fontSize: '0.75rem' }} onClick={() => navigate('/purchases/receipts/new')}>{t('Yuk keldi')}</Button>}
        </Box>

        <Tooltip title={t('Mahsulot qidirish (Ctrl+Space)')}>
          <IconButton size="small" onClick={onOpenSearch} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}><Search fontSize="small" /></IconButton>
        </Tooltip>
        <Tooltip title={t('Bildirishnomalar')}>
          <IconButton size="small" onClick={(e) => setBellAnchor(e.currentTarget)}>
            <Badge badgeContent={unread} color="error" max={99}><Notifications fontSize="small" /></Badge>
          </IconButton>
        </Tooltip>
        <Menu anchorEl={bellAnchor} open={!!bellAnchor} onClose={() => setBellAnchor(null)} slotProps={{ paper: { sx: { width: 340, maxWidth: '92vw', maxHeight: 440 } } }}>
          <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>{t('Bildirishnomalar')}</Typography>
            <IconButton size="small" disabled={!unread} onClick={() => dispatch(markAllRead())} aria-label={t("Hammasini o'qildi qilish")}><DoneAll fontSize="small" /></IconButton>
          </Box>
          <Divider />
          {notes.length === 0 && <MenuItem disabled>{t("Yangi bildirishnoma yo'q")}</MenuItem>}
          {notes.slice(0, 8).map((n) => (
            <MenuItem key={n.id} sx={{ bgcolor: n.read ? undefined : 'action.hover', alignItems: 'flex-start' }}
              onClick={() => { setBellAnchor(null); dispatch(markRead(n.id)); if (n.link) navigate(n.link) }}>
              <ListItemText slotProps={{ primary: { sx: { whiteSpace: 'normal', fontSize: '0.85rem', fontWeight: n.read ? 400 : 700 } }, secondary: { sx: { whiteSpace: 'normal' } } }}
                primary={n.title} secondary={`${n.body ? `${n.body} · ` : ''}${formatDateTime(n.createdAt)}`} />
            </MenuItem>
          ))}
          <Divider />
          <MenuItem onClick={() => { setBellAnchor(null); navigate('/notifications') }} sx={{ justifyContent: 'center', fontSize: '0.85rem' }}>{t('Barchasi')}</MenuItem>
        </Menu>

        <LanguageSwitcher />
        <Tooltip title={mode === 'light' ? t("Qorong'i rejim") : t('Yorug rejim')}>
          <IconButton size="small" onClick={() => dispatch(toggleTheme())}>{mode === 'light' ? <DarkMode fontSize="small" /> : <LightMode fontSize="small" />}</IconButton>
        </Tooltip>

        {user && (
          <>
            <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right', ml: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1.2, display: 'block' }}>{user.fullName}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{t(user.roleName)}</Typography>
            </Box>
            <IconButton size="small" onClick={(e) => setUserAnchor(e.currentTarget)} aria-label={t('Profil')}>
              <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main', fontSize: '0.75rem', fontWeight: 700 }}>{getInitials(user.fullName)}</Avatar>
            </IconButton>
            <Menu anchorEl={userAnchor} open={!!userAnchor} onClose={() => setUserAnchor(null)}>
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{user.fullName}</Typography>
                <Typography variant="caption" color="text.secondary">{user.username} · {t(user.roleName)}</Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => { setUserAnchor(null); setPw({ oldPassword: '', newPassword: '' }); setPwOpen(true) }}>
                <ListItemIcon><Key fontSize="small" /></ListItemIcon>{t("Parolni o'zgartirish")}
              </MenuItem>
              <MenuItem onClick={() => { setUserAnchor(null); dispatch(logoutUser()) }} sx={{ color: 'error.main' }}>
                <ListItemIcon><Logout fontSize="small" color="error" /></ListItemIcon>{t('Chiqish')}
              </MenuItem>
            </Menu>
          </>
        )}
      </Toolbar>

      <Dialog open={pwOpen} onClose={() => setPwOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{t("Parolni o'zgartirish")}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField size="small" type="password" autoComplete="current-password" label={t('Joriy parol')} value={pw.oldPassword} onChange={(e) => setPw({ ...pw, oldPassword: e.target.value })} />
          <TextField size="small" type="password" autoComplete="new-password" label={t('Yangi parol')} helperText={t('Kamida 8 ta belgi')} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button color="inherit" onClick={() => setPwOpen(false)}>{t('Bekor')}</Button>
          <Button variant="contained" disabled={!pw.oldPassword || pw.newPassword.length < 8} onClick={savePassword}>{t('Saqlash')}</Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  )
}
