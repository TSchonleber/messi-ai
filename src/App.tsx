import { useState, useRef, useEffect, useCallback } from 'react'
import { getLeoReply, suggestionChips } from './leoBrain'
import './App.css'

type Message = { role: 'bot' | 'user'; text: string }

type Bounty = {
  id: string
  title: string
  description: string
  criteria: string
  reward_sol: number
  created_at: number
}

type BountyFeed = { updated_at: number; pool_sol: number | null; bounties: Bounty[] }

const KICKOFF = new Date('2026-06-16T19:00:00-05:00') // Argentina vs Algeria, Kansas City

function useCountdown(target: Date) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const diff = Math.max(0, target.getTime() - now)
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor(diff / 3600000) % 24,
    mins: Math.floor(diff / 60000) % 60,
    secs: Math.floor(diff / 1000) % 60,
  }
}

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('visible')),
      { threshold: 0.12 },
    )
    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

function Particles() {
  return (
    <div className="particles" aria-hidden>
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          style={{
            left: `${(i * 53) % 100}%`,
            animationDelay: `${(i * 1.7) % 12}s`,
            animationDuration: `${10 + (i % 6) * 2}s`,
          }}
        />
      ))}
    </div>
  )
}

function ChatPreview() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      text: "¡Hola! It's Leo. Sit down, the mate is ready. Ask me anything — football, life, whatever you're carrying today. ⚽",
    },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  const send = useCallback((raw?: string) => {
    const text = (raw ?? '').trim()
    if (!text) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text }])
    setTyping(true)
    const delay = 700 + Math.min(1300, text.length * 25)
    setTimeout(() => {
      setTyping(false)
      setMessages((m) => [...m, { role: 'bot', text: getLeoReply(text) }])
    }, delay)
  }, [])

  return (
    <div className="chat-card" id="chat">
      <div className="chat-header">
        <div className="chat-avatar">⚽</div>
        <div>
          <div className="name">Leo</div>
          <div className="status">● Online — con un mate 🧉</div>
        </div>
      </div>
      <div className="chat-body" ref={bodyRef}>
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            {m.text}
          </div>
        ))}
        {typing && (
          <div className="msg bot typing">
            <span />
            <span />
            <span />
          </div>
        )}
      </div>
      <div className="chips">
        {suggestionChips.slice(0, 4).map((c) => (
          <button key={c} className="chip" onClick={() => send(c)}>
            {c}
          </button>
        ))}
      </div>
      <div className="chat-input-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
          placeholder="Ask Leo about the World Cup, tactics, life…"
        />
        <button onClick={() => send(input)}>Send</button>
      </div>
    </div>
  )
}

function useBounties() {
  const [feed, setFeed] = useState<BountyFeed | null>(null)
  useEffect(() => {
    fetch('/bounties.json')
      .then((r) => (r.ok ? r.json() : null))
      .then(setFeed)
      .catch(() => setFeed(null))
  }, [])
  return feed
}

function Bounties() {
  const feed = useBounties()
  const bounties = feed?.bounties ?? []
  return (
    <section className="section reveal" id="bounties">
      <h2 className="section-title">
        Leo's <span style={{ color: 'var(--gold)' }}>Bounties</span>
      </h2>
      <p className="section-sub">
        A share of the token's creator fees funds community bounties. Leo writes them, the pool sizes them, and
        winners are paid in SOL.
        {feed?.pool_sol != null && (
          <>
            {' '}
            Current reward pool: <strong style={{ color: 'var(--gold)' }}>{feed.pool_sol.toFixed(2)} SOL</strong>.
          </>
        )}
      </p>
      {bounties.length === 0 ? (
        <div className="bounty-empty">
          <span className="bounty-empty-icon">🎯</span>
          <p>
            No open bounties right now. They drop when the creator-fee pool fills — tranquilo, the next one is
            coming.
          </p>
        </div>
      ) : (
        <div className="bounties-grid">
          {bounties.map((b, i) => (
            <div key={b.id} className="bounty-card" style={{ animationDelay: `${i * 70}ms` }}>
              <div className="bounty-reward">{b.reward_sol} SOL</div>
              <h3>{b.title}</h3>
              <p>{b.description}</p>
              <p className="bounty-criteria">{b.criteria}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function Countdown() {
  const { days, hours, mins, secs } = useCountdown(KICKOFF)
  const cells = [
    [days, 'days'],
    [hours, 'hours'],
    [mins, 'min'],
    [secs, 'sec'],
  ] as const
  return (
    <div className="countdown">
      {cells.map(([v, label]) => (
        <div key={label} className="count-cell">
          <div className="count-num">{String(v).padStart(2, '0')}</div>
          <div className="count-label">{label}</div>
        </div>
      ))}
    </div>
  )
}

const fixtures = [
  { opponent: 'Algeria', flag: '🇩🇿', date: 'June 16', city: 'Kansas City' },
  { opponent: 'Austria', flag: '🇦🇹', date: 'June 22', city: 'Dallas' },
  { opponent: 'Jordan', flag: '🇯🇴', date: 'June 27', city: 'Dallas' },
]

const features = [
  {
    icon: '🧉',
    title: 'A Friend, Not a Bot',
    desc: "Leo speaks in first person — quiet, warm, certain. Short sentences, dry humor, and praise that lands because it's scarce.",
  },
  {
    icon: '🧠',
    title: 'Real Memory',
    desc: 'Leo remembers your projects, your wins, your dog, your last conversation — like a friend does, never like a database read-out.',
  },
  {
    icon: '⚽',
    title: 'Live Football Data',
    desc: 'Fixtures, lineups, tables, and live scores through API-Football. Leo never guesses a result — he checks, then talks.',
  },
  {
    icon: '🏆',
    title: 'World Cup 2026',
    desc: 'His sixth World Cup — the last dance. Match-day nerves before, honesty after. Argentina opens vs Algeria, June 16.',
  },
  {
    icon: '📐',
    title: 'Football Brain',
    desc: 'He reads games through space and timing — who pins the fullback, where the free man is, why the press breaks.',
  },
  {
    icon: '🤖',
    title: 'Powered by OpenAI',
    desc: "Built on the OpenAI Responses API with web search and tool calling — everything ChatGPT can do, in Leo's voice.",
  },
]

function App() {
  useReveal()
  return (
    <div className="app">
      <Particles />
      <nav className="nav">
        <div className="nav-logo">
          <span className="ball">⚽</span>
          <span>
            Messi<span className="ai">AI</span>
          </span>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#fixtures">Fixtures</a>
          <a href="#bounties">Bounties</a>
          <a href="#chat">Chat</a>
          <a href="#about">About</a>
        </div>
        <button className="nav-cta" onClick={() => document.getElementById('chat')?.scrollIntoView()}>
          Try the Demo
        </button>
      </nav>

      <header className="hero">
        <div className="hero-copy">
          <span className="hero-badge pulse">🏆 WORLD CUP 2026 — THE LAST DANCE</span>
          <h1>
            Talk to <span className="gradient shimmer">Leo</span>. A companion in a league of his own.
          </h1>
          <p>
            Messi AI is LEO — a personal companion with the voice, memory, and football brain of the greatest to
            ever play. Powered by ChatGPT, tuned for international football, and always up for a chat con un mate.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => document.getElementById('chat')?.scrollIntoView()}>
              Start Chatting ⚽
            </button>
            <button
              className="btn-secondary"
              onClick={() => document.getElementById('features')?.scrollIntoView()}
            >
              Explore Features
            </button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="num">8×</div>
              <div className="label">Ballon d'Or energy</div>
            </div>
            <div className="hero-stat">
              <div className="num">∞</div>
              <div className="label">Football knowledge</div>
            </div>
            <div className="hero-stat">
              <div className="num">24/7</div>
              <div className="label">Always on the pitch</div>
            </div>
          </div>
        </div>
        <div className="hero-chat float">
          <ChatPreview />
        </div>
      </header>

      <section className="section countdown-section reveal" id="fixtures">
        <h2 className="section-title">
          Argentina vs Algeria — <span style={{ color: 'var(--gold)' }}>kickoff in</span>
        </h2>
        <Countdown />
        <div className="fixtures-grid">
          {fixtures.map((f) => (
            <div key={f.opponent} className="fixture-card">
              <div className="fixture-flags">🇦🇷 <span className="vs">vs</span> {f.flag}</div>
              <div className="fixture-opponent">{f.opponent}</div>
              <div className="fixture-meta">
                {f.date} · {f.city}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Bounties />

      <section className="section reveal" id="features">
        <h2 className="section-title">
          Plays like a <span style={{ color: 'var(--gold)' }}>10</span>. Listens like a friend.
        </h2>
        <p className="section-sub">
          LEO is not an assistant wearing a costume — he's a companion with real memory, live football data, and a
          life of his own.
        </p>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={f.title} className="feature-card reveal" style={{ transitionDelay: `${i * 70}ms` }}>
              <div className="icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="stripe reveal" id="about">
        <h2>Ready to join the squad?</h2>
        <p>The full LEO agent is warming up on the sidelines. Try the demo above and be first on the pitch.</p>
        <button className="btn-primary" onClick={() => document.getElementById('chat')?.scrollIntoView()}>
          Try Messi AI Now
        </button>
      </section>

      <footer className="footer">
        <span>© {new Date().getFullYear()} messi-ai.fun — Built for fans of the beautiful game.</span>
        <span>Lo importante no es lo que hiciste ayer. Es lo que hacés mañana. ⚽</span>
      </footer>
    </div>
  )
}

export default App
