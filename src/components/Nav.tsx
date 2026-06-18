import { Link, useLocation, useNavigate } from 'react-router-dom'

export function Nav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const goHow = () => {
    if (pathname === '/') {
      document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/#how')
    }
  }

  return (
    <nav className="nav">
      <Link to="/" className="nav-logo">
        <span className="ball">⚽</span>
        <span>
          Messi<span className="ai">AI</span>
        </span>
      </Link>
      <div className="nav-links">
        <button className="linklike" onClick={goHow}>
          How it works
        </button>
        <Link to="/bounties">Bounties</Link>
      </div>
      <Link to="/bounties" className="nav-cta">
        See the drops
      </Link>
    </nav>
  )
}
