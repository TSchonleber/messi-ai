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
      <Link to="/" className="wordmark">
        <span className="ball">⚽</span>
        Open<span>Messi</span>
      </Link>
      <div className="nav-links">
        <button className="navlink" onClick={goHow}>
          How it works
        </button>
        <Link to="/bounties" className="navlink">
          Bounties
        </Link>
      </div>
      <Link to="/bounties" className="nav-cta">
        See the board
      </Link>
    </nav>
  )
}
