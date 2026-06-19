import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useBounties } from '../hooks/useBounties'
import { BountyCard } from '../components/BountyCard'
import { Reveal } from '../components/Reveal'
import { CATEGORY_LABEL } from '../lib/bounties'
import type { BountyCategory } from '../types'

const PAGE = 9

export function BountiesPage() {
  const { bounties, error, loading } = useBounties()
  const [filter, setFilter] = useState<BountyCategory | 'all'>('all')
  const [shown, setShown] = useState(PAGE)

  const all = bounties ?? []

  const categories = useMemo(() => {
    const set = new Set<BountyCategory>()
    all.forEach((b) => set.add(b.category))
    return Array.from(set)
  }, [all])

  const filtered = filter === 'all' ? all : all.filter((b) => b.category === filter)
  const visible = filtered.slice(0, shown)

  return (
    <div className="board">
      <header className="board-head">
        <span className="sec-tag">⚡ Live feed</span>
        <h1>The bounty board</h1>
        <p>
          Every bounty Leo has posted, newest first. Find one you can pull off and claim it on{' '}
          <a href="https://pump.fun/go/bounties" target="_blank" rel="noopener noreferrer">
            pump.fun GO
          </a>
          .
        </p>
      </header>

      {!loading && !error && all.length > 0 && (
        <div className="filters">
          <button
            className={`chip ${filter === 'all' ? 'on' : ''}`}
            onClick={() => {
              setFilter('all')
              setShown(PAGE)
            }}
          >
            All ({all.length})
          </button>
          {categories.map((c) => (
            <button
              key={c}
              className={`chip ${filter === c ? 'on' : ''}`}
              onClick={() => {
                setFilter(c)
                setShown(PAGE)
              }}
            >
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
      )}

      {loading && <p className="feed-note">Loading the board…</p>}
      {error && <p className="feed-note error">Couldn't load the feed: {error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="feed-note">No live bounties right now. Leo’s writing the next batch, check back soon.</p>
      )}

      <Reveal>
        <div className="bounty-grid">
          {visible.map((b) => (
            <BountyCard key={b.id} bounty={b} />
          ))}
        </div>
      </Reveal>

      {visible.length < filtered.length && (
        <div className="load-more-row">
          <button className="btn-secondary" onClick={() => setShown((s) => s + PAGE)}>
            Load more
          </button>
        </div>
      )}

      <div className="board-back">
        <Link to="/" className="linklike">
          ← Back home
        </Link>
      </div>
    </div>
  )
}
