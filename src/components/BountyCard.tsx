import { useState } from 'react'
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

  const ended = countdown === 'ended'

  return (
    <article className="card">
      <div className="card-top">
        <span className={`tag t-${bounty.category}`}>{CATEGORY_LABEL[bounty.category]}</span>
        {isFresh(bounty.createdAt) && <span className="fresh-dot">● fresh</span>}
        <span className="reward">
          {bounty.rewardSol}
          <span className="unit"> SOL</span>
        </span>
      </div>

      <h3 className="card-title">{bounty.title}</h3>

      <div className="card-meta">
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

      <p className="card-task">{bounty.task}</p>

      <div className="card-proof">
        <span className="proof-label">Proof</span>
        <ul>
          {bounty.deliverables.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      </div>

      <div className="card-actions">
        <button className="btn sm ghost" onClick={copy}>
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
        <button className="btn sm" onClick={() => void postToBounty(bounty)}>
          Open in pump.fun GO ↗
        </button>
      </div>
    </article>
  )
}
