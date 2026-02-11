import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './components/Sidebar'
import ChatPage from './pages/ChatPage'
import MetasPage from './pages/MetasPage'
import HabitosPage from './pages/HabitosPage'
import GraficosPage from './pages/GraficosPage'
import PerfilPage from './pages/PerfilPage'
import EstructurasPage from './pages/EstructurasPage'
import AmbicionesPage from './pages/AmbicionesPage'
import ConfigPage from './pages/ConfigPage'
import RegistrosPage from './pages/RegistrosPage'
import { getProfile } from './services/supabase'

function App() {
  const [profile, setProfile] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const data = await getProfile()
    setProfile(data)
  }

  return (
    <BrowserRouter>
      <div className="app-layout">
        {/* Mobile hamburger button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button>

        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
          userName={profile?.nombre || 'Usuario'}
        />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<ChatPage profile={profile} />} />
            <Route path="/registros" element={<RegistrosPage profile={profile} />} />
            <Route path="/metas" element={<MetasPage profile={profile} />} />
            <Route path="/habitos" element={<HabitosPage profile={profile} />} />
            <Route path="/graficos" element={<GraficosPage profile={profile} />} />
            <Route path="/perfil" element={<PerfilPage profile={profile} onUpdate={loadProfile} />} />
            <Route path="/estructuras" element={<EstructurasPage />} />
            <Route path="/ambiciones" element={<AmbicionesPage profile={profile} onUpdate={loadProfile} />} />
            <Route path="/config" element={<ConfigPage profile={profile} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
