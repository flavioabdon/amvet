import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import React from 'react';
import toast from 'react-hot-toast'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend, LineChart, Line,
  Area, AreaChart,
} from 'recharts'
import {
  BarChart3, PawPrint, Calendar, FlaskConical,
  TrendingUp, FileText, Package, RefreshCw, Download
} from 'lucide-react'

// ── Paleta coherente con el sistema ──────────────────────────
const COLORS = [
  '#4A7C59', '#C4622D', '#3A6B8A', '#C9923A',
  '#6FAE82', '#E8956D', '#5E9BB0', '#E0B46E',
]

const MESES_ES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

// ── Tooltip personalizado ─────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)',
      borderRadius: 8, padding: '10px 14px',
      fontFamily: 'var(--font-body)', fontSize: '0.82rem',
      boxShadow: 'var(--shadow-md)',
    }}>
      {label && <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>{label}</div>}
      {payload.map((entry, i) => (
        <div key={i} style={{ color: entry.color || 'var(--text-secondary)' }}>
          {entry.name}: <strong>{entry.value}</strong>
        </div>
      ))}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────
export default function Reportes() {
  const currentYear  = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const [anio, setAnio]                   = useState(currentYear)
  const [loading, setLoading]             = useState(true)
  const [refreshing, setRefreshing]       = useState(false)

  // Datos de los distintos endpoints
  const [stats, setStats]                 = useState(null)
  const [consultasMes, setConsultasMes]   = useState([])
  const [diagnosticos, setDiagnosticos]   = useState([])
  const [tiposConsulta, setTiposConsulta] = useState([])
  const [especiesData, setEspeciesData]   = useState([])
  const [vacunasMes, setVacunasMes]       = useState([])
  const [inventarioBajo, setInventarioBajo] = useState([])

  // ── Carga ──────────────────────────────────────────────────
  const loadAll = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    else setLoading(true)
    try {
      const [
        statsRes,
        consultasRes,
        diagRes,
        tiposRes,
        especiesRes,
        vacunasRes,
        invRes,
      ] = await Promise.all([
        api.get('/reportes/stats'),
        api.get(`/reportes/consultas-por-mes?anio=${anio}`),
        api.get('/reportes/diagnosticos-frecuentes'),
        api.get('/reportes/tipos-consulta'),
        api.get('/reportes/pacientes-por-especie'),
        api.get(`/reportes/vacunas-por-mes?anio=${anio}`),
        api.get('/reportes/inventario-bajo'),
      ])
      setStats(statsRes.data)
      setConsultasMes(consultasRes.data)
      setDiagnosticos(diagRes.data)
      setTiposConsulta(tiposRes.data)
      setEspeciesData(especiesRes.data)
      setVacunasMes(vacunasRes.data)
      setInventarioBajo(invRes.data)
    } catch {
      toast.error('Error al cargar reportes')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [anio])

  useEffect(() => { loadAll() }, [loadAll])

  // ── Formateo para gráfico de meses ───────────────────────
  const consultasMesFormateado = MESES_ES.map((mes, idx) => {
    const found = consultasMes.find((d) => parseInt(d.mes) === idx + 1)
    return { mes, total: found?.total || 0 }
  })

  const vacunasMesFormateado = MESES_ES.map((mes, idx) => {
    const found = vacunasMes.find((d) => parseInt(d.mes) === idx + 1)
    return { mes, total: found?.total || 0 }
  })

  // ── Exportar CSV simple ───────────────────────────────────
  const exportCSV = (data, filename) => {
    if (!data?.length) { toast.error('Sin datos para exportar'); return }
    const headers = Object.keys(data[0]).join(',')
    const rows    = data.map((r) => Object.values(r).join(',')).join('\n')
    const blob    = new Blob([`${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' })
    const url     = URL.createObjectURL(blob)
    const a       = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
    toast.success('Archivo descargado')
  }

  // ── Loading ───────────────────────────────────────────────
  if (loading) return (
    <div className="page-loader">
      <div className="spinner" />
      <span>Generando reportes...</span>
    </div>
  )

  const anios = Array.from({ length: 5 }, (_, i) => currentYear - i)

  return (
    <div>
      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Reportes y Estadísticas</h1>
          <p className="page-subtitle">Vista general de la actividad de la Clínica AMVet</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Selector de año */}
          <select
            className="form-select"
            style={{ width: 120 }}
            value={anio}
            onChange={(e) => setAnio(parseInt(e.target.value))}
          >
            {anios.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button
            className="btn btn-secondary"
            onClick={() => loadAll(true)}
            disabled={refreshing}
            title="Actualizar datos"
          >
            <RefreshCw size={15} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />
            Actualizar
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          FILA 1 — Tarjetas KPI
      ══════════════════════════════════════════════════════ */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <KpiCard
          icon={<PawPrint size={20} />}
          iconClass="stat-icon-green"
          value={stats?.total_pacientes ?? 0}
          label="Pacientes registrados"
          sub="total histórico"
        />
        <KpiCard
          icon={<Calendar size={20} />}
          iconClass="stat-icon-blue"
          value={stats?.citas_mes ?? 0}
          label="Citas este mes"
          sub={`${new Date().toLocaleString('es-BO', { month: 'long' })}`}
        />
        <KpiCard
          icon={<FlaskConical size={20} />}
          iconClass="stat-icon-gold"
          value={stats?.examenes_pendientes ?? 0}
          label="Exámenes pendientes"
          sub="sin resultado aún"
        />
        <KpiCard
          icon={<Package size={20} />}
          iconClass="stat-icon-terracota"
          value={stats?.inventario_bajo ?? 0}
          label="Stock bajo"
          sub="productos bajo mínimo"
          alert={stats?.inventario_bajo > 0}
        />
      </div>

      {/* ══════════════════════════════════════════════════════
          FILA 2 — Consultas por mes (área) + Tipos de consulta (pie)
      ══════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Consultas por mes */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Consultas por mes — {anio}</h3>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => exportCSV(consultasMes, `consultas_${anio}.csv`)}
            >
              <Download size={13} /> CSV
            </button>
          </div>
          {consultasMesFormateado.every((d) => d.total === 0) ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={consultasMesFormateado} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradConsultas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#4A7C59" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4A7C59" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Consultas"
                  stroke="#4A7C59"
                  strokeWidth={2.5}
                  fill="url(#gradConsultas)"
                  dot={{ r: 3, fill: '#4A7C59' }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tipos de consulta — Pie */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Tipos de consulta</h3>
          </div>
          {tiposConsulta.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={tiposConsulta}
                  dataKey="total"
                  nameKey="tipo"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={38}
                  paddingAngle={3}
                  label={({ tipo, percent }) =>
                    percent > 0.06 ? `${tipo} ${(percent * 100).toFixed(0)}%` : ''
                  }
                  labelLine={false}
                >
                  {tiposConsulta.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          FILA 3 — Vacunas por mes (barras) + Pacientes por especie (pie)
      ══════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Vacunas por mes */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Vacunas aplicadas por mes — {anio}</h3>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => exportCSV(vacunasMes, `vacunas_${anio}.csv`)}
            >
              <Download size={13} /> CSV
            </button>
          </div>
          {vacunasMesFormateado.every((d) => d.total === 0) ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={vacunasMesFormateado} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Vacunas" fill={COLORS[2]} radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pacientes por especie */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Pacientes por especie</h3>
          </div>
          {especiesData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={especiesData}
                  dataKey="total"
                  nameKey="especie"
                  cx="50%"
                  cy="50%"
                  outerRadius={72}
                  paddingAngle={2}
                >
                  {especiesData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          FILA 4 — Diagnósticos frecuentes + Inventario bajo
      ══════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Diagnósticos más frecuentes */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Diagnósticos más frecuentes</h3>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => exportCSV(diagnosticos, 'diagnosticos_frecuentes.csv')}
            >
              <Download size={13} /> CSV
            </button>
          </div>
          {diagnosticos.length === 0 ? (
            <EmptyChart label="Sin diagnósticos registrados" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {diagnosticos.slice(0, 8).map((d, i) => {
                const max = diagnosticos[0]?.total || 1
                const pct = Math.round((d.total / max) * 100)
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }} className="truncate">
                        {d.diagnostico || '(sin texto)'}
                      </span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: COLORS[i % COLORS.length], marginLeft: 8, flexShrink: 0 }}>
                        {d.total}
                      </span>
                    </div>
                    <div style={{ height: 5, background: 'var(--bg-secondary)', borderRadius: 3 }}>
                      <div style={{
                        height: '100%', borderRadius: 3,
                        background: COLORS[i % COLORS.length],
                        width: `${pct}%`,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Inventario con stock bajo */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">⚠ Inventario con stock bajo</h3>
          </div>
          {inventarioBajo.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <Package size={32} style={{ opacity: 0.2 }} />
              <p style={{ marginTop: 8, fontSize: '0.875rem' }}>
                Todo el inventario tiene stock suficiente ✓
              </p>
            </div>
          ) : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th style={{ textAlign: 'right' }}>Actual</th>
                    <th style={{ textAlign: 'right' }}>Mínimo</th>
                  </tr>
                </thead>
                <tbody>
                  {inventarioBajo.map((item) => (
                    <tr key={item.id}>
                      <td className="font-medium" style={{ fontSize: '0.84rem' }}>{item.nombre}</td>
                      <td>
                        <span className="badge badge-gray" style={{ fontSize: '0.72rem' }}>
                          {item.categoria}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{
                          fontWeight: 700, fontSize: '0.875rem',
                          color: item.cantidad === 0 ? 'var(--error)' : 'var(--warning)'
                        }}>
                          {item.cantidad}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                        {item.cantidad_minima}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Pie de página del módulo ── */}
      <div style={{
        marginTop: 28, padding: '12px 16px',
        background: 'var(--bg-secondary)',
        borderRadius: 10,
        border: '1px solid var(--border-light)',
        display: 'flex', alignItems: 'center', gap: 10,
        fontSize: '0.78rem', color: 'var(--text-muted)'
      }}>
        <BarChart3 size={14} />
        Los datos se actualizan en tiempo real desde la base de datos de AMVet.
        Usa el botón <strong style={{ marginLeft: 2, marginRight: 2 }}>Actualizar</strong>
        para refrescar todos los gráficos.
      </div>
    </div>
  )
}

// ── Sub-componentes ───────────────────────────────────────────

function KpiCard({ icon, iconClass, value, label, sub, alert }) {
  return (
    <div className="stat-card" style={alert ? { borderLeft: '3px solid var(--accent-terracota)' } : {}}>
      <div className={`stat-icon ${iconClass}`}>{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {sub && (
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
        )}
      </div>
    </div>
  )
}

function EmptyChart({ label = 'Sin datos para este período' }) {
  return (
    <div className="empty-state" style={{ padding: '28px 0' }}>
      <TrendingUp size={30} style={{ opacity: 0.2 }} />
      <p style={{ marginTop: 8, fontSize: '0.82rem' }}>{label}</p>
    </div>
  )
}