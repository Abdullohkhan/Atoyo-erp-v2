import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, IconButton, Grid,
} from '@mui/material'
import { ChevronLeft, ChevronRight } from '@mui/icons-material'
import { useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/uz'

dayjs.locale('uz')

interface Props {
  open: boolean
  value: Dayjs
  onClose: () => void
  onConfirm: (date: Dayjs) => void
  label?: string
}

const MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']
const DAYS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']

export default function DatePickerModal({ open, value, onClose, onConfirm, label = 'Sana tanlang' }: Props) {
  const [current, setCurrent] = useState<Dayjs>(value || dayjs())
  const [selected, setSelected] = useState<Dayjs>(value || dayjs())

  const startOfMonth = current.startOf('month')
  const daysInMonth = current.daysInMonth()
  const firstDayOfWeek = (startOfMonth.day() + 6) % 7 // Monday = 0

  const cells: (Dayjs | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => startOfMonth.add(i, 'day')),
  ]

  const prevMonth = () => setCurrent((d) => d.subtract(1, 'month'))
  const nextMonth = () => setCurrent((d) => d.add(1, 'month'))

  const handleConfirm = () => {
    // Combine selected date with current time
    const now = dayjs()
    const result = selected.hour(now.hour()).minute(now.minute()).second(0)
    onConfirm(result)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle sx={{ pb: 0 }}>
        <Typography sx={{ fontWeight: 700 }}>{label}</Typography>
        <Typography variant="h4" color="primary.main" sx={{ fontWeight: 800, mt: 0.5 }}>
          {selected.format('DD MMMM YYYY')}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {selected.format('HH:mm')} — hozirgi vaqt
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Month navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <IconButton size="small" onClick={prevMonth}><ChevronLeft /></IconButton>
          <Typography sx={{ fontWeight: 700 }}>{MONTHS[current.month()]} {current.year()}</Typography>
          <IconButton size="small" onClick={nextMonth}><ChevronRight /></IconButton>
        </Box>

        {/* Day headers */}
        <Grid container columns={7} sx={{ mb: 0.5 }}>
          {DAYS.map((d) => (
            <Grid key={d} size={1}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700,  display: 'block', textAlign: 'center', fontSize: '0.7rem'  }}>
                {d}
              </Typography>
            </Grid>
          ))}
        </Grid>

        {/* Calendar cells */}
        <Grid container columns={7}>
          {cells.map((day, i) => {
            const isSelected = day && day.isSame(selected, 'day')
            const isToday = day && day.isSame(dayjs(), 'day')
            return (
              <Grid key={i} size={1}>
                {day ? (
                  <Box
                    onClick={() => setSelected(day)}
                    sx={{
                      width: 36, height: 36, mx: 'auto',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '50%', cursor: 'pointer',
                      bgcolor: isSelected ? 'primary.main' : 'transparent',
                      color: isSelected ? 'white' : isToday ? 'primary.main' : 'text.primary',
                      fontWeight: isSelected || isToday ? 700 : 400,
                      border: isToday && !isSelected ? '2px solid' : 'none',
                      borderColor: 'primary.main',
                      fontSize: '0.85rem',
                      '&:hover': { bgcolor: isSelected ? 'primary.dark' : 'action.hover' },
                    }}
                  >
                    {day.date()}
                  </Box>
                ) : <Box sx={{ height: 36 }} />}
              </Grid>
            )
          })}
        </Grid>

        {/* Quick shortcuts */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
          {[
            { label: 'Bugun', value: dayjs() },
            { label: 'Kecha', value: dayjs().subtract(1, 'day') },
          ].map((s) => (
            <Button key={s.label} size="small" variant="outlined" color="inherit"
              sx={{ borderRadius: 2, fontSize: '0.75rem' }}
              onClick={() => { setSelected(s.value); setCurrent(s.value) }}>
              {s.label}
            </Button>
          ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">Bekor</Button>
        <Button onClick={handleConfirm} variant="contained">Tasdiqlash</Button>
      </DialogActions>
    </Dialog>
  )
}
