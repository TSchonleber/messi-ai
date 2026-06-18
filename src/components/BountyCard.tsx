import { useState } from 'react'
import type { Bounty } from '../types'
import {
  CATEGORY_LABEL,
  formatForCopy,
  postToBounty,
  timeAgo,
  isFresh,
} from '../lib/bounties'

export function BountyCard({ bounty }: { bounty: Bounty }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(formatForCopy(bounty))
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <article className="bounty-card">
      <div className="bounty-top">
        <span className={`cat cat-${bounty.category}`}>
          {CATEGORY_LABEL[bounty.category]}
        </span>
        {isFresh(bounty.createdAt) && <span className="fresh-dot">● fresh drop</span>}
        <span className="reward">{bounty.reward}</span>
      </div>

      <h3 className="bounty-title">{bounty.title}</h3>

      <div className="bounty-meta">
        <span>⏳ {bounty.deadline}</span>
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
