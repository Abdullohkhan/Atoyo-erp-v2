import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  Table, TableHead, TableRow, TableCell, TableBody,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'
import type { DocumentItem } from '@/shared/types/document.types'
import { formatCurrency, formatNumber } from '@/shared/utils/formatters'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  meta: { label: string; value: ReactNode }[]
  items: DocumentItem[]
  total: number
}

/** Read-only view of a sale / purchase document with its lines. */
export default function DocumentDialog({ open, onClose, title, meta, items, total }: Props) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 2 }}>
          {meta.map((m) => (
            <Box key={m.label}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{t(m.label)}</Typography>
              <Box sx={{ fontWeight: 600 }}>{m.value}</Box>
            </Box>
          ))}
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 520 }}>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>{t('Mahsulot')}</TableCell>
                <TableCell align="right">{t('Soni')}</TableCell>
                <TableCell align="right">{t('Narx')}</TableCell>
                <TableCell align="right">{t('Jami')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((it, i) => (
                <TableRow key={`${it.productId}-${i}`}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{it.productName}</TableCell>
                  <TableCell align="right">{formatNumber(it.qty)} {it.unit}</TableCell>
                  <TableCell align="right">{formatCurrency(it.price)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(it.sum)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={4} align="right" sx={{ fontWeight: 700 }}>{t('Jami summa')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>{formatCurrency(total)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">{t('Yopish')}</Button>
      </DialogActions>
    </Dialog>
  )
}
