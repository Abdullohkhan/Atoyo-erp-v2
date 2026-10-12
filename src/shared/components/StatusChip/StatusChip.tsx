import { Chip } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { STATUS_LABELS } from '@/shared/constants'
import type { DocumentStatus } from '@/shared/types/document.types'

const config: Record<string, { label: string; color: 'default' | 'warning' | 'success' | 'error' | 'info' }> = {
  draft:     { label: 'Qoralama',   color: 'default'  },
  confirmed: { label: 'Tasdiqlangan', color: 'info'   },
  completed: { label: 'Bajarildi',  color: 'success'  },
  cancelled: { label: 'Bekor',      color: 'error'    },
  unpaid:    { label: "To'lanmagan", color: 'error'   },
  partial:   { label: 'Qisman',     color: 'warning'  },
  paid:      { label: "To'langan",  color: 'success'  },
}

interface Props { status: DocumentStatus | string; size?: 'small' | 'medium' }

export default function StatusChip({ status, size = 'small' }: Props) {
  const { t } = useTranslation()
  const cfg = config[status] ?? { label: status, color: 'default' as const }
  return <Chip label={t(STATUS_LABELS[status] ?? cfg.label)} color={cfg.color} size={size} sx={{ fontWeight: 600, borderRadius: '8px' }} />
}
