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
import { fetchWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from './store/warehousesSlice'
import type { Warehouse } from '@/shared/types/catalog.types'
import { generateId } from '@/shared/utils/formatters'
import { reqStr, optStr } from '@/shared/utils/validation'
import type { TableColumn } from '@/shared/types/common.types'
import { useCatalog } from '../useCatalog'

const schema = z.object({ code: reqStr(), name: reqStr(2), address: optStr, manager: optStr, isActive: z.boolean() })
const FIELDS: FieldDef[] = [
  { name: 'code', label: 'Kod', xs: 4 }, { name: 'name', label: 'Nomi', xs: 8 },
  { name: 'address', label: 'Manzil', xs: 8 }, { name: 'manager', label: "Mas'ul", xs: 4 },
  { name: 'isActive', label: 'Faol', type: 'switch' },
]
const EMPTY = { code: '', name: '', address: '', manager: '', isActive: true }

export default function WarehousesPage() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const { items, loading } = useAppSelector((s) => s.warehouses)
  const canWrite = useCan('warehouses.manage')
  useEffect(() => { dispatch(fetchWarehouses()) }, [dispatch])

  const cat = useCatalog<Warehouse>({
    create: (d) => dispatch(createWarehouse({ id: generateId(), ...d, createdAt: new Date().toISOString() } as Warehouse)).unwrap(),
    update: (id, d) => dispatch(updateWarehouse({ id, data: d })).unwrap(),
    remove: (id) => dispatch(deleteWarehouse(id)).unwrap(),
  })

  const columns = useMemo<TableColumn<Warehouse>[]>(() => [
    { id: 'code', label: 'Kod', minWidth: 80 },
    { id: 'name', label: 'Nomi', minWidth: 200 },
    { id: 'address', label: 'Manzil', minWidth: 200 },
    { id: 'manager', label: "Mas'ul", minWidth: 150 },
    { id: 'isActive', label: 'Holat', minWidth: 80, format: (v) => <ActiveChip active={v} />, exportValue: (r) => (r.isActive ? t('Faol') : t('Nofaol')) },
  ], [t])
  const defaults = useMemo(() => (cat.editing ?? EMPTY) as unknown as Record<string, unknown>, [cat.editing])

  return (
    <AnimatedPage>
      <PageHeader title="Omborlar" subtitle={t('Jami: {{count}}', { count: items.length })}
        breadcrumbs={[{ label: 'Kataloglar' }, { label: 'Omborlar' }]}
        actions={canWrite && <Button variant="contained" startIcon={<Add />} onClick={cat.openCreate}>{t("Qo'shish")}</Button>}
      />
      <DataTable columns={columns} rows={items} loading={loading} searchable exportName="omborlar" searchPlaceholder="Ombor qidirish..."
        rowActions={canWrite ? (row) => <RowActions onEdit={() => cat.openEdit(row)} onDelete={() => cat.setDeleting(row)} /> : undefined} />
      <CrudDialog open={cat.open} title={cat.editing ? 'Tahrirlash' : 'Yangi ombor'} fields={FIELDS}
        schema={schema} defaultValues={defaults} onClose={cat.close} onSubmit={cat.submit} />
      <ConfirmDialog open={!!cat.deleting} message={t('"{{name}}" omborini o\'chirasizmi?', { name: cat.deleting?.name })}
        onConfirm={cat.confirmDelete} onClose={() => cat.setDeleting(null)} />
    </AnimatedPage>
  )
}
