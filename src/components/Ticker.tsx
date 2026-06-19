import type { Bounty } from '../types'

/** Scrolling marquee of current bounties. */
export function Ticker({ items }: { items: Bounty[] }) {
  if (!items.length) return null
  const row = items.length < 6 ? [...items, ...items, ...items] : items
  const doubled = [...row, ...row]

  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {doubled.map((b, i) => (
          <span className="marquee-item" key={i}>
            <span className="rw">{b.reward}</span>
            {b.title}
            <span>⚽</span>
          </span>
        ))}
      </div>
    </div>
  )
}
