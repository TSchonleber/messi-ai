import { useEffect, useState } from 'react'
import type { Bounty } from '../types'
import { fetchBounties } from '../lib/bounties'

export function useBounties() {
  const [bounties, setBounties] = useState<Bounty[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    fetchBounties()
      .then((b) => alive && setBounties(b))
      .catch((e) => alive && setError(e instanceof Error ? e.message : 'Failed to load'))
    return () => {
      alive = false
    }
  }, [])

  return { bounties, error, loading: bounties === null && error === null }
}
