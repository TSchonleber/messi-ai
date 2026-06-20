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
  reward: string // display form, e.g. "2.5 SOL"
  rewardSol: number // numeric SOL amount, e.g. 2.5
  deadline: string // human form, e.g. "72 hours"
  task: string
  deliverables: string[]
  category: BountyCategory
  status: BountyStatus
  goUrl?: string // live pump.fun GO bounty link, once posted + funded
}
