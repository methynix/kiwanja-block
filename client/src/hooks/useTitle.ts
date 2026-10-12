import { useEffect } from 'react'

export function useTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · Kiwanja Block` : 'Kiwanja Block'
  }, [title])
}
