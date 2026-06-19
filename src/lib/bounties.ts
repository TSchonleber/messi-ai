import type { Bounty } from '../types'

/** Load the live feed Leo commits to the repo on each scheduled drop. */
export async function fetchBounties(): Promise<Bounty[]> {
  const res = await fetch('/bounties.json', { cache: 'no-store' })
  if (!res.ok) throw new Error(`Could not load the bounty feed (${res.status})`)
  const data: unknown = await res.json()
  if (!Array.isArray(data)) throw new Error('The bounty feed is malformed')
  return (data as Bounty[])
    .slice()
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
}

/** The exact text an operator pastes into pump.fun GO's create form. */
export function formatForCopy(b: Bounty): string {
  return [
    `Title: ${b.title}`,
    `Reward: ${b.reward}`,
    `Deadline: ${b.deadline}`,
    `Task: ${b.task}`,
    `Deliverables / proof:`,
    ...b.deliverables.map((d) => `- ${d}`),
  ].join('\n')
}

const PUMP_FUN_GO_CREATE = 'https://pump.fun/go/bounties'

/**
 * Posting adapter seam. pump.fun GO has no documented programmatic create API and
 * no prefill query params, so today this copies the post-ready text to the clipboard
 * and opens the create page for the operator to paste, fund escrow, and submit.
 *
 * The day a trustworthy official API exists, swap the body of this one function for
 * a real call — every caller stays untouched.
 */
export async function postToBounty(b: Bounty): Promise<void> {
  try {
    await navigator.clipboard?.writeText(formatForCopy(b))
  } catch {
    /* clipboard may be blocked; opening the page is still useful */
  }
  window.open(PUMP_FUN_GO_CREATE, '_blank', 'noopener,noreferrer')
}

export const CATEGORY_LABEL: Record<Bounty['category'], string> = {
  dev: 'Dev',
  design: 'Design',
  content: 'Content',
  social: 'Social',
  research: 'Research',
  meme: 'Meme',
  irl: 'IRL',
  community: 'Community',
  translation: 'Translation',
  data: 'Data',
}

export function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - +new Date(iso)) / 60000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

export function isFresh(iso: string): boolean {
  return Date.now() - +new Date(iso) < 24 * 60 * 60 * 1000
}

const UNIT_MS: Record<string, number> = {
  min: 60_000,
  minute: 60_000,
  hr: 3_600_000,
  hour: 3_600_000,
  day: 86_400_000,
  week: 604_800_000,
}

/** Best-effort absolute expiry from a relative deadline string ("72 hours", "5 days"). */
export function deadlineExpiry(deadline: string, createdAt: string): number | null {
  const m = deadline.match(/(\d+(?:\.\d+)?)\s*(min|minute|hour|hr|day|week)s?/i)
  if (!m) return null
  const unit = UNIT_MS[m[2].toLowerCase()]
  if (!unit) return null
  return +new Date(createdAt) + parseFloat(m[1]) * unit
}
