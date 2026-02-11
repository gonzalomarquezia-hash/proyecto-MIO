import { NavLink } from 'react-router-dom'
import {
    MessageCircle, Target, Repeat, BarChart3, User, Brain, Star, Settings,
    PanelLeftClose, PanelLeftOpen, Sparkles
} from 'lucide-react'

const navItems = [
    { path: '/', label: 'Chat', icon: MessageCircle },
    { path: '/metas', label: 'Metas', icon: Target },
    { path: '/habitos', label: 'Hábitos y Actividades', icon: Repeat },
    { path: '/graficos', label: 'Gráficos y Datos', icon: BarChart3 },
    { path: '/perfil', label: 'Yo', icon: User },
    { path: '/estructuras', label: 'Estructuras Internas', icon: Brain },
    { path: '/ambiciones', label: 'Ambiciones', icon: Star },
    { path: '/config', label: 'Configuración', icon: Settings },
]

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose, userName }) {
    return (
        <>
            {mobileOpen && <div className="modal-overlay" onClick={onMobileClose} style={{ zIndex: 150 }} />}
            <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="sidebar-logo-icon">
                            <Sparkles size={20} color="white" />
                        </div>
                        <h1>Conciencia</h1>
                    </div>
                    <button className="sidebar-toggle" onClick={onToggle} aria-label="Toggle sidebar">
                        {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={onMobileClose}
                            title={collapsed ? item.label : undefined}
                        >
                            <item.icon className="nav-icon" size={20} />
                            <span className="nav-label">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-avatar">
                        {userName?.charAt(0)?.toUpperCase() || 'G'}
                    </div>
                    <span className="sidebar-footer-text">{userName}</span>
                </div>
            </aside>
        </>
    )
}
