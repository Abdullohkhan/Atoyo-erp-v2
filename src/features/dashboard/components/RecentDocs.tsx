import { Card, CardHeader, CardContent, List, ListItem, ListItemText, ListItemAvatar, Avatar, Typography, Chip, Box } from '@mui/material'
import { ShoppingCart, LocalShipping } from '@mui/icons-material'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'

const recent = [
  { id: '1', type: 'sale',     number: 'SAV-000041', name: 'Alisher Karimov',    amount: 4200000,  date: '2025-07-14', status: 'confirmed' },
  { id: '2', type: 'purchase', number: 'XAR-000028', name: 'Toshkent Zavod',     amount: 12500000, date: '2025-07-13', status: 'completed' },
  { id: '3', type: 'sale',     number: 'SAV-000040', name: 'Dilnoza Yusupova',   amount: 870000,   date: '2025-07-13', status: 'draft' },
  { id: '4', type: 'purchase', number: 'XAR-000027', name: 'Samarqand Import',   amount: 8900000,  date: '2025-07-12', status: 'confirmed' },
  { id: '5', type: 'sale',     number: 'SAV-000039', name: 'Bobur Toshmatov',    amount: 2100000,  date: '2025-07-12', status: 'completed' },
]

const statusConfig: Record<string, { label: string; color: 'default' | 'warning' | 'success' | 'info' }> = {
  draft:     { label: 'Qoralama',     color: 'default' },
  confirmed: { label: 'Tasdiqlangan', color: 'info'    },
  completed: { label: 'Bajarildi',    color: 'success' },
}

export default function RecentDocs() {
  return (
    <Card sx={{ borderRadius: 3, height: '100%' }}>
      <CardHeader title="So'nggi hujjatlar" titleTypographyProps={{ fontWeight: 700, variant: 'subtitle1' }} />
      <CardContent sx={{ pt: 0 }}>
        <List dense disablePadding>
          {recent.map((doc) => (
            <ListItem key={doc.id} disablePadding sx={{ py: 0.75, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 0 } }}>
              <ListItemAvatar sx={{ minWidth: 40 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: doc.type === 'sale' ? 'primary.main' + '22' : 'success.main' + '22', borderRadius: 1.5 }}>
                  {doc.type === 'sale' ? <ShoppingCart sx={{ fontSize: 16, color: 'primary.main' }} /> : <LocalShipping sx={{ fontSize: 16, color: 'success.main' }} />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>{doc.number}</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700 }} color="primary.main">{formatCurrency(doc.amount)}</Typography>
                </Box>}
                secondary={<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.3 }}>
                  <Typography variant="caption" color="text.secondary">{doc.name}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary">{formatDate(doc.date)}</Typography>
                    <Chip label={statusConfig[doc.status]?.label} color={statusConfig[doc.status]?.color} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
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
