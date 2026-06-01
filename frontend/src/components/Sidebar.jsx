import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, PawPrint, Users, Calendar, ClipboardList,
  FileText, Package, Activity, FlaskConical, BarChart3, LogOut
} from 'lucide-react'
import React from 'react';

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // 1. Definimos si es admin
  const isAdmin = user?.rol === 'admin';

  // 2. Definimos los items DENTRO para que usen isAdmin en los labels
  const NAV_ITEMS = [
    { to: '/', icon: LayoutDashboard, label: 'Inicio', exact: true },
    { 
      to: '/citas', 
      icon: Calendar, 
      label: isAdmin ? 'Gestión de Citas' : 'Mis Citas' 
    },
    { 
      to: '/pacientes', 
      icon: PawPrint, 
      label: isAdmin ? 'Pacientes' : 'Mis Mascotas' 
    },
    { 
      to: '/propietarios', 
      icon: Users, 
      label: 'Propietarios', 
      adminOnly: true 
    },
    { 
      to: '/historial', 
      icon: ClipboardList, 
      label: isAdmin ? 'Historial Clínico' : 'Salud de mi Mascota' 
    },
    { 
      to: '/recetas', 
      icon: FileText, 
      label: isAdmin ? 'Recetas Emitidas' : 'Mis Recetas' 
    },
    { 
      to: '/seguimiento', 
      icon: Activity, 
      label: 'Seguimiento' 
    },
    { 
      to: '/examenes', 
      icon: FlaskConical, 
      label: isAdmin ? 'Análisis Laboratorio' : 'Resultados de Exámenes' 
    },
    { 
      to: '/inventario', 
      icon: Package, 
      label: 'Inventario', 
      adminOnly: true 
    },
    { 
      to: '/reportes', 
      icon: BarChart3, 
      label: 'Reportes', 
      adminOnly: true 
    },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Filtramos los items según el rol
  const visibleItems = NAV_ITEMS.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <PawPrint size={22} />
        </div>
        <div>
          <div className="sidebar-logo-text">AMVet</div>
          <div className="sidebar-logo-sub">Clínica Veterinaria</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {visibleItems.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.nombre || 'Usuario'}</div>
            <div className="sidebar-user-role">
              {isAdmin ? 'Médico Veterinario' : 'Propietario'}
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="sidebar-logout" title="Cerrar sesión">
          <LogOut size={16} />
        </button>
      </div>

      <style>{`
        /* ... (Tu CSS se mantiene igual) ... */
        .sidebar {
          position: fixed;
          top: 0; left: 0; bottom: 0;
          width: var(--sidebar-width);
          background: var(--bg-sidebar);
          display: flex;
          flex-direction: column;
          z-index: 100;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 18px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .sidebar-logo-icon {
          width: 38px; height: 38px;
          background: var(--accent-green);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          flex-shrink: 0;
        }

        .sidebar-logo-text {
          font-family: var(--font-display);
          font-size: 1.25rem;
          color: #fff;
          line-height: 1.1;
        }

        .sidebar-logo-sub {
          font-size: 0.68rem;
          color: rgba(255,255,255,0.4);
          letter-spacing: 0.06em;
        }

        .sidebar-nav {
          flex: 1;
          padding: 14px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow-y: auto;
        }

        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: var(--radius-sm);
          color: var(--text-sidebar);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 400;
          transition: all 0.15s;
        }

        .sidebar-item:hover {
          background: var(--bg-sidebar-hover);
          color: #fff;
        }

        .sidebar-item.active {
          background: var(--bg-sidebar-active);
          color: #fff;
          font-weight: 500;
        }

        .sidebar-footer {
          padding: 14px;
          border-top: 1px solid rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sidebar-user {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .sidebar-avatar {
          width: 34px; height: 34px;
          background: var(--accent-green);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          font-size: 0.875rem;
          font-weight: 600;
          flex-shrink: 0;
        }

        .sidebar-user-info { min-width: 0; }

        .sidebar-user-name {
          font-size: 0.8rem;
          font-weight: 500;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar-user-role {
          font-size: 0.68rem;
          color: rgba(255,255,255,0.4);
        }

        .sidebar-logout {
          background: rgba(255,255,255,0.08);
          border: none;
          color: rgba(255,255,255,0.5);
          width: 32px; height: 32px;
          border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.15s;
        }

        .sidebar-logout:hover {
          background: rgba(255,255,255,0.15);
          color: #fff;
        }
      `}</style>
    </aside>
  )
}