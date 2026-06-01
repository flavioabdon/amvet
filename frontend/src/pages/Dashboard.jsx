import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import React from 'react';
import api from '../api/axios'
import { PawPrint, Users, Calendar, Package, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [citasHoy, setCitasHoy] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [statsRes, citasRes] = await Promise.all([
        api.get('/reportes/stats'),
        api.get('/citas/hoy'),
      ])
      setStats(statsRes.data)
      setCitasHoy(citasRes.data)
    } catch {
      // fallback con datos demo
      setStats({
        total_pacientes: 0,
        total_propietarios: 0,
        citas_mes: 0,
        inventario_bajo: 0,
        consultas_por_mes: []
      })
      setCitasHoy([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="page-loader"><div className="spinner" /><span>Cargando...</span></div>

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  const TIPO_LABELS = {
    control: 'Control', vacuna: 'Vacuna', cirugia: 'Cirugía',
    esterilizacion: 'Esterilización', peluqueria: 'Peluquería',
    emergencia: 'Emergencia', otro: 'Otro'
  }

  const ESTADO_BADGE = {
    programada: 'badge-blue',
    confirmada: 'badge-green',
    completada: 'badge-gray',
    cancelada: 'badge-red',
  }

  return (
    <div>
      {/* Saludo */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">{greeting()}, {user?.nombre?.split(' ')[0]} 👋</h1>
        <p className="page-subtitle">Aquí tienes el resumen de hoy en la Clínica AMVet</p>
      </div>

      {/* Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-green"><PawPrint size={22} /></div>
          <div>
            <div className="stat-value">{stats?.total_pacientes ?? 0}</div>
            <div className="stat-label">Pacientes registrados</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-blue"><Users size={22} /></div>
          <div>
            <div className="stat-value">{stats?.total_propietarios ?? 0}</div>
            <div className="stat-label">Propietarios</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-gold"><Calendar size={22} /></div>
          <div>
            <div className="stat-value">{stats?.citas_mes ?? 0}</div>
            <div className="stat-label">Citas este mes</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-terracota"><Package size={22} /></div>
          <div>
            <div className="stat-value">{stats?.inventario_bajo ?? 0}</div>
            <div className="stat-label">Productos con stock bajo</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Citas de hoy */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Citas de Hoy</h3>
            <span className="badge badge-blue">{citasHoy.length}</span>
          </div>
          {citasHoy.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <CheckCircle size={32} style={{ margin: '0 auto 8px', opacity: 0.2 }} />
              <p>No hay citas programadas para hoy</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {citasHoy.map(c => (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', background: 'var(--bg-secondary)',
                  borderRadius: 8, borderLeft: '3px solid var(--accent-green)'
                }}>
                  <Clock size={15} color="var(--accent-green)" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                      {c.hora?.substring(0, 5)} — {c.paciente_nombre}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {TIPO_LABELS[c.tipo_consulta]} · {c.propietario_nombre}
                    </div>
                  </div>
                  <span className={`badge ${ESTADO_BADGE[c.estado] || 'badge-gray'}`}>
                    {c.estado}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gráfico de consultas */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Consultas por Mes</h3>
          </div>
          {stats?.consultas_por_mes?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.consultas_por_mes}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip
                  contentStyle={{ fontFamily: 'DM Sans', fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }}
                />
                <Bar dataKey="total" fill="var(--accent-green)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <p>Sin datos de consultas aún</p>
            </div>
          )}
        </div>
      </div>

      {/* Alerta inventario bajo */}
      {stats?.inventario_bajo > 0 && (
        <div style={{
          marginTop: 20, padding: '14px 18px',
          background: '#FEF3C7', borderRadius: 10,
          border: '1px solid #FDE68A',
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: '0.875rem', color: '#92400E'
        }}>
          <AlertTriangle size={18} />
          <span>
            <strong>{stats.inventario_bajo}</strong> producto(s) en inventario con stock bajo.
            Revisa el módulo de Inventario para reabastecerte.
          </span>
        </div>
      )}
    </div>
  )
}

