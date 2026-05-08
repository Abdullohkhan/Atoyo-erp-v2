import { Card, Box, Typography, Avatar } from '@mui/material'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from '@mui/icons-material'
import type { ReactNode } from 'react'

interface Props {
  title: string
  value: string
  change?: number
  icon: ReactNode
  color: string
  index?: number
}

export default function KpiCard({ title, value, change, icon, color, index = 0 }: Props) {
  const isPositive = (change ?? 0) >= 0
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.35 }}
    >
      <Card sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{  textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.7rem' , fontWeight: 600 }}>
              {title}
            </Typography>
            <Typography variant="h5" sx={{  mt: 0.5, mb: 0.5 , fontWeight: 800 }}>
              {value}
            </Typography>
            {change !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                {isPositive ? <TrendingUp sx={{ fontSize: 14, color: 'success.main' }} /> : <TrendingDown sx={{ fontSize: 14, color: 'error.main' }} />}
                <Typography variant="caption" sx={{ color: isPositive ? 'success.main' : 'error.main', fontWeight: 700 }}>
                  {Math.abs(change)}% o'tgan oyga nisbatan
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color + '22', width: 48, height: 48, borderRadius: 2.5 }}>
            <Box sx={{ color, display: 'flex' }}>{icon}</Box>
          </Avatar>
        </Box>
      </Card>
    </motion.div>
  )
}
