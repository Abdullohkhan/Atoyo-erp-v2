import { useCallback, useEffect, useState } from 'react'
import api from '@/lib/axios'

/** Small data loader for pages that do not need a Redux slice. */
export function useFetch<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(!!url)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!url) return
    let alive = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    api.get<T>(url)
      .then((r) => { if (alive) { setData(r.data); setError(null) } })
      .catch((e: Error) => { if (alive) setError(e.message) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [url, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data, setData, loading, error, reload }
}
