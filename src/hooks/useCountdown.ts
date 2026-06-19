import { useEffect, useState } from 'react'

/** Live "Xd Yh Zm" countdown to an absolute expiry (ms). Ticks every second. */
export function useCountdown(expiry: number | null): string | null {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (expiry == null) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [expiry])

  if (expiry == null) return null
  const diff = expiry - now
  if (diff <= 0) return 'ended'

  const d = Math.floor(diff / 86_400_000)
  const h = Math.floor((diff % 86_400_000) / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const s = Math.floor((diff % 60_000) / 1000)
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m ${s}s`
  return `${m}m ${s}s`
}
