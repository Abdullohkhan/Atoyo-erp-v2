import { useState } from 'react'
import { Box, Button, Card, Chip, FormControlLabel, Grid, List, ListItemButton, ListItemText, Switch, TextField, Typography } from '@mui/material'
import { Add, Delete, Save } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import PageHeader from '@/shared/components/PageHeader/PageHeader'
import { useFetch } from '@/shared/hooks/useFetch'
import { useAction } from '@/shared/hooks/useAction'
import api from '@/lib/axios'

interface Template { id: string; name: string; body: string; isDefault: boolean }

const SAMPLE: Record<string, string> = {
  number: 'SHR-000001', date: '01.01.2027', total: "10 000 000 so'm", advancePct: '30', advanceAmount: "3 000 000 so'm", deadlineDays: '90',
  'customer.name': 'Namuna MChJ', 'customer.inn': '123456789', 'customer.address': 'Toshkent', 'customer.phone': '+998 90 000 00 00',
  'company.name': 'Atoyo MChJ', 'company.inn': '987654321', 'company.address': 'Toshkent', 'company.phone': '', 'company.bank': '', 'company.director': '',
  itemsTable: '<table border="1" cellpadding="4" style="border-collapse:collapse;width:100%"><tr><th>№</th><th>Nomi</th><th>Miqdori</th><th>Narxi</th><th>Summa</th></tr><tr><td>1</td><td>Dell Latitude</td><td>1 dona</td><td>10 000 000</td><td>10 000 000</td></tr></table>',
}
const preview = (body: string) => body.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, k: string) => SAMPLE[k] ?? `{{${k}}}`)

export default function TemplatesPage() {
  const { t } = useTranslation()
  const { data: templates, reload } = useFetch<Template[]>('/contract-templates')
  const { data: meta } = useFetch<{ placeholders: string[]; example: string }>('/contract-templates/placeholders')
  const { busy, run } = useAction()
  const [sel, setSel] = useState<Template | null>(null)

  const current = sel ?? templates?.[0] ?? null
  const set = (patch: Partial<Template>) => current && setSel({ ...current, ...patch })

  const save = async () => {
    if (!current) return
    const body = { name: current.name, body: current.body, isDefault: current.isDefault }
    let saved: Template | null = null
    const ok = await run(async () => {
      saved = (current.id ? await api.patch(`/contract-templates/${current.id}`, body) : await api.post('/contract-templates', body)).data
    }, 'Saqlandi')
    if (ok) { setSel(saved); reload() }
  }

  return (
    <AnimatedPage>
      <PageHeader title="Shartnoma shablonlari" breadcrumbs={[{ label: 'Boshqaruv' }, { label: 'Shablonlar' }]}
        actions={<Button variant="contained" startIcon={<Add />} onClick={() => setSel({ id: '', name: t('Yangi shablon'), body: meta?.example ?? '', isDefault: false })}>{t('Yangi shablon')}</Button>} />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <List dense>
              {(templates ?? []).map((x) => (
                <ListItemButton key={x.id} selected={x.id === current?.id} onClick={() => setSel(x)}>
                  <ListItemText primary={x.name} secondary={x.isDefault ? t('Standart') : undefined} />
                </ListItemButton>
              ))}
            </List>
          </Card>
        </Grid>
        {current && (
          <Grid size={{ xs: 12, md: 9 }}>
            <Card sx={{ borderRadius: 3, p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField size="small" label={t('Nomi')} value={current.name} onChange={(e) => set({ name: e.target.value })} sx={{ flex: 1, minWidth: 200 }} />
                <FormControlLabel control={<Switch checked={current.isDefault} onChange={(e) => set({ isDefault: e.target.checked })} />} label={t('Standart')} />
                <Button variant="contained" startIcon={<Save />} disabled={busy || !current.name.trim() || !current.body.trim()} onClick={save}>{t('Saqlash')}</Button>
                {current.id && (
                  <Button color="error" startIcon={<Delete />} disabled={busy}
                    onClick={async () => { if (await run(() => api.delete(`/contract-templates/${current.id}`), "O'chirildi")) { setSel(null); reload() } }}>{t("O'chirish")}</Button>
                )}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">{t("O'rinbosarlar (bosing — matnga qo'shiladi)")}:</Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                  {(meta?.placeholders ?? []).map((p) => <Chip key={p} size="small" label={`{{${p}}}`} onClick={() => set({ body: `${current.body}{{${p}}}` })} />)}
                </Box>
              </Box>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, lg: 6 }}>
                  <TextField multiline minRows={18} fullWidth label="HTML" value={current.body} onChange={(e) => set({ body: e.target.value })}
                    slotProps={{ input: { sx: { fontFamily: 'monospace', fontSize: '0.8rem' } } }} />
                </Grid>
                <Grid size={{ xs: 12, lg: 6 }}>
                  <iframe title="preview" sandbox="" srcDoc={`<body style="font-family:serif;font-size:13px;background:#fff;color:#000">${preview(current.body)}</body>`}
                    style={{ width: '100%', height: 460, border: '1px solid #ddd', borderRadius: 8, background: '#fff' }} />
                </Grid>
              </Grid>
            </Card>
          </Grid>
        )}
      </Grid>
    </AnimatedPage>
  )
}
