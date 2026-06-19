import { useState, type MouseEvent } from 'react'
import type { Bounty } from '../types'
import {
  CATEGORY_LABEL,
  formatForCopy,
  postToBounty,
  timeAgo,
  isFresh,
  deadlineExpiry,
} from '../lib/bounties'
import { useCountdown } from '../hooks/useCountdown'

export function BountyCard({ bounty }: { bounty: Bounty }) {
  const [copied, setCopied] = useState(false)
  const countdown = useCountdown(deadlineExpiry(bounty.deadline, bounty.createdAt))

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(formatForCopy(bounty))
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard blocked */
    }
  }

  // cursor-tracking glow
  const onMove = (e: MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`)
    e.currentTarget.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`)
  }

  const ended = countdown === 'ended'

  return (
    <article className="bounty-card" onMouseMove={onMove}>
      <div className="bounty-top">
        <span className={`cat cat-${bounty.category}`}>{CATEGORY_LABEL[bounty.category]}</span>
        {isFresh(bounty.createdAt) && <span className="fresh-dot">● fresh drop</span>}
        <span className="reward">{bounty.reward}</span>
      </div>

      <h3 className="bounty-title">{bounty.title}</h3>

      <div className="bounty-meta">
        {countdown ? (
          <span className={`countdown ${ended ? 'ended' : ''}`}>
            {ended ? '⛔ ended' : `⏳ ${countdown} left`}
          </span>
        ) : (
          <span>⏳ {bounty.deadline}</span>
        )}
        <span>·</span>
        <span>dropped {timeAgo(bounty.createdAt)}</span>
      </div>

      <p className="bounty-task">{bounty.task}</p>

      <div className="bounty-proof">
        <span className="proof-label">Proof</span>
        <ul>
          {bounty.deliverables.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      </div>

      <div className="bounty-actions">
        <button className="btn-ghost" onClick={copy}>
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
        <button className="btn-primary sm" onClick={() => void postToBounty(bounty)}>
          Open in pump.fun GO ↗
        </button>
      </div>
    </article>
  )
}
