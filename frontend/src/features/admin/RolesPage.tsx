import { useMemo, useState } from 'react'
import {
  Alert, Box, Button, Card, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel,
  Grid, List, ListItemButton, ListItemText, TextField, Typography,
} from '@mui/material'
import { Add, Delete, Save } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import PageHeader from '@/shared/components/PageHeader/PageHeader'
import { useAppDispatch, useCan } from '@/app/hooks'
import { refreshMe } from '@/features/auth/authSlice'
import { useFetch } from '@/shared/hooks/useFetch'
import { useAction } from '@/shared/hooks/useAction'
import api from '@/lib/axios'

interface Role { id: string; key: string; name: string; description: string | null; permissions: string[]; isSystem: boolean; userCount: number }
interface Perm { key: string; group: string; label: string }

export default function RolesPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const canManage = useCan('roles.manage')
  const { data: roles, reload } = useFetch<Role[]>('/roles')
  const { data: perms } = useFetch<Perm[]>('/permissions')
  const { busy, run } = useAction()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, string[]>>({})
  const [newOpen, setNewOpen] = useState(false)
  const [nr, setNr] = useState({ key: '', name: '', description: '' })

  const selected = roles?.find((r) => r.id === selectedId) ?? roles?.[0]
  const current = selected ? draft[selected.id] ?? selected.permissions : []
  const editable = canManage && selected?.key !== 'owner'
  const groups = useMemo(() => {
    const g = new Map<string, Perm[]>()
    for (const p of perms ?? []) g.set(p.group, [...(g.get(p.group) ?? []), p])
    return [...g.entries()]
  }, [perms])
  const dirty = !!selected && !!draft[selected.id]

  const toggle = (key: string, on: boolean) => {
    if (!selected) return
    setDraft({ ...draft, [selected.id]: on ? [...current, key] : current.filter((k) => k !== key) })
  }
  const toggleGroup = (keys: string[], on: boolean) => {
    if (!selected) return
    setDraft({ ...draft, [selected.id]: on ? [...new Set([...current, ...keys])] : current.filter((k) => !keys.includes(k)) })
  }
  const save = async () => {
    if (!selected) return
    if (await run(() => api.patch(`/roles/${selected.id}`, { permissions: current }), 'Ruxsatlar saqlandi')) {
      const rest = { ...draft }
      delete rest[selected.id]
      setDraft(rest); reload(); dispatch(refreshMe())
    }
  }

  return (
    <AnimatedPage>
      <PageHeader title="Rollar va ruxsatlar" breadcrumbs={[{ label: 'Boshqaruv' }, { label: 'Rollar' }]}
        actions={canManage && <Button variant="contained" startIcon={<Add />} onClick={() => setNewOpen(true)}>{t('Yangi rol')}</Button>} />
      {!canManage && <Alert severity="info" sx={{ mb: 2 }}>{t("Ruxsatlarni faqat Owner o'zgartira oladi.")}</Alert>}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <List dense>
              {(roles ?? []).map((r) => (
                <ListItemButton key={r.id} selected={r.id === selected?.id} onClick={() => setSelectedId(r.id)}>
                  <ListItemText primary={<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>{t(r.name)}{draft[r.id] && <Chip size="small" color="warning" label="*" />}</Box>}
                    secondary={`${r.userCount} ${t('foydalanuvchi')} · ${r.key === 'owner' ? t('barcha ruxsatlar') : `${r.permissions.length} ${t('ruxsat')}`}`} />
                </ListItemButton>
              ))}
            </List>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          {selected && (
            <Card sx={{ borderRadius: 3, p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{t(selected.name)}</Typography>
                <Chip size="small" variant="outlined" label={selected.key} />
                <Box sx={{ flex: 1 }} />
                {editable && !selected.isSystem && (
                  <Button color="error" size="small" startIcon={<Delete />} disabled={busy || selected.userCount > 0}
                    onClick={async () => { if (await run(() => api.delete(`/roles/${selected.id}`), "O'chirildi")) { setSelectedId(null); reload() } }}>{t("O'chirish")}</Button>
                )}
                {editable && <Button variant="contained" size="small" startIcon={<Save />} disabled={!dirty || busy} onClick={save}>{t('Saqlash')}</Button>}
              </Box>
              {selected.description && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{t(selected.description)}</Typography>}
              {selected.key === 'owner' && <Alert severity="info" sx={{ mb: 1 }}>{t("Owner roli doim barcha ruxsatlarga ega va o'zgartirilmaydi.")}</Alert>}
              {groups.map(([group, list]) => {
                const keys = list.map((p) => p.key)
                const all = keys.every((k) => current.includes(k))
                const some = keys.some((k) => current.includes(k))
                return (
                  <Box key={group} sx={{ mt: 1.5 }}>
                    <FormControlLabel disabled={!editable}
                      control={<Checkbox checked={all} indeterminate={!all && some} onChange={(e) => toggleGroup(keys, e.target.checked)} />}
                      label={<Typography sx={{ fontWeight: 700 }}>{t(group)}</Typography>} />
                    <Grid container sx={{ pl: 3 }}>
                      {list.map((p) => (
                        <Grid key={p.key} size={{ xs: 12, sm: 6 }}>
                          <FormControlLabel disabled={!editable}
                            control={<Checkbox size="small" checked={current.includes(p.key)} onChange={(e) => toggle(p.key, e.target.checked)} />}
                            label={<Typography variant="body2">{t(p.label)}</Typography>} />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )
              })}
            </Card>
          )}
        </Grid>
      </Grid>

      <Dialog open={newOpen} onClose={() => setNewOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{t('Yangi rol')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField size="small" label={t('Kalit (lotin, masalan: courier)')} value={nr.key} onChange={(e) => setNr({ ...nr, key: e.target.value.toLowerCase() })} />
          <TextField size="small" label={t('Nomi')} value={nr.name} onChange={(e) => setNr({ ...nr, name: e.target.value })} />
          <TextField size="small" label={t('Izoh')} value={nr.description} onChange={(e) => setNr({ ...nr, description: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button color="inherit" onClick={() => setNewOpen(false)}>{t('Bekor')}</Button>
          <Button variant="contained" disabled={!nr.key || !nr.name || busy}
            onClick={async () => { if (await run(() => api.post('/roles', { ...nr, description: nr.description || null, permissions: ['requests.view'] }), 'Saqlandi')) { setNewOpen(false); setNr({ key: '', name: '', description: '' }); reload() } }}>
            {t('Saqlash')}
          </Button>
        </DialogActions>
      </Dialog>
    </AnimatedPage>
  )
}
