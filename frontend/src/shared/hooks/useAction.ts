import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from '@/app/hooks'
import { notify } from '@/app/uiSlice'
import { operationError } from '@/shared/services/operations'

/** Runs an async operation, toasts success / error and tracks the busy state. */
export function useAction() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const run = async (fn: () => Promise<unknown>, okMessage: string) => {
    setBusy(true)
    try {
      await fn()
      dispatch(notify({ message: t(okMessage) }))
      return true
    } catch (e) {
      dispatch(notify({ message: operationError(e), severity: 'error' }))
      return false
    } finally {
      setBusy(false)
    }
  }
  return { busy, run }
}
