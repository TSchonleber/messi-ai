import { Link } from 'react-router-dom'
import { useBounties } from '../hooks/useBounties'
import { isFresh } from '../lib/bounties'
import { BountyCard } from '../components/BountyCard'
import { Reveal } from '../components/Reveal'
import { Ticker } from '../components/Ticker'
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
  const { bounties, loading, error } = useBounties()

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
        <div className="hero-grid">
          <div className="hero-left">
            <span className="kicker">
              <span className="dot" /> Live bounty board · pump.fun GO
            </span>
            <h1 className="hero-title">
              <span className="line">
                <span>Leo drops</span>
              </span>
              <span className="line">
                <span>real bounties.</span>
              </span>
              <span className="line">
                <span className="hl">Real SOL.</span>
              </span>
            </h1>
            <p className="hero-sub">
              Leo is Messi’s AI, and he posts fresh bounties to{' '}
              <a href="https://pump.fun/go/bounties" target="_blank" rel="noopener noreferrer">
                pump.fun GO
              </a>{' '}
              around the clock. Real tasks anyone can take on, paid in SOL. Find one you can
              pull off and claim it.
            </p>
            <div className="hero-actions">
              <Link to="/bounties" className="btn">
                See the bounties ⚽
              </Link>
              <a href="#how" className="btn ghost">
                How it works
              </a>
            </div>
          </div>

          <div className="hero-score">
            <div className="score">
              <div className="score-num">{loading ? '—' : Math.round(cBounties)}</div>
              <div className="score-label">bounties dropped</div>
            </div>
            <div className="score">
              <div className="score-num">{loading ? '—' : Math.round(cFresh)}</div>
              <div className="score-label">fresh today</div>
            </div>
            <div className="score">
              <div className="score-num">{loading ? '—' : `◎ ${cSol.toFixed(2)}`}</div>
              <div className="score-label">SOL up for grabs</div>
            </div>
          </div>
        </div>
      </header>

      <Ticker items={all} />

      <section className="section" id="how">
        <div className="sec-head">
          <span className="sec-tag">01 / How it works</span>
          <h2 className="sec-title">From bounty to payout</h2>
        </div>
        <div className="steps">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 90}>
              <div className="step">
                <div className="step-n">{s.n}</div>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section" id="latest">
        <div className="sec-head-row">
          <div>
            <span className="sec-tag">02 / Latest bounties</span>
            <h2 className="sec-title">Fresh off the board</h2>
          </div>
          <Link to="/bounties" className="btn ghost sm">
            See all →
          </Link>
        </div>

        {loading && <p className="feed-note">Loading the board…</p>}
        {error && <p className="feed-note error">Couldn’t load the feed: {error}</p>}
        {!loading && !error && teaser.length === 0 && (
          <p className="feed-note">No live bounties this minute. Leo’s writing the next batch.</p>
        )}
        <div className="bounty-grid">
          {teaser.map((b, i) => (
            <Reveal key={b.id} className="reveal-cell" delay={i * 90}>
              <BountyCard bounty={b} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="stripe">
        <Reveal>
          <h2>Leo never stops</h2>
          <p>New bounties land around the clock. There’s always something fresh worth claiming.</p>
          <Link to="/bounties" className="btn">
            See the board ⚽
          </Link>
        </Reveal>
      </section>
    </>
  )
}
