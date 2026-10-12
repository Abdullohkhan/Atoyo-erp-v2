import {
  AppBar, Toolbar, IconButton, Typography, Box,
  Tooltip, Badge, useTheme, Avatar, Chip, Button, Menu, MenuItem, ListItemText, Divider,
} from '@mui/material'
import {
  Menu as MenuIcon, DarkMode, LightMode,
  Notifications, Search, Logout, Add,
} from '@mui/icons-material'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { useAppDispatch, useAppSelector, useCan } from '@/app/hooks'
import { fetchBalance } from '@/features/warehouse/balance/store/balanceSlice'
import { fetchInvoices } from '@/features/sales/invoices/store/invoicesSlice'
import LanguageSwitcher from '@/shared/components/LanguageSwitcher/LanguageSwitcher'
import { ROLE_LABELS, LOW_STOCK_LIMIT } from '@/shared/constants'
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
  const { t } = useTranslation()
  const canSell = useCan('sales.create')
  const canReceive = useCan('purchases.create')
  const balance = useAppSelector((s) => s.balance.items)
  const invoices = useAppSelector((s) => s.saleInvoices.items)
  const [bellAnchor, setBellAnchor] = useState<HTMLElement | null>(null)
  const title = t(ROUTE_TITLES[location.pathname] || (location.pathname.startsWith('/catalogs/customers/') ? 'Mijoz' : 'ERP System'))

  useEffect(() => { dispatch(fetchBalance()); dispatch(fetchInvoices()) }, [dispatch])

  // Notifications are derived from live data: low stock and overdue unpaid invoices.
  const notifications = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD')
    const low = balance.filter((b) => b.availableQty <= LOW_STOCK_LIMIT).map((b) => ({
      id: `low-${b.id}`, path: '/warehouse/balance',
      text: t('Kam qolgan: {{name}} — {{qty}} {{unit}} ({{warehouse}})', { name: b.productName, qty: b.availableQty, unit: b.unit, warehouse: b.warehouseName }),
    }))
    const overdue = invoices.filter((i) => i.status !== 'paid' && i.dueDate < today).map((i) => ({
      id: `inv-${i.id}`, path: '/sales/invoices',
      text: t('Muddati o\'tgan faktura: {{number}} — {{name}}', { number: i.number, name: i.counterpartyName }),
    }))
    return [...overdue, ...low]
  }, [balance, invoices, t])

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
          {canSell && (
          <Tooltip title={t('Yangi spiska (sotuv)')}>
            <Button size="small" startIcon={<Add />} variant="outlined" color="primary"
              sx={{ borderRadius: 2, fontSize: '0.75rem' }}
              onClick={() => navigate('/sales/orders/new')}>
              {t('Spiska')}
            </Button>
          </Tooltip>
          )}
          {canReceive && (
          <Tooltip title={t('Yuk keldi (kirim)')}>
            <Button size="small" startIcon={<Add />} variant="outlined" color="success"
              sx={{ borderRadius: 2, fontSize: '0.75rem' }}
              onClick={() => navigate('/purchases/receipts/new')}>
              {t('Yuk keldi')}
            </Button>
          </Tooltip>
          )}
        </Box>

        {/* Search */}
        <Tooltip title={t('Mahsulot qidirish (Ctrl+Space)')}>
          <IconButton size="small" onClick={onOpenSearch}>
            <Search fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title={t('Bildirishnomalar')}>
          <IconButton size="small" onClick={(e) => setBellAnchor(e.currentTarget)}>
            <Badge badgeContent={notifications.length} color="error" max={99}>
              <Notifications fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>
        <Menu anchorEl={bellAnchor} open={!!bellAnchor} onClose={() => setBellAnchor(null)} slotProps={{ paper: { sx: { maxWidth: 340, maxHeight: 400 } } }}>
          <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 700 }}>{t('Bildirishnomalar')}</Typography>
          <Divider />
          {notifications.length === 0 && <MenuItem disabled>{t("Yangi bildirishnoma yo'q")}</MenuItem>}
          {notifications.map((n) => (
            <MenuItem key={n.id} onClick={() => { setBellAnchor(null); navigate(n.path) }}>
              <ListItemText slotProps={{ primary: { sx: { whiteSpace: 'normal', fontSize: '0.85rem' } } }} primary={n.text} />
            </MenuItem>
          ))}
        </Menu>

        <LanguageSwitcher />

        <Tooltip title={mode === 'light' ? t("Qorong'i rejim") : t('Yorug rejim')}>
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
                label={t(ROLE_LABELS[user.role] || user.role)}
                size="small"
                color={user.role === 'owner' ? 'secondary' : user.role === 'accountant' ? 'success' : 'primary'}
                sx={{ height: 16, fontSize: '0.65rem', fontWeight: 700 }}
              />
            </Box>
            <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
              {getInitials(user.name)}
            </Avatar>
            <Tooltip title={t('Chiqish')}>
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
