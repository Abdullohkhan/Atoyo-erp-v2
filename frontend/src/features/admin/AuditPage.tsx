import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import AnimatedPage from '@/shared/components/AnimatedPage/AnimatedPage'
import PageHeader from '@/shared/components/PageHeader/PageHeader'
import DataTable from '@/shared/components/DataTable/DataTable'
import { useFetch } from '@/shared/hooks/useFetch'
import { formatDateTime } from '@/shared/utils/formatters'
import type { TableColumn } from '@/shared/types/common.types'

interface Log { id: string; userName: string | null; action: string; entity: string; entityId: string | null; data: unknown; createdAt: string }

export default function AuditPage() {
  const { t } = useTranslation()
  const { data, loading } = useFetch<Log[]>('/audit')
  const columns = useMemo<TableColumn<Log>[]>(() => [
    { id: 'createdAt', label: 'Vaqt', minWidth: 150, format: (v) => formatDateTime(v as string), exportValue: (r) => formatDateTime(r.createdAt) },
    { id: 'userName', label: 'Foydalanuvchi', minWidth: 150 },
    { id: 'action', label: 'Amal', minWidth: 90 },
    { id: 'entity', label: "Ob'ekt", minWidth: 120 },
    { id: 'data', label: "Ma'lumot", minWidth: 260, format: (v) => <code style={{ fontSize: 11 }}>{v ? JSON.stringify(v).slice(0, 160) : ''}</code>, exportValue: (r) => JSON.stringify(r.data ?? '') },
  ], [])
  return (
    <AnimatedPage>
      <PageHeader title="Audit jurnali" subtitle={t("Oxirgi 500 ta amal")} breadcrumbs={[{ label: 'Boshqaruv' }, { label: 'Audit' }]} />
      <DataTable columns={columns} rows={data ?? []} loading={loading} searchable exportName="audit" />
    </AnimatedPage>
  )
}
