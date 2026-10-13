import { useMemo, useState } from 'react'
import {
  Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Switch, TextField,
} from '@mui/material'
import { Add } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import PageHeader from '@/shared/components/PageHeader/PageHeader'
import DataTable from '@/shared/components/DataTable/DataTable'
import ConfirmDialog from '@/shared/components/ConfirmDialog/ConfirmDialog'
import RowActions, { ActiveChip } from '@/shared/components/RowActions/RowActions'
import { useAppSelector, useCan } from '@/app/hooks'
import { useFetch } from '@/shared/hooks/useFetch'
import { useAction } from '@/shared/hooks/useAction'
import api from '@/lib/axios'
import { formatDate } from '@/shared/utils/formatters'
import type { TableColumn } from '@/shared/types/common.types'

interface Role { id: string; key: string; name: string }
interface User { id: string; username: string; fullName: string; phone: string | null; isActive: boolean; roleId: string; role: Role; createdAt: string }

const EMPTY = { username: '', fullName: '', phone: '', roleId: '', password: '', isActive: true }

export default function UsersPage() {
  const { t } = useTranslation()
  const me = useAppSelector((s) => s.auth.user)
  const canManage = useCan('users.manage')
  const { data: users, loading, reload } = useFetch<User[]>('/users')
  const { data: roles } = useFetch<Role[]>('/roles')
  const { busy, run } = useAction()
  const [editing, setEditing] = useState<User | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [deleting, setDeleting] = useState<User | null>(null)

  const assignable = (roles ?? []).filter((r) => r.key !== 'owner' || me?.roleKey === 'owner')
  const openForm = (u: User | null) => {
    setEditing(u)
    setForm(u ? { username: u.username, fullName: u.fullName, phone: u.phone ?? '', roleId: u.roleId, password: '', isActive: u.isActive } : EMPTY)
    setOpen(true)
  }
  const save = async () => {
    const body = editing
      ? { fullName: form.fullName, phone: form.phone || null, roleId: form.roleId, isActive: form.isActive, ...(form.password ? { password: form.password } : {}) }
      : { ...form, phone: form.phone || null }
    const ok = await run(() => (editing ? api.patch(`/users/${editing.id}`, body) : api.post('/users', body)), 'Saqlandi')
    if (ok) { setOpen(false); reload() }
  }

  const columns = useMemo<TableColumn<User>[]>(() => [
    { id: 'fullName', label: 'F.I.Sh.', minWidth: 180 },
    { id: 'username', label: 'Login', minWidth: 120 },
    { id: 'role', label: 'Rol', minWidth: 130, format: (_v, r) => <Chip size="small" color={r.role.key === 'owner' ? 'secondary' : 'default'} label={t(r.role.name)} />, exportValue: (r) => t(r.role.name) },
    { id: 'phone', label: 'Telefon', minWidth: 130 },
    { id: 'isActive', label: 'Holat', minWidth: 90, format: (v) => <ActiveChip active={v} />, exportValue: (r) => (r.isActive ? t('Faol') : t('Nofaol')) },
    { id: 'createdAt', label: 'Yaratilgan', minWidth: 100, format: (v) => formatDate(v as string), exportValue: (r) => formatDate(r.createdAt) },
  ], [t])

  const valid = form.fullName.trim() && form.roleId && (editing ? !form.password || form.password.length >= 8 : form.username.trim().length >= 3 && form.password.length >= 8)

  return (
    <AnimatedPage>
      <PageHeader title="Foydalanuvchilar" subtitle={t('Jami: {{count}}', { count: users?.length ?? 0 })}
        breadcrumbs={[{ label: 'Boshqaruv' }, { label: 'Foydalanuvchilar' }]}
        actions={canManage && <Button variant="contained" startIcon={<Add />} onClick={() => openForm(null)}>{t("Qo'shish")}</Button>} />
      <DataTable columns={columns} rows={users ?? []} loading={loading} searchable exportName="foydalanuvchilar"
        rowActions={canManage ? (u) => <RowActions onEdit={() => openForm(u)} onDelete={u.id !== me?.id ? () => setDeleting(u) : undefined} /> : undefined} />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? t('Tahrirlash') : t('Yangi foydalanuvchi')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField size="small" label="Login" value={form.username} disabled={!!editing} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <TextField size="small" label={t('F.I.Sh.')} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <TextField size="small" label={t('Telefon')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <TextField select size="small" label={t('Rol')} value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}>
            {assignable.map((r) => <MenuItem key={r.id} value={r.id}>{t(r.name)}</MenuItem>)}
          </TextField>
          <TextField size="small" type="password" autoComplete="new-password"
            label={editing ? t("Yangi parol (o'zgartirish uchun)") : t('Parol')} value={form.password}
            helperText={t('Kamida 8 ta belgi')} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <FormControlLabel control={<Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />} label={t('Faol')} />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setOpen(false)} variant="outlined" color="inherit">{t('Bekor')}</Button>
          <Button onClick={save} variant="contained" disabled={!valid || busy}>{t('Saqlash')}</Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog open={!!deleting} message={t('"{{name}}" ni o\'chirasizmi?', { name: deleting?.fullName })} onClose={() => setDeleting(null)}
        onConfirm={async () => { if (deleting && (await run(() => api.delete(`/users/${deleting.id}`), "O'chirildi"))) reload(); setDeleting(null) }} />
    </AnimatedPage>
  )
}
