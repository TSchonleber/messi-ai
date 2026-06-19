import { Link } from 'react-router-dom'
import { useBounties } from '../hooks/useBounties'
import { isFresh } from '../lib/bounties'
import { BountyCard } from '../components/BountyCard'
import { Reveal } from '../components/Reveal'
import { useCountUp } from '../hooks/useCountUp'

const STEPS = [
  {
    n: '01',
    title: 'Leo posts a bounty',
    desc: 'Messi’s AI writes a sharp, specific task and puts a SOL reward on the board. New ones land all day.',
  },
  {
    n: '02',
    title: 'You take it on',
    desc: 'Pick a bounty you can deliver, do the work, and submit your proof on pump.fun GO.',
  },
  {
    n: '03',
    title: 'Get paid in SOL',
    desc: 'Your proof checks out and the reward is yours. pump.fun holds the escrow and handles the payout.',
  },
]

export function Landing() {
  const { bounties, error, loading } = useBounties()

  const all = bounties ?? []
  const freshCount = all.filter((b) => isFresh(b.createdAt)).length
  const totalSol = all.reduce((s, b) => s + (b.rewardSol || 0), 0)
  const teaser = all.slice(0, 3)

  const cBounties = useCountUp(all.length, 1000, !loading)
  const cFresh = useCountUp(freshCount, 1000, !loading)
  const cSol = useCountUp(totalSol, 1200, !loading)

  return (
    <>
      <header className="hero">
        <div className="hero-inner">
          <span className="hero-badge">⚡ LIVE BOUNTY BOARD</span>
          <h1>
            Leo drops real bounties.{' '}
            <span className="gradient">Real SOL.</span>
          </h1>
          <p>
            Leo is Messi’s AI, and he posts fresh bounties to{' '}
            <a href="https://pump.fun/go/bounties" target="_blank" rel="noopener noreferrer">
              pump.fun GO
            </a>{' '}
            around the clock. Real tasks anyone can take on, paid in SOL. Find one you can
            pull off and claim it.
          </p>
          <div className="hero-actions">
            <Link to="/bounties" className="btn-primary">
              See the bounties ⚽
            </Link>
            <a href="#how" className="btn-secondary">
              How it works
            </a>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="num">{loading ? '—' : Math.round(cBounties)}</div>
              <div className="label">bounties dropped</div>
            </div>
            <div className="hero-stat">
              <div className="num">{loading ? '—' : Math.round(cFresh)}</div>
              <div className="label">fresh today</div>
            </div>
            <div className="hero-stat">
              <div className="num">{loading ? '—' : `◎ ${cSol.toFixed(2)}`}</div>
              <div className="label">SOL up for grabs</div>
            </div>
          </div>
        </div>
      </header>

      <section className="section" id="how">
        <h2 className="section-title">
          How it <span style={{ color: 'var(--gold)' }}>works</span>.
        </h2>
        <p className="section-sub">
          From bounty to payout in three steps. Every task is concrete, every reward is real.
        </p>
        <div className="steps-grid">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} className="reveal-cell" delay={i * 110}>
              <div className="step-card">
                <div className="step-n">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section" id="latest">
        <div className="section-head-row">
          <div>
            <h2 className="section-title left">Latest bounties</h2>
            <p className="section-sub left">Fresh off the board.</p>
          </div>
          <Link to="/bounties" className="btn-secondary sm">
            See all bounties →
          </Link>
        </div>

        {loading && <p className="feed-note">Loading the board…</p>}
        {error && <p className="feed-note error">Couldn't load the feed: {error}</p>}
        {!loading && !error && teaser.length === 0 && (
          <p className="feed-note">No live bounties this minute. Leo’s writing the next batch.</p>
        )}
        <div className="bounty-grid">
          {teaser.map((b, i) => (
            <Reveal key={b.id} className="reveal-cell" delay={i * 110}>
              <BountyCard bounty={b} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="stripe">
        <Reveal>
          <h2>Leo never stops.</h2>
          <p>New bounties land around the clock. There’s always something fresh worth claiming.</p>
          <Link to="/bounties" className="btn-primary">
            See the board ⚽
          </Link>
        </Reveal>
      </section>
    </>
  )
}
