import { Button, IconButton, Tooltip, Chip, Typography, Avatar, Box } from '@mui/material'
import { Add, OpenInNew } from '@mui/icons-material'
import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import PageHeader from '@/shared/components/PageHeader/PageHeader'
import DataTable from '@/shared/components/DataTable/DataTable'
import ConfirmDialog from '@/shared/components/ConfirmDialog/ConfirmDialog'
import CrudDialog, { type FieldDef } from '@/shared/components/CrudDialog/CrudDialog'
import RowActions, { ActiveChip } from '@/shared/components/RowActions/RowActions'
import { useAppDispatch, useAppSelector, useCan } from '@/app/hooks'
import { fetchCustomers, createCustomer, updateCustomer, deleteCustomer } from './store/customersSlice'
import type { Customer } from '@/shared/types/catalog.types'
import { formatCurrency, generateId, getInitials } from '@/shared/utils/formatters'
import { reqStr, phone, optEmail, optStr } from '@/shared/utils/validation'
import type { TableColumn } from '@/shared/types/common.types'
import { useCatalog } from '../useCatalog'

const schema = z.object({ code: reqStr(), name: reqStr(2), phone, email: optEmail, address: optStr, inn: optStr })
const FIELDS: FieldDef[] = [
  { name: 'code', label: 'Kod', xs: 4 }, { name: 'name', label: "To'liq ismi", xs: 8 },
  { name: 'phone', label: 'Telefon', xs: 6 }, { name: 'email', label: 'Email', xs: 6 },
  { name: 'address', label: "Do'kon manzili", xs: 8 }, { name: 'inn', label: 'INN', xs: 4 },
]
const EMPTY = { code: '', name: '', phone: '', email: '', address: '', inn: '' }

export default function CustomersPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { items, loading } = useAppSelector((s) => s.customers)
  const canWrite = useCan('customers.manage')
  useEffect(() => { dispatch(fetchCustomers()) }, [dispatch])

  const cat = useCatalog<Customer>({
    create: (d) => dispatch(createCustomer({ id: generateId(), ...d, debt: 0, totalPurchases: 0, isActive: true, createdAt: new Date().toISOString() } as Customer)).unwrap(),
    update: (id, d) => dispatch(updateCustomer({ id, data: d })).unwrap(),
    remove: (id) => dispatch(deleteCustomer(id)).unwrap(),
  })

  const columns = useMemo<TableColumn<Customer>[]>(() => [
    { id: 'name', label: 'Mijoz', minWidth: 200,
      format: (v) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', bgcolor: 'primary.main', borderRadius: 1.5 }}>{getInitials(v as string)}</Avatar>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{v as string}</Typography>
        </Box>
      ) },
    { id: 'phone', label: 'Telefon', minWidth: 140 },
    { id: 'address', label: 'Manzil', minWidth: 180 },
    { id: 'debt', label: 'Qarz / Balans', minWidth: 150, align: 'right',
      format: (v) => <Chip label={formatCurrency(v as number)} color={(v as number) > 0 ? 'error' : 'success'} size="small" sx={{ fontWeight: 700, borderRadius: 1 }} /> },
    { id: 'totalPurchases', label: 'Jami xarid', minWidth: 140, align: 'right', format: (v) => formatCurrency(v as number) },
    { id: 'isActive', label: 'Holat', minWidth: 80, format: (v) => <ActiveChip active={v} />, exportValue: (r) => (r.isActive ? t('Faol') : t('Nofaol')) },
  ], [t])
  const defaults = useMemo(() => (cat.editing ?? EMPTY) as unknown as Record<string, unknown>, [cat.editing])

  return (
    <AnimatedPage>
      <PageHeader title="Mijozlar" subtitle={t('Jami: {{count}} ta mijoz', { count: items.length })}
        breadcrumbs={[{ label: 'Kataloglar' }, { label: 'Mijozlar' }]}
        actions={canWrite && <Button variant="contained" startIcon={<Add />} onClick={cat.openCreate}>{t('Yangi mijoz')}</Button>}
      />
      <DataTable columns={columns} rows={items} loading={loading} searchable exportName="mijozlar"
        searchPlaceholder="Mijoz qidirish (ism, telefon)..."
        onRowClick={(row) => navigate(`/catalogs/customers/${row.id}`)}
        rowActions={(row) => (
          <RowActions onEdit={canWrite ? () => cat.openEdit(row) : undefined} onDelete={canWrite ? () => cat.setDeleting(row) : undefined}>
            <Tooltip title={t('Batafsil')}><IconButton size="small" color="primary" onClick={() => navigate(`/catalogs/customers/${row.id}`)}><OpenInNew fontSize="small" /></IconButton></Tooltip>
          </RowActions>
        )} />
      <CrudDialog open={cat.open} title={cat.editing ? 'Mijozni tahrirlash' : "Yangi mijoz qo'shish"} fields={FIELDS}
        schema={schema} defaultValues={defaults} onClose={cat.close} onSubmit={cat.submit} />
      <ConfirmDialog open={!!cat.deleting} message={t('"{{name}}" mijozini o\'chirasizmi?', { name: cat.deleting?.name })}
        onConfirm={cat.confirmDelete} onClose={() => cat.setDeleting(null)} />
    </AnimatedPage>
  )
}
