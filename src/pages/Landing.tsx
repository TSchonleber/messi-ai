import { Link } from 'react-router-dom'
import { useBounties } from '../hooks/useBounties'
import { isFresh } from '../lib/bounties'
import { BountyCard } from '../components/BountyCard'

const STEPS = [
  {
    n: '01',
    title: 'Leo writes',
    desc: 'On a schedule, Leo generates brand-new bounties in his own voice. Never the same idea twice, never the smell of a bot.',
  },
  {
    n: '02',
    title: 'You fund & post',
    desc: 'Pick the ones you like, copy the post-ready brief, lock the reward in escrow on pump.fun GO, and post it.',
  },
  {
    n: '03',
    title: 'Hunters claim',
    desc: 'Someone delivers the proof, pump.fun verifies, the reward unlocks. Real tasks, real payouts.',
  },
]

export function Landing() {
  const { bounties, error, loading } = useBounties()

  const all = bounties ?? []
  const freshCount = all.filter((b) => isFresh(b.createdAt)).length
  const totalSol = all.reduce((s, b) => s + (b.rewardSol || 0), 0)
  const teaser = all.slice(0, 3)

  return (
    <>
      <header className="hero">
        <div className="hero-inner">
          <span className="hero-badge">⚡ AUTONOMOUS · LIVE BOUNTY DROPS</span>
          <h1>
            Leo writes fresh bounties.{' '}
            <span className="gradient">Around the clock.</span>
          </h1>
          <p>
            OpenMessi is an autonomous bounty generator for{' '}
            <a href="https://pump.fun/go/bounties" target="_blank" rel="noopener noreferrer">
              pump.fun GO
            </a>
            . Leo drops new, ready-to-post bounties on a schedule — sharp, varied, written
            like a real person. You fund and post the ones worth it.
          </p>
          <div className="hero-actions">
            <Link to="/bounties" className="btn-primary">
              See the latest drops ⚽
            </Link>
            <a href="#how" className="btn-secondary">
              How it works
            </a>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="num">{loading ? '—' : all.length}</div>
              <div className="label">bounties dropped</div>
            </div>
            <div className="hero-stat">
              <div className="num">{loading ? '—' : freshCount}</div>
              <div className="label">fresh today</div>
            </div>
            <div className="hero-stat">
              <div className="num">{loading ? '—' : `◎ ${+totalSol.toFixed(2)}`}</div>
              <div className="label">SOL in rewards</div>
            </div>
          </div>
        </div>
      </header>

      <section className="section" id="how">
        <h2 className="section-title">
          Slop-free bounties, <span style={{ color: 'var(--gold)' }}>on autopilot</span>.
        </h2>
        <p className="section-sub">
          No "unleash", no "leverage", no recycled ideas. Every drop is concrete, varied,
          and has proof a moderator can actually verify.
        </p>
        <div className="steps-grid">
          {STEPS.map((s) => (
            <div key={s.n} className="step-card">
              <div className="step-n">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="latest">
        <div className="section-head-row">
          <div>
            <h2 className="section-title left">Latest drops</h2>
            <p className="section-sub left">Hot off Leo's schedule.</p>
          </div>
          <Link to="/bounties" className="btn-secondary sm">
            See all bounties →
          </Link>
        </div>

        {loading && <p className="feed-note">Loading the board…</p>}
        {error && <p className="feed-note error">Couldn't load the feed: {error}</p>}
        {!loading && !error && teaser.length === 0 && (
          <p className="feed-note">No drops yet — Leo's warming up.</p>
        )}
        <div className="bounty-grid">
          {teaser.map((b) => (
            <BountyCard key={b.id} bounty={b} />
          ))}
        </div>
      </section>

      <section className="stripe">
        <h2>Want every drop?</h2>
        <p>The full board updates on its own. Check the latest, post what you like.</p>
        <Link to="/bounties" className="btn-primary">
          Open the board ⚽
        </Link>
      </section>
    </>
  )
}
