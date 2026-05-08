import {
  AppBar, Toolbar, IconButton, Typography, Box,
  Tooltip, Badge, useTheme, Avatar, Chip, Button,
} from '@mui/material'
import {
  Menu as MenuIcon, DarkMode, LightMode,
  Notifications, Search, Logout, Add,
} from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { toggleTheme } from '@/app/themeSlice'
import { logout } from '@/features/auth/authSlice'
import { useLocation, useNavigate } from 'react-router-dom'
import { getInitials } from '@/shared/utils/formatters'

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/catalogs/products': 'Mahsulotlar',
  '/catalogs/customers': 'Mijozlar',
  '/catalogs/suppliers': 'Yetkazuvchilar',
  '/catalogs/employees': 'Xodimlar',
  '/catalogs/warehouses': 'Omborlar',
  '/sales/orders': 'Savdo buyurtmalari',
  '/sales/orders/new': 'Yangi spiska',
  '/sales/invoices': 'Savdo fakturalari',
  '/purchases/orders': 'Xarid buyurtmalari',
  '/purchases/receipts/new': 'Yuk keldi',
  '/warehouse/balance': 'Ombor qoldiqlari',
  '/warehouse/movements': 'Tovar harakati',
  '/finance/payments': "To'lovlar",
  '/reports/sales': 'Savdo hisoboti',
  '/reports/stock': 'Qoldiqlar hisoboti',
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Direktor',
  seller: 'Sotuvchi',
  accountant: 'Moliyachi',
}

interface Props {
  onToggleSidebar: () => void
  onOpenSearch: () => void
}

export default function Topbar({ onToggleSidebar, onOpenSearch }: Props) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const mode = useAppSelector((s) => s.theme.mode)
  const user = useAppSelector((s) => s.auth.user)
  const theme = useTheme()
  const location = useLocation()
  const title = ROUTE_TITLES[location.pathname] || 'ERP System'

  return (
    <AppBar
      position="sticky" elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: `1px solid ${theme.palette.divider}`,
        color: 'text.primary',
        zIndex: (t) => t.zIndex.drawer - 1,
      }}
    >
      <Toolbar sx={{ gap: 1, minHeight: '56px !important' }}>
        <IconButton onClick={onToggleSidebar} size="small" edge="start">
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" sx={{ flex: 1, fontSize: { xs: '1rem', sm: '1.1rem' }, fontWeight: 700 }}>
          {title}
        </Typography>

        {/* Quick actions */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5 }}>
          <Tooltip title="Yangi spiska (sotuv)">
            <Button size="small" startIcon={<Add />} variant="outlined" color="primary"
              sx={{ borderRadius: 2, fontSize: '0.75rem' }}
              onClick={() => navigate('/sales/orders/new')}>
              Spiska
            </Button>
          </Tooltip>
          <Tooltip title="Yuk keldi (kirim)">
            <Button size="small" startIcon={<Add />} variant="outlined" color="success"
              sx={{ borderRadius: 2, fontSize: '0.75rem' }}
              onClick={() => navigate('/purchases/receipts/new')}>
              Yuk keldi
            </Button>
          </Tooltip>
        </Box>

        {/* Search */}
        <Tooltip title="Mahsulot qidirish (Ctrl+Space)">
          <IconButton size="small" onClick={onOpenSearch}>
            <Search fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Bildirishnomalar">
          <IconButton size="small">
            <Badge badgeContent={3} color="error">
              <Notifications fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>

        <Tooltip title={mode === 'light' ? "Qorong'i rejim" : 'Yorug rejim'}>
          <IconButton size="small" onClick={() => dispatch(toggleTheme())}>
            {mode === 'light' ? <DarkMode fontSize="small" /> : <LightMode fontSize="small" />}
          </IconButton>
        </Tooltip>

        {/* User info */}
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 0.5 }}>
            <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1.2, display: "block" }}>
                {user.name}
              </Typography>
              <Chip
                label={ROLE_LABELS[user.role] || user.role}
                size="small"
                color={user.role === 'owner' ? 'secondary' : user.role === 'accountant' ? 'success' : 'primary'}
                sx={{ height: 16, fontSize: '0.65rem', fontWeight: 700 }}
              />
            </Box>
            <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
              {getInitials(user.name)}
            </Avatar>
            <Tooltip title="Chiqish">
              <IconButton size="small" color="error" onClick={() => dispatch(logout())}>
                <Logout fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  )
}
