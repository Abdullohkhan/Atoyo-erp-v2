import { Button, Menu, MenuItem, Tooltip } from '@mui/material'
import { Language } from '@mui/icons-material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '@/i18n'

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0]
  return (
    <>
      <Tooltip title={t('Til')}>
        <Button size="small" color="inherit" startIcon={<Language fontSize="small" />} onClick={(e) => setAnchor(e.currentTarget)}
          sx={{ minWidth: 0, px: 1, fontWeight: 700, fontSize: '0.75rem' }}>
          {current.short}
        </Button>
      </Tooltip>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        {LANGUAGES.map((l) => (
          <MenuItem key={l.code} selected={l.code === i18n.language}
            onClick={() => { void i18n.changeLanguage(l.code); setAnchor(null) }}>
            {l.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
