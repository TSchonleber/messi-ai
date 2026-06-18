import { Routes, Route } from 'react-router-dom'
import './App.css'
import { Nav } from './components/Nav'
import { Footer } from './components/Footer'
import { Landing } from './pages/Landing'
import { BountiesPage } from './pages/BountiesPage'

function App() {
  return (
    <div className="app">
      <Nav />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/bounties" element={<BountiesPage />} />
        <Route path="*" element={<Landing />} />
      </Routes>
      <Footer />
    </div>
  )
}

export default App
