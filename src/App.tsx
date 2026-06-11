import { useState, useRef, useEffect } from 'react'
import './App.css'

type Message = { role: 'bot' | 'user'; text: string }

const cannedReplies: Record<string, string> = {
  goat: 'Uf, that question. Diego is eternal — that\'s the whole answer. The rest is for the journalists to argue about. I just played.',
  'world cup':
    'The next one starts tomorrow, June 11. My sixth. Almost certainly the last dance. We open against Algeria in Kansas City on the 16th. I\'m calm. Bueno... mostly calm.',
  argentina:
    'Defending champions, viste. Seventeen of the Qatar squad are back — Dibu, De Paul, Enzo, Lautaro. Di María retired... we feel it. But this group is a family.',
  nervous:
    'Tranquilo. I vomited before big matches for years. The nerves and the good stuff live in the same place. You show up anyway. That\'s the whole trick.',
  hello:
    '¡Hola! Good to see you. The World Cup starts tomorrow so my head is half there, but dale — what\'s on your mind?',
}

function getReply(input: string): string {
  const lower = input.toLowerCase()
  for (const key of Object.keys(cannedReplies)) {
    if (lower.includes(key)) return cannedReplies[key]
  }
  return 'Good question. The full version of me arrives here soon — memory, live match data, the works. For now, keep going. It comes. ⚽'
}

function ChatPreview() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      text: '¡Hola! It\'s Leo. Sit down, the mate is ready. Ask me anything — football, life, whatever you\'re carrying today. ⚽',
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
      </div>
      <div className="chat-input-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ask Leo about the World Cup, tactics, life…"
        />
        <button onClick={send}>Send</button>
      </div>
    </div>
  )
}

const features = [
  {
    icon: '🧉',
    title: 'A Friend, Not a Bot',
    desc: 'Leo speaks in first person — quiet, warm, certain. Short sentences, dry humor, and praise that lands because it\'s scarce.',
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
    desc: 'Built on the OpenAI Responses API with web search and tool calling — everything ChatGPT can do, in Leo\'s voice.',
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
          <span className="hero-badge">🏆 WORLD CUP 2026 — THE LAST DANCE</span>
          <h1>
            Talk to <span className="gradient">Leo</span>. A companion in a league of his own.
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
        <ChatPreview />
      </header>

      <section className="section" id="features">
        <h2 className="section-title">
          Plays like a <span style={{ color: 'var(--gold)' }}>10</span>. Listens like a friend.
        </h2>
        <p className="section-sub">
          LEO is not an assistant wearing a costume — he's a companion with real memory, live football data, and a
          life of his own.
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
