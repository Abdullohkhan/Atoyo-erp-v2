import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from '@/app/hooks'
import { notify } from '@/app/uiSlice'

/** Shared create / edit / delete dialog state and handlers for catalog pages. */
export function useCatalog<T extends { id: string }>(opts: {
  create: (data: Record<string, unknown>) => Promise<unknown>
  update: (id: string, data: Record<string, unknown>) => Promise<unknown>
  remove: (id: string) => Promise<unknown>
}) {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<T | null>(null)
  const [deleting, setDeleting] = useState<T | null>(null)

  const run = async (fn: () => Promise<unknown>, okMsg: string) => {
    try {
      await fn()
      dispatch(notify({ message: t(okMsg) }))
      return true
    } catch (e) {
      dispatch(notify({ message: e instanceof Error ? e.message : t('Xatolik yuz berdi'), severity: 'error' }))
      return false
    }
  }

  return {
    open, editing, deleting, setDeleting,
    openCreate: () => { setEditing(null); setOpen(true) },
    openEdit: (row: T) => { setEditing(row); setOpen(true) },
    close: () => setOpen(false),
    submit: async (data: Record<string, unknown>) => {
      const ok = await run(() => (editing ? opts.update(editing.id, data) : opts.create(data)), 'Saqlandi')
      if (ok) setOpen(false)
    },
    confirmDelete: async () => {
      if (!deleting) return
      await run(() => opts.remove(deleting.id), "O'chirildi")
      setDeleting(null)
    },
  }
}
