import { useEffect, useMemo, useState } from 'react'
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Tab, Tabs, TextField, Tooltip, Typography,
} from '@mui/material'
import { Add, ErrorOutlined } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import PageHeader from '@/shared/components/PageHeader/PageHeader'
import DataTable from '@/shared/components/DataTable/DataTable'
import { useAppDispatch, useAppSelector, useCan } from '@/app/hooks'
import { fetchCustomers } from '@/features/catalogs/customers/store/customersSlice'
import { useFetch } from '@/shared/hooks/useFetch'
import { useAction } from '@/shared/hooks/useAction'
import api from '@/lib/axios'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import type { TableColumn } from '@/shared/types/common.types'
import { REQUEST_KINDS, STATUS_INFO, type RequestRow } from './types'

export function RequestStatusChip({ status }: { status: RequestRow['status'] }) {
  const { t } = useTranslation()
  const info = STATUS_INFO[status]
  return <Chip size="small" color={info.color} label={t(info.short)} sx={{ fontWeight: 600, borderRadius: 1 }} />
}

type TabKey = 'mine' | 'active' | 'done' | 'all'

export default function RequestsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const me = useAppSelector((s) => s.auth.user)
  const customers = useAppSelector((s) => s.customers.items)
  const canCreate = useCan('requests.create')
  const { data, loading } = useFetch<RequestRow[]>('/requests')
  const { busy, run } = useAction()
  const [tab, setTab] = useState<TabKey>('mine')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ customerId: '', title: '', kind: 'assembly', description: '', deadline: '' })

  useEffect(() => { if (canCreate) dispatch(fetchCustomers()) }, [dispatch, canCreate])

  const rows = useMemo(() => {
    const all = data ?? []
    const mine = (r: RequestRow) => {
      const perm = STATUS_INFO[r.status].perm
      return r.createdById === me?.id || r.assigneeId === me?.id || (!!perm && !!me?.permissions.includes(perm as never) && me.roleKey !== 'owner')
    }
    const final = (r: RequestRow) => r.status === 'COMPLETED' || r.status === 'CANCELLED'
    return {
      mine: all.filter((r) => !final(r) && mine(r)),
      active: all.filter((r) => !final(r)),
      done: all.filter(final),
      all,
    }
  }, [data, me])

  const columns = useMemo<TableColumn<RequestRow>[]>(() => [
    { id: 'number', label: 'Raqam', minWidth: 110 },
    { id: 'title', label: 'Zayavka', minWidth: 220,
      format: (v, r) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{v as string}</Typography>
          <Typography variant="caption" color="text.secondary">{t(REQUEST_KINDS[r.kind] ?? r.kind)}</Typography>
        </Box>
      ),
      exportValue: (r) => r.title },
    { id: 'customerName', label: 'Mijoz', minWidth: 160 },
    { id: 'status', label: 'Bosqich', minWidth: 140, format: (v) => <RequestStatusChip status={v as RequestRow['status']} />, exportValue: (r) => t(STATUS_INFO[r.status].label) },
    { id: 'itemCount', label: 'Qatorlar', minWidth: 90, align: 'center',
      format: (v, r) => (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
          {v as number}
          {r.missingCount > 0 && <Tooltip title={t("Katalogda yo'q: {{count}}", { count: r.missingCount })}><ErrorOutlined color="error" fontSize="small" /></Tooltip>}
        </Box>
      ) },
    ...(data?.some((r) => r.totalPrice !== undefined)
      ? [{ id: 'totalPrice', label: 'Summa', minWidth: 130, align: 'right' as const, format: (v: unknown) => (v ? formatCurrency(v as number) : '—') }]
      : []),
    { id: 'deadline', label: 'Muddat', minWidth: 100, format: (v) => (v ? formatDate(v as string) : '—'), exportValue: (r) => (r.deadline ? formatDate(r.deadline) : '') },
    { id: 'updatedAt', label: "O'zgargan", minWidth: 100, format: (v) => formatDate(v as string), exportValue: (r) => formatDate(r.updatedAt) },
  ], [t, data])

  const create = async () => {
    let id = ''
    const ok = await run(async () => {
      const { data: r } = await api.post('/requests', { ...form, description: form.description || null, deadline: form.deadline || null })
      id = r.id
    }, 'Zayavka yaratildi')
    if (ok) { setOpen(false); navigate(`/requests/${id}`) }
  }

  return (
    <AnimatedPage>
      <PageHeader title="Zayavkalar" subtitle={t('Jami: {{count}}', { count: data?.length ?? 0 })}
        breadcrumbs={[{ label: 'CRM' }, { label: 'Zayavkalar' }]}
        actions={canCreate && <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>{t('Yangi zayavka')}</Button>}
      />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile sx={{ mb: 2 }}>
        <Tab value="mine" label={`${t('Menga tegishli')} (${rows.mine.length})`} />
        <Tab value="active" label={`${t('Jarayonda')} (${rows.active.length})`} />
        <Tab value="done" label={`${t('Yopilgan')} (${rows.done.length})`} />
        <Tab value="all" label={`${t('Barchasi')} (${rows.all.length})`} />
      </Tabs>
      <DataTable columns={columns} rows={rows[tab]} loading={loading} searchable exportName="zayavkalar"
        searchPlaceholder="Zayavka qidirish..." onRowClick={(r) => navigate(`/requests/${r.id}`)} />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{t('Yangi zayavka')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField select size="small" label={`${t('Mijoz')} *`} value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
            {customers.map((c) => <MenuItem key={c.id} value={c.id}>{c.name} · {c.phone}</MenuItem>)}
          </TextField>
          <TextField size="small" label={`${t('Nima kerak')} *`} placeholder={t('Masalan: Dell, SSD 1TB, RAM 32GB')}
            value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <TextField select size="small" label={t('Turi')} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
            {Object.entries(REQUEST_KINDS).map(([k, v]) => <MenuItem key={k} value={k}>{t(v)}</MenuItem>)}
          </TextField>
          <TextField size="small" multiline minRows={3} label={t('Izoh')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <TextField size="small" type="date" label={t('Muddat')} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setOpen(false)} variant="outlined" color="inherit">{t('Bekor')}</Button>
          <Button onClick={create} variant="contained" disabled={busy || !form.customerId || !form.title.trim()}>{t('Saqlash')}</Button>
        </DialogActions>
      </Dialog>
    </AnimatedPage>
  )
}
