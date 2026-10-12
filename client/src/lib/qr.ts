export function plotIdFromQr(text: string): { plotId: string; hash: string | null } | null {
  try {
    const url = new URL(text)
    const match = /\/verify\/plot\/([^/]+)$/.exec(url.pathname)
    if (!match) return null
    return { plotId: decodeURIComponent(match[1]), hash: url.searchParams.get('h') }
  } catch {
    return /^plot_[0-9a-f-]{36}$/.test(text) ? { plotId: text, hash: null } : null
  }
}
