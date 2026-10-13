import { Box, IconButton, Tooltip, Chip } from '@mui/material'
import { Edit, Delete } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'

interface Props {
  onEdit?: () => void
  onDelete?: () => void
  children?: ReactNode
}

export default function RowActions({ onEdit, onDelete, children }: Props) {
  const { t } = useTranslation()
  return (
    <Box sx={{ display: 'inline-flex', gap: 0.5 }}>
      {children}
      {onEdit && <Tooltip title={t('Tahrirlash')}><IconButton size="small" onClick={onEdit}><Edit fontSize="small" /></IconButton></Tooltip>}
      {onDelete && <Tooltip title={t("O'chirish")}><IconButton size="small" color="error" onClick={onDelete}><Delete fontSize="small" /></IconButton></Tooltip>}
    </Box>
  )
}

export function ActiveChip({ active }: { active: unknown }) {
  const { t } = useTranslation()
  return <Chip label={active ? t('Faol') : t('Nofaol')} color={active ? 'success' : 'default'} size="small" sx={{ borderRadius: 1 }} />
}
