import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material'
import { WarningAmber } from '@mui/icons-material'

interface Props {
  open: boolean
  title?: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onClose: () => void
  loading?: boolean
}

export default function ConfirmDialog({ open, title = 'Tasdiqlash', message, confirmLabel = "O'chirish", onConfirm, onClose, loading }: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningAmber color="warning" /> {title}
      </DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">Bekor qilish</Button>
        <Button onClick={onConfirm} variant="contained" color="error" disabled={loading}>
          {loading ? 'Yuklanmoqda...' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
