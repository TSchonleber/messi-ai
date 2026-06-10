import { useState, useRef, useEffect } from 'react'
import './App.css'

type Message = { role: 'bot' | 'user'; text: string }

const cannedReplies: Record<string, string> = {
  goat: "Easy one, amigo — Leo Messi. 8 Ballon d'Ors, a World Cup, Copa América titles, and over 800 career goals. The numbers don't lie. 🐐",
  'world cup':
    'Qatar 2022 — the greatest final ever played. Messi scored twice, Argentina beat France on penalties, and Leo finally lifted the trophy. ¡Vamos! 🏆',
  argentina:
    'La Albiceleste! 2022 World Cup champions, 2021 & 2024 Copa América winners. Want to talk tactics, squads, or the golden generation?',
  hello:
    "¡Hola! I'm Messi AI, your football companion. Ask me about international football, tactics, history, or anything ChatGPT can do — with extra flair. ⚽",
}

function getReply(input: string): string {
  const lower = input.toLowerCase()
  for (const key of Object.keys(cannedReplies)) {
    if (lower.includes(key)) return cannedReplies[key]
  }
  return "Great question! The full Messi AI agent launches soon — powered by ChatGPT and tuned for international football. Stay tuned, and remember: never stop dribbling. ⚽✨"
}

function ChatPreview() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      text: "¡Hola! I'm Messi AI — your personal companion for everything football and beyond. Ask me anything! ⚽",
    },
  ])
  const [input, setInput] = useState('')
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text }])
    setTimeout(() => {
      setMessages((m) => [...m, { role: 'bot', text: getReply(text) }])
    }, 600)
  }

  return (
    <div className="chat-card" id="chat">
      <div className="chat-header">
        <div className="chat-avatar">⚽</div>
        <div>
          <div className="name">Messi AI</div>
          <div className="status">● Online — ready to play</div>
        </div>
      </div>
      <div className="chat-body" ref={bodyRef}>
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            {m.text}
          </div>
        ))}
      </div>
      <div className="chat-input-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ask about the GOAT, the World Cup, tactics…"
        />
        <button onClick={send}>Send</button>
      </div>
    </div>
  )
}

const features = [
  {
    icon: '🐐',
    title: 'Football Encyclopedia',
    desc: 'Deep knowledge of international football — World Cups, Copa América, Euros, legendary players, and iconic matches.',
  },
  {
    icon: '🤖',
    title: 'ChatGPT Superpowers',
    desc: 'Everything you love about ChatGPT — writing, brainstorming, answering questions — wrapped in a football-loving personality.',
  },
  {
    icon: '💬',
    title: 'Personal Companion',
    desc: 'Messi AI learns your style, remembers your favorite teams, and chats like a friend who never misses a match.',
  },
  {
    icon: '📊',
    title: 'Stats & Tactics',
    desc: 'Break down formations, analyze legendary performances, and settle debates with real numbers and tactical insight.',
  },
  {
    icon: '🏆',
    title: 'Match-Day Hype',
    desc: 'Pre-match predictions, live-match banter energy, and post-match analysis for every big international fixture.',
  },
  {
    icon: '🌍',
    title: 'Speaks Your Language',
    desc: 'From Buenos Aires to Barcelona to your hometown — chat in the language you love the game in.',
  },
]

function App() {
  return (
    <div className="app">
      <nav className="nav">
        <div className="nav-logo">
          <span className="ball">⚽</span>
          <span>
            Messi<span className="ai">AI</span>
          </span>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#chat">Chat</a>
          <a href="#about">About</a>
        </div>
        <button className="nav-cta" onClick={() => document.getElementById('chat')?.scrollIntoView()}>
          Try the Demo
        </button>
      </nav>

      <header className="hero">
        <div>
          <span className="hero-badge">🏆 THE GOAT OF AI COMPANIONS</span>
          <h1>
            Your personal <span className="gradient">AI companion</span> for the beautiful game
          </h1>
          <p>
            Messi AI blends the power of ChatGPT with a deep love of international football. Chat about anything —
            from World Cup history to everyday questions — with a companion that plays in a league of its own.
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
        <ChatPreview />
      </header>

      <section className="section" id="features">
        <h2 className="section-title">
          Plays like a <span style={{ color: 'var(--gold)' }}>10</span>. Thinks like a genius.
        </h2>
        <p className="section-sub">
          Messi AI is more than a chatbot — it's a companion built for fans of the beautiful game.
        </p>
        <div className="features-grid">
          {features.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="stripe" id="about">
        <h2>Ready to join the squad?</h2>
        <p>The full Messi AI agent is warming up on the sidelines. Try the demo above and be first on the pitch.</p>
        <button className="btn-primary" onClick={() => document.getElementById('chat')?.scrollIntoView()}>
          Try Messi AI Now
        </button>
      </section>

      <footer className="footer">
        <span>© {new Date().getFullYear()} messi-ai.fun — Built for fans of the beautiful game.</span>
        <span>⚽ Ankara, Messi, Messi, Messi…</span>
      </footer>
    </div>
  )
}

export default App
