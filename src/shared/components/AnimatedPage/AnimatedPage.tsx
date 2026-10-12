import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Box } from '@mui/material'

const variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.0, 0.0, 0.2, 1] as const } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.18 } },
}

export default function AnimatedPage({ children }: { children: ReactNode }) {
  return (
    <motion.div variants={variants} initial="initial" animate="animate" exit="exit" style={{ height: '100%' }}>
      <Box sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>{children}</Box>
    </motion.div>
  )
}
