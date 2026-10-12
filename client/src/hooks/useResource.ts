import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../lib/api'

interface Settled<T> {
  requestKey: string | null
  dataKey: string | null
  data: T | null
  error: ApiError | null
}

const toApiError = (err: unknown) => (err instanceof ApiError ? err : new ApiError(0, (err as Error).message))

export function useResource<T>(loader: () => Promise<T>, key: string) {
  const loaderRef = useRef(loader)
  const [version, setVersion] = useState(0)
  const [settled, setSettled] = useState<Settled<T>>({ requestKey: null, dataKey: null, data: null, error: null })
  const requestKey = `${key}#${version}`

  useEffect(() => {
    loaderRef.current = loader
  })

  useEffect(() => {
    let cancelled = false
    loaderRef
      .current()
      .then((data) => {
        if (!cancelled) setSettled({ requestKey, dataKey: key, data, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled) setSettled((s) => ({ requestKey, dataKey: s.dataKey, data: s.data, error: toApiError(err) }))
      })
    return () => {
      cancelled = true
    }
  }, [requestKey, key])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  const setData = useCallback((data: T) => setSettled({ requestKey, dataKey: key, data, error: null }), [requestKey, key])

  return {
    data: settled.dataKey === key ? settled.data : null,
    error: settled.requestKey === requestKey ? settled.error : null,
    loading: settled.requestKey !== requestKey,
    reload,
    setData,
  }
}
