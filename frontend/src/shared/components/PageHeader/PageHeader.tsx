import { Box, Typography, Breadcrumbs, Link } from '@mui/material'
import { NavigateNext } from '@mui/icons-material'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'

interface Crumb { label: string; href?: string }

interface Props {
  title: string
  subtitle?: string
  breadcrumbs?: Crumb[]
  actions?: ReactNode
}

export default function PageHeader({ title, subtitle, breadcrumbs, actions }: Props) {
  const { t } = useTranslation()
  return (
    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          {breadcrumbs && (
            <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 0.5 }}>
              {breadcrumbs.map((crumb, i) =>
                crumb.href ? (
                  <Link key={i} component={RouterLink} to={crumb.href} underline="hover" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    {t(crumb.label)}
                  </Link>
                ) : (
                  <Typography key={i} color="text.primary" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    {t(crumb.label)}
                  </Typography>
                ),
              )}
            </Breadcrumbs>
          )}
          <Typography variant="h5" sx={{  lineHeight: 1.2 , fontWeight: 700 }}>
            {t(title)}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>{actions}</Box>}
      </Box>
    </motion.div>
  )
}
