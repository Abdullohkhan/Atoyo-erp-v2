import { Button, Box, Avatar } from '@mui/material'
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
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee } from './store/employeesSlice'
import type { Employee } from '@/shared/types/catalog.types'
import { formatCurrency, generateId, getInitials, formatDate } from '@/shared/utils/formatters'
import { reqStr, phone, money } from '@/shared/utils/validation'
import type { TableColumn } from '@/shared/types/common.types'
import { useCatalog } from '../useCatalog'

const schema = z.object({
  code: reqStr(), fullName: reqStr(2), position: reqStr(), department: reqStr(),
  phone, salary: money, hireDate: reqStr(),
})
const FIELDS: FieldDef[] = [
  { name: 'code', label: 'Kod', xs: 4 }, { name: 'fullName', label: "To'liq ismi", xs: 8 },
  { name: 'position', label: 'Lavozim', xs: 6 }, { name: 'department', label: "Bo'lim", xs: 6 },
  { name: 'phone', label: 'Telefon', xs: 6 }, { name: 'salary', label: 'Maosh', xs: 6, type: 'number' },
  { name: 'hireDate', label: 'Ishga kirgan sana', xs: 6, type: 'date' },
]
const EMPTY = { code: '', fullName: '', position: '', department: '', phone: '', salary: 0, hireDate: new Date().toISOString().slice(0, 10) }

export default function EmployeesPage() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const { items, loading } = useAppSelector((s) => s.employees)
  const canWrite = useCan('employees.write')
  useEffect(() => { dispatch(fetchEmployees()) }, [dispatch])

  const cat = useCatalog<Employee>({
    create: (d) => dispatch(createEmployee({ id: generateId(), ...d, isActive: true, createdAt: new Date().toISOString() } as Employee)).unwrap(),
    update: (id, d) => dispatch(updateEmployee({ id, data: d })).unwrap(),
    remove: (id) => dispatch(deleteEmployee(id)).unwrap(),
  })

  const columns = useMemo<TableColumn<Employee>[]>(() => [
    { id: 'fullName', label: 'Xodim', minWidth: 200,
      format: (v) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', bgcolor: 'primary.main' }}>{getInitials(v as string)}</Avatar>
          {v as string}
        </Box>
      ) },
    { id: 'position', label: 'Lavozim', minWidth: 140 },
    { id: 'department', label: "Bo'lim", minWidth: 120 },
    { id: 'phone', label: 'Telefon', minWidth: 130 },
    { id: 'salary', label: 'Maosh', minWidth: 120, align: 'right', format: (v) => formatCurrency(v as number) },
    { id: 'hireDate', label: 'Ishga kirgan sana', minWidth: 120, format: (v) => formatDate(v as string) },
    { id: 'isActive', label: 'Holat', minWidth: 80, format: (v) => <ActiveChip active={v} />, exportValue: (r) => (r.isActive ? t('Faol') : t('Nofaol')) },
  ], [t])
  const defaults = useMemo(() => (cat.editing ?? EMPTY) as unknown as Record<string, unknown>, [cat.editing])

  return (
    <AnimatedPage>
      <PageHeader title="Xodimlar" subtitle={t('Jami: {{count}}', { count: items.length })}
        breadcrumbs={[{ label: 'Kataloglar' }, { label: 'Xodimlar' }]}
        actions={canWrite && <Button variant="contained" startIcon={<Add />} onClick={cat.openCreate}>{t("Qo'shish")}</Button>}
      />
      <DataTable columns={columns} rows={items} loading={loading} searchable exportName="xodimlar" searchPlaceholder="Xodim qidirish..."
        rowActions={canWrite ? (row) => <RowActions onEdit={() => cat.openEdit(row)} onDelete={() => cat.setDeleting(row)} /> : undefined} />
      <CrudDialog open={cat.open} title={cat.editing ? 'Tahrirlash' : 'Yangi xodim'} fields={FIELDS}
        schema={schema} defaultValues={defaults} onClose={cat.close} onSubmit={cat.submit} />
      <ConfirmDialog open={!!cat.deleting} message={t('"{{name}}" xodimini o\'chirasizmi?', { name: cat.deleting?.fullName })}
        onConfirm={cat.confirmDelete} onClose={() => cat.setDeleting(null)} />
    </AnimatedPage>
  )
}
