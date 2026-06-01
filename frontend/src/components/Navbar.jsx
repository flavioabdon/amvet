import { Bell } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import React from 'react';

const TITLES = {
  '/': 'Dashboard',
  '/pacientes': 'Pacientes',
  '/propietarios': 'Propietarios',
  '/citas': 'Gestión de Citas',
  '/historial': 'Historial Clínico',
  '/recetas': 'Recetas Médicas',
  '/inventario': 'Inventario',
  '/seguimiento': 'Seguimiento Post-Consulta',
  '/examenes': 'Exámenes de Laboratorio',
  '/reportes': 'Reportes y Estadísticas',
}

export default function Navbar() {
  const location = useLocation()
  const title = TITLES[location.pathname] || 'AMVet'
  const now = new Date()
  const dateStr = now.toLocaleDateString('es-BO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <header className="navbar">
      <div>
        <h2 className="navbar-title">{title}</h2>
        <p className="navbar-date">{dateStr}</p>
      </div>
      <div className="navbar-actions">
        <button className="btn-icon" title="Notificaciones">
          <Bell size={18} />
        </button>
      </div>

      <style>{`
        .navbar {
          height: var(--header-height);
          background: var(--bg-card);
          border-bottom: 1px solid var(--border-light);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .navbar-title {
          font-family: var(--font-display);
          font-size: 1.1rem;
          color: var(--text-primary);
        }
        .navbar-date {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: capitalize;
        }
        .navbar-actions { display: flex; gap: 8px; align-items: center; }
      `}</style>
    </header>
  )
}