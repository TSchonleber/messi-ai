export type BountyCategory =
  | 'dev'
  | 'design'
  | 'content'
  | 'social'
  | 'research'
  | 'meme'
  | 'irl'
  | 'community'
  | 'translation'
  | 'data'

export type BountyStatus = 'fresh' | 'posted' | 'claimed' | 'expired'

export interface Bounty {
  id: string
  createdAt: string // ISO 8601
  title: string
  reward: string // display form, e.g. "$250"
  rewardUsd: number
  deadline: string // human form, e.g. "72 hours"
  task: string
  deliverables: string[]
  category: BountyCategory
  status: BountyStatus
}
