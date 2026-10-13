import { Card, CardHeader, CardContent, List, ListItem, ListItemText, ListItemAvatar, Avatar, Typography, Box } from '@mui/material'
import { ShoppingCart, LocalShipping } from '@mui/icons-material'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import StatusChip from '@/shared/components/StatusChip/StatusChip'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import type { SaleOrder, PurchaseOrder } from '@/shared/types/document.types'

export default function RecentDocs({ sales, purchases }: { sales: SaleOrder[]; purchases: PurchaseOrder[] }) {
  const { t } = useTranslation()
  const recent = useMemo(() => [
    ...sales.map((o) => ({ id: o.id, type: 'sale' as const, number: o.number, name: o.customerName, amount: o.total, date: o.date, status: o.status })),
    ...purchases.map((o) => ({ id: o.id, type: 'purchase' as const, number: o.number, name: o.supplierName, amount: o.total, date: o.date, status: o.status })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6), [sales, purchases])

  return (
    <Card sx={{ borderRadius: 3, height: '100%' }}>
      <CardHeader title={t("So'nggi hujjatlar")} slotProps={{ title: { sx: { fontWeight: 700 }, variant: 'subtitle1' } }} />
      <CardContent sx={{ pt: 0 }}>
        {recent.length === 0 && <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>{t("Ma'lumot topilmadi")}</Typography>}
        <List dense disablePadding>
          {recent.map((doc) => (
            <ListItem key={doc.id} disablePadding sx={{ py: 0.75, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 0 } }}>
              <ListItemAvatar sx={{ minWidth: 40 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: doc.type === 'sale' ? 'primary.main' + '22' : 'success.main' + '22', borderRadius: 1.5 }}>
                  {doc.type === 'sale' ? <ShoppingCart sx={{ fontSize: 16, color: 'primary.main' }} /> : <LocalShipping sx={{ fontSize: 16, color: 'success.main' }} />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                disableTypography
                primary={<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>{doc.number}</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700 }} color="primary.main">{formatCurrency(doc.amount)}</Typography>
                </Box>}
                secondary={<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.3, gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="caption" color="text.secondary">{doc.name}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary">{formatDate(doc.date)}</Typography>
                    <StatusChip status={doc.status} />
                  </Box>
                </Box>}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  )
}
