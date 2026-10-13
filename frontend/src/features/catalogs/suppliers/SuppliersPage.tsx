import { Button } from '@mui/material'
import { Add } from '@mui/icons-material'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import PageHeader from '@/shared/components/PageHeader/PageHeader'
import DataTable from '@/shared/components/DataTable/DataTable'
import ConfirmDialog from '@/shared/components/ConfirmDialog/ConfirmDialog'
import CrudDialog, { type FieldDef } from '@/shared/components/CrudDialog/CrudDialog'
import RowActions, { ActiveChip } from '@/shared/components/RowActions/RowActions'
import { useAppDispatch, useAppSelector, useCan } from '@/app/hooks'
import { fetchSuppliers, createSupplier, updateSupplier, deleteSupplier } from './store/suppliersSlice'
import type { Supplier } from '@/shared/types/catalog.types'
import { formatCurrency, generateId } from '@/shared/utils/formatters'
import { reqStr, phone, optEmail, optStr } from '@/shared/utils/validation'
import type { TableColumn } from '@/shared/types/common.types'
import { useCatalog } from '../useCatalog'

const schema = z.object({ code: reqStr(), name: reqStr(2), phone, email: optEmail, address: optStr, inn: optStr })

const FIELDS: FieldDef[] = [
  { name: 'code', label: 'Kod', xs: 4 }, { name: 'name', label: 'Nomi', xs: 8 },
  { name: 'phone', label: 'Telefon', xs: 6 }, { name: 'email', label: 'Email', xs: 6 },
  { name: 'address', label: 'Manzil', xs: 8 }, { name: 'inn', label: 'INN', xs: 4 },
]
const EMPTY = { code: '', name: '', phone: '', email: '', address: '', inn: '' }

export default function SuppliersPage() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const { items, loading } = useAppSelector((s) => s.suppliers)
  const canWrite = useCan('suppliers.manage')
  useEffect(() => { dispatch(fetchSuppliers()) }, [dispatch])

  const cat = useCatalog<Supplier>({
    create: (d) => dispatch(createSupplier({ id: generateId(), ...d, balance: 0, totalSupplied: 0, isActive: true, createdAt: new Date().toISOString() } as Supplier)).unwrap(),
    update: (id, d) => dispatch(updateSupplier({ id, data: d })).unwrap(),
    remove: (id) => dispatch(deleteSupplier(id)).unwrap(),
  })

  const columns = useMemo<TableColumn<Supplier>[]>(() => [
    { id: 'code', label: 'Kod', minWidth: 80 },
    { id: 'name', label: 'Nomi', minWidth: 200 },
    { id: 'phone', label: 'Telefon', minWidth: 130 },
    { id: 'inn', label: 'INN', minWidth: 110 },
    { id: 'balance', label: 'Balans', minWidth: 130, align: 'right', format: (v) => formatCurrency(v as number) },
    { id: 'isActive', label: 'Holat', minWidth: 80, format: (v) => <ActiveChip active={v} />, exportValue: (r) => (r.isActive ? t('Faol') : t('Nofaol')) },
  ], [t])
  const defaults = useMemo(() => (cat.editing ?? EMPTY) as unknown as Record<string, unknown>, [cat.editing])

  return (
    <AnimatedPage>
      <PageHeader title="Yetkazuvchilar" subtitle={t('Jami: {{count}}', { count: items.length })}
        breadcrumbs={[{ label: 'Kataloglar' }, { label: 'Yetkazuvchilar' }]}
        actions={canWrite && <Button variant="contained" startIcon={<Add />} onClick={cat.openCreate}>{t("Qo'shish")}</Button>}
      />
      <DataTable columns={columns} rows={items} loading={loading} searchable exportName="yetkazuvchilar" searchPlaceholder="Yetkazuvchi qidirish..."
        rowActions={canWrite ? (row) => <RowActions onEdit={() => cat.openEdit(row)} onDelete={() => cat.setDeleting(row)} /> : undefined} />
      <CrudDialog open={cat.open} title={cat.editing ? 'Tahrirlash' : 'Yangi yetkazuvchi'} fields={FIELDS}
        schema={schema} defaultValues={defaults} onClose={cat.close} onSubmit={cat.submit} />
      <ConfirmDialog open={!!cat.deleting} message={t('"{{name}}" ni o\'chirasizmi?', { name: cat.deleting?.name })}
        onConfirm={cat.confirmDelete} onClose={() => cat.setDeleting(null)} />
    </AnimatedPage>
  )
}
