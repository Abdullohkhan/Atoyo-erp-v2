import { useEffect } from 'react'
import { Box, Button, Card, List, ListItemButton, ListItemText, Typography } from '@mui/material'
import { DoneAll } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import PageHeader from '@/shared/components/PageHeader/PageHeader'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { formatDateTime } from '@/shared/utils/formatters'
import { fetchNotifications, markAllRead, markRead } from './notificationsSlice'

export default function NotificationsPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { items, unread } = useAppSelector((s) => s.notifications)
  useEffect(() => { dispatch(fetchNotifications()) }, [dispatch])
  return (
    <AnimatedPage>
      <PageHeader title="Bildirishnomalar" subtitle={t("O'qilmagan: {{count}}", { count: unread })}
        actions={<Button startIcon={<DoneAll />} disabled={!unread} onClick={() => dispatch(markAllRead())}>{t("Hammasini o'qildi qilish")}</Button>} />
      <Card sx={{ borderRadius: 3 }}>
        {items.length === 0 && <Typography color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>{t("Yangi bildirishnoma yo'q")}</Typography>}
        <List>
          {items.map((n) => (
            <ListItemButton key={n.id} onClick={() => { dispatch(markRead(n.id)); if (n.link) navigate(n.link) }}
              sx={{ bgcolor: n.read ? undefined : 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}>
              <ListItemText
                primary={<Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}><b>{n.title}</b><Typography variant="caption" color="text.secondary">{formatDateTime(n.createdAt)}</Typography></Box>}
                secondary={n.body} />
            </ListItemButton>
          ))}
        </List>
      </Card>
    </AnimatedPage>
  )
}
