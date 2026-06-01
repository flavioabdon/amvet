import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'
import React from 'react';
import toast from 'react-hot-toast'
import {
  Plus, Search, FlaskConical, X, Edit2, Eye,
  Paperclip, CheckCircle, Clock, Upload
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// ── Constantes ────────────────────────────────────────────────
const TIPOS_EXAMEN = [
  'Hemograma completo',
  'Química sanguínea',
  'Urianálisis',
  'Coproparasitológico',
  'Raspado cutáneo',
  'Citología',
  'Radiografía',
  'Ecografía',
  'Cultivo y antibiograma',
  'Prueba de Parvovirosis',
  'Prueba de Moquillo',
  'Prueba de Leishmaniasis',
  'Otro',
]

const ESTADO_BADGE = {
  pendiente: { cls: 'badge-yellow', label: 'Pendiente', icon: <Clock size={11} /> },
  con_resultado: { cls: 'badge-green', label: 'Con resultado', icon: <CheckCircle size={11} /> },
}

const INITIAL = {
  paciente_id: '',
  tipo_examen: '',
  tipo_examen_otro: '',
  fecha_solicitud: new Date().toISOString().split('T')[0],
  fecha_resultado: '',
  laboratorio: '',
  resultado: '',
  observaciones: '',
}

// ── Componente principal ──────────────────────────────────────
export default function Examenes() {
  const { isAdmin } = useAuth()

  const [examenes, setExamenes]     = useState([])
  const [pacientes, setPacientes]   = useState([])
  const [search, setSearch]         = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [loading, setLoading]       = useState(true)
  const [modal, setModal]           = useState(false)
  const [editing, setEditing]       = useState(null)
  const [form, setForm]             = useState(INITIAL)
  const [saving, setSaving]         = useState(false)
  const [detail, setDetail]         = useState(null)
  const [fileUpload, setFileUpload] = useState(null)   // File object
  const fileRef = useRef(null)

  // ── Carga de datos ──────────────────────────────────────────
  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    try {
      const [eRes, pRes] = await Promise.all([
        api.get('/examenes/'),
        api.get('/pacientes/'),
      ])
      setExamenes(eRes.data)
      setPacientes(pRes.data)
    } catch {
      toast.error('Error al cargar exámenes')
    } finally {
      setLoading(false)
    }
  }

  // ── Abrir modales ───────────────────────────────────────────
  const openCreate = () => {
    setEditing(null)
    setForm(INITIAL)
    setFileUpload(null)
    setModal(true)
  }

  const openEdit = (ex) => {
    setEditing(ex)
    setForm({
      paciente_id:       ex.paciente_id,
      tipo_examen:       TIPOS_EXAMEN.includes(ex.tipo_examen) ? ex.tipo_examen : 'Otro',
      tipo_examen_otro:  TIPOS_EXAMEN.includes(ex.tipo_examen) ? '' : ex.tipo_examen,
      fecha_solicitud:   ex.fecha_solicitud,
      fecha_resultado:   ex.fecha_resultado || '',
      laboratorio:       ex.laboratorio || '',
      resultado:         ex.resultado || '',
      observaciones:     ex.observaciones || '',
    })
    setFileUpload(null)
    setModal(true)
  }

  // ── Guardar ─────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault()

    const tipoFinal =
      form.tipo_examen === 'Otro' && form.tipo_examen_otro.trim()
        ? form.tipo_examen_otro.trim()
        : form.tipo_examen

    if (!form.paciente_id || !tipoFinal || !form.fecha_solicitud) {
      toast.error('Paciente, tipo de examen y fecha de solicitud son obligatorios')
      return
    }

    setSaving(true)
    try {
      // Construimos FormData para soportar archivo adjunto
      const fd = new FormData()
      fd.append('paciente_id',    form.paciente_id)
      fd.append('tipo_examen',    tipoFinal)
      fd.append('fecha_solicitud',form.fecha_solicitud)
      if (form.fecha_resultado) fd.append('fecha_resultado', form.fecha_resultado)
      if (form.laboratorio)     fd.append('laboratorio',     form.laboratorio)
      if (form.resultado)       fd.append('resultado',       form.resultado)
      if (form.observaciones)   fd.append('observaciones',   form.observaciones)
      if (fileUpload)           fd.append('archivo',         fileUpload)

      if (editing) {
        await api.put(`/examenes/${editing.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        toast.success('Examen actualizado')
      } else {
        await api.post('/examenes/', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        toast.success('Examen registrado')
      }
      setModal(false)
      loadAll()
    } catch (err) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        toast.error(detail.map(d => d.msg).join(', '))
      } else {
        toast.error(detail || 'Error al guardar')
      }
    } finally {
      setSaving(false)
    }
  }

  // ── Filtrado ────────────────────────────────────────────────
  const filtered = examenes.filter((ex) => {
    const matchSearch =
      (ex.paciente_nombre || '').toLowerCase().includes(search.toLowerCase()) ||
      (ex.tipo_examen || '').toLowerCase().includes(search.toLowerCase()) ||
      (ex.laboratorio || '').toLowerCase().includes(search.toLowerCase())
    const estado = ex.fecha_resultado ? 'con_resultado' : 'pendiente'
    const matchEstado = !filtroEstado || estado === filtroEstado
    return matchSearch && matchEstado
  })

  const pendientes    = examenes.filter((ex) => !ex.fecha_resultado).length
  const conResultado  = examenes.filter((ex) =>  ex.fecha_resultado).length

  // ── Render ──────────────────────────────────────────────────
  if (loading) return (
    <div className="page-loader">
      <div className="spinner" />
      <span>Cargando exámenes...</span>
    </div>
  )

  return (
    <div>
      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Exámenes de Laboratorio</h1>
          <p className="page-subtitle">
            {examenes.length} examen(es) · {pendientes} pendiente(s) · {conResultado} con resultado
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> Nuevo Examen
          </button>
        )}
      </div>

      {/* ── Tarjetas resumen ── */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
        <SummaryCard
          color="stat-icon-blue"
          icon={<FlaskConical size={20} />}
          value={examenes.length}
          label="Total de exámenes"
        />
        <SummaryCard
          color="stat-icon-gold"
          icon={<Clock size={20} />}
          value={pendientes}
          label="Pendientes de resultado"
        />
        <SummaryCard
          color="stat-icon-green"
          icon={<CheckCircle size={20} />}
          value={conResultado}
          label="Con resultado disponible"
        />
      </div>

      {/* ── Barra de búsqueda y filtro ── */}
      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search size={15} />
          <input
            className="form-input"
            placeholder="Buscar por paciente, tipo de examen o laboratorio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          style={{ width: 200 }}
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="con_resultado">Con resultado</option>
        </select>
      </div>

      {/* ── Tabla ── */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Paciente</th>
                <th>Tipo de examen</th>
                <th>Fecha solicitud</th>
                <th>Laboratorio</th>
                <th>Fecha resultado</th>
                <th>Archivo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state">
                      <FlaskConical size={40} />
                      <p style={{ marginTop: 8 }}>No se encontraron exámenes</p>
                      {isAdmin && (
                        <button
                          className="btn btn-primary"
                          style={{ marginTop: 14 }}
                          onClick={openCreate}
                        >
                          <Plus size={14} /> Registrar primero
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                [...filtered]
                  .sort((a, b) => new Date(b.fecha_solicitud) - new Date(a.fecha_solicitud))
                  .map((ex, i) => {
                    const estado = ex.fecha_resultado ? 'con_resultado' : 'pendiente'
                    const badge  = ESTADO_BADGE[estado]
                    return (
                      <tr key={ex.id}>
                        <td className="text-muted text-xs">{i + 1}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <PacienteAvatar nombre={ex.paciente_nombre} />
                            <span className="font-medium">{ex.paciente_nombre}</span>
                          </div>
                        </td>
                        <td>{ex.tipo_examen}</td>
                        <td>{ex.fecha_solicitud}</td>
                        <td className="text-muted text-sm">{ex.laboratorio || '—'}</td>
                        <td>
                          {ex.fecha_resultado
                            ? <span style={{ color: 'var(--accent-green)', fontWeight: 500 }}>{ex.fecha_resultado}</span>
                            : <span className="text-muted">—</span>}
                        </td>
                        <td>
                          {ex.archivo_nombre
                            ? (
                              <span
                                className="flex items-center gap-1"
                                style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', cursor: 'pointer' }}
                                title={ex.archivo_nombre}
                              >
                                <Paperclip size={13} />
                                {ex.archivo_nombre.length > 16
                                  ? ex.archivo_nombre.substring(0, 14) + '…'
                                  : ex.archivo_nombre}
                              </span>
                            )
                            : <span className="text-muted">—</span>}
                        </td>
                        <td>
                          <span className={`badge ${badge.cls}`} style={{ gap: 4 }}>
                            {badge.icon} {badge.label}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn-icon"
                              title="Ver detalle"
                              onClick={() => setDetail(ex)}
                            >
                              <Eye size={14} />
                            </button>
                            {isAdmin && (
                              <button
                                className="btn-icon"
                                title="Editar"
                                onClick={() => openEdit(ex)}
                              >
                                <Edit2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          MODAL — Crear / Editar
      ══════════════════════════════════════════════════════ */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editing ? 'Editar Examen' : 'Registrar Examen de Laboratorio'}
              </h3>
              <button className="btn-icon" onClick={() => setModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">

                {/* Fila 1: Paciente + Tipo */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Paciente *</label>
                    <select
                      className="form-select"
                      value={form.paciente_id}
                      onChange={(e) => setForm({ ...form, paciente_id: e.target.value })}
                    >
                      <option value="">Seleccionar paciente...</option>
                      {pacientes.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} ({p.especie})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tipo de examen *</label>
                    <select
                      className="form-select"
                      value={form.tipo_examen}
                      onChange={(e) => setForm({ ...form, tipo_examen: e.target.value, tipo_examen_otro: '' })}
                    >
                      <option value="">Seleccionar...</option>
                      {TIPOS_EXAMEN.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Campo "Otro" condicional */}
                {form.tipo_examen === 'Otro' && (
                  <div className="form-group">
                    <label className="form-label">Especificar tipo de examen *</label>
                    <input
                      className="form-input"
                      value={form.tipo_examen_otro}
                      onChange={(e) => setForm({ ...form, tipo_examen_otro: e.target.value })}
                      placeholder="Ej: PCR Distemper canino"
                    />
                  </div>
                )}

                {/* Fila 2: Fechas */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Fecha de solicitud *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={form.fecha_solicitud}
                      onChange={(e) => setForm({ ...form, fecha_solicitud: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fecha de resultado</label>
                    <input
                      type="date"
                      className="form-input"
                      value={form.fecha_resultado}
                      onChange={(e) => setForm({ ...form, fecha_resultado: e.target.value })}
                    />
                  </div>
                </div>

                {/* Laboratorio */}
                <div className="form-group">
                  <label className="form-label">Laboratorio / Clínica de diagnóstico</label>
                  <input
                    className="form-input"
                    value={form.laboratorio}
                    onChange={(e) => setForm({ ...form, laboratorio: e.target.value })}
                    placeholder="Ej: Laboratorio Oruro, Lab. Central, etc."
                  />
                </div>

                {/* Resultado */}
                <div className="form-group">
                  <label className="form-label">Resultado</label>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: 110 }}
                    value={form.resultado}
                    onChange={(e) => setForm({ ...form, resultado: e.target.value })}
                    placeholder="Describe los hallazgos principales del examen..."
                  />
                </div>

                {/* Observaciones */}
                <div className="form-group">
                  <label className="form-label">Observaciones / Interpretación clínica</label>
                  <textarea
                    className="form-textarea"
                    value={form.observaciones}
                    onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                    placeholder="Interpretación del veterinario..."
                  />
                </div>

                {/* Archivo adjunto */}
                <div className="form-group">
                  <label className="form-label">Adjuntar archivo (PDF, imagen)</label>
                  <div
                    className="file-drop-zone"
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      const f = e.dataTransfer.files[0]
                      if (f) setFileUpload(f)
                    }}
                  >
                    <Upload size={22} style={{ color: 'var(--text-muted)', marginBottom: 6 }} />
                    {fileUpload
                      ? <span style={{ color: 'var(--accent-green)', fontWeight: 500 }}>{fileUpload.name}</span>
                      : editing?.archivo_nombre
                        ? <span style={{ color: 'var(--text-secondary)' }}>Archivo actual: <strong>{editing.archivo_nombre}</strong> (sube otro para reemplazar)</span>
                        : <span className="text-muted text-sm">Haz clic o arrastra un archivo aquí</span>}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    style={{ display: 'none' }}
                    onChange={(e) => setFileUpload(e.target.files[0] || null)}
                  />
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving
                    ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Guardando...</>
                    : editing ? 'Actualizar' : 'Registrar examen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL — Detalle de examen
      ══════════════════════════════════════════════════════ */}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">🔬 {detail.tipo_examen}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Paciente: <strong>{detail.paciente_nombre}</strong>
                </p>
              </div>
              <button className="btn-icon" onClick={() => setDetail(null)}><X size={16} /></button>
            </div>

            <div className="modal-body">
              {/* Meta info */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px 20px', marginBottom: 20,
                padding: '16px', background: 'var(--bg-secondary)',
                borderRadius: 10, border: '1px solid var(--border-light)'
              }}>
                {[
                  ['Fecha solicitud', detail.fecha_solicitud],
                  ['Fecha resultado', detail.fecha_resultado || '—'],
                  ['Laboratorio',     detail.laboratorio     || '—'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{
                      fontSize: '0.7rem', textTransform: 'uppercase',
                      letterSpacing: '0.06em', color: 'var(--text-muted)',
                      fontWeight: 600, marginBottom: 3
                    }}>{k}</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Estado badge */}
              <div style={{ marginBottom: 16 }}>
                {detail.fecha_resultado
                  ? <span className="badge badge-green" style={{ padding: '5px 12px', fontSize: '0.8rem' }}>
                      <CheckCircle size={12} /> Resultado disponible
                    </span>
                  : <span className="badge badge-yellow" style={{ padding: '5px 12px', fontSize: '0.8rem' }}>
                      <Clock size={12} /> Pendiente de resultado
                    </span>}
              </div>

              {/* Resultado */}
              {detail.resultado && (
                <DetailSection title="Resultado del examen" accent="var(--accent-blue)">
                  {detail.resultado}
                </DetailSection>
              )}

              {/* Observaciones */}
              {detail.observaciones && (
                <DetailSection title="Observaciones / Interpretación" accent="var(--accent-green)">
                  {detail.observaciones}
                </DetailSection>
              )}

              {/* Archivo */}
              {detail.archivo_nombre && (
                <div style={{
                  marginTop: 16, padding: '12px 16px',
                  background: '#EFF6FF', borderRadius: 8,
                  border: '1px solid #BFDBFE',
                  display: 'flex', alignItems: 'center', gap: 10
                }}>
                  <Paperclip size={16} color="var(--accent-blue)" />
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', fontWeight: 600 }}>
                      Archivo adjunto
                    </div>
                    <div style={{ fontSize: '0.875rem' }}>{detail.archivo_nombre}</div>
                  </div>
                </div>
              )}

              {!detail.resultado && !detail.observaciones && !detail.archivo_nombre && (
                <div className="empty-state" style={{ padding: '20px 0' }}>
                  <p>Este examen aún no tiene resultado registrado.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Estilos locales ── */}
      <style>{`
        .file-drop-zone {
          border: 2px dashed var(--border);
          border-radius: var(--radius-sm);
          padding: 22px;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          display: flex; flex-direction: column; align-items: center;
        }
        .file-drop-zone:hover {
          border-color: var(--accent-green);
          background: rgba(74,124,89,0.04);
        }
      `}</style>
    </div>
  )
}

// ── Sub-componentes ───────────────────────────────────────────

function SummaryCard({ color, icon, value, label }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  )
}

function PacienteAvatar({ nombre }) {
  return (
    <div style={{
      width: 30, height: 30, borderRadius: '50%',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, flexShrink: 0, color: 'var(--accent-green)', fontWeight: 600
    }}>
      {nombre?.charAt(0)?.toUpperCase() || '?'}
    </div>
  )
}

function DetailSection({ title, accent, children }) {
  return (
    <div style={{
      marginBottom: 14, padding: '14px 16px',
      background: 'var(--bg-secondary)', borderRadius: 8,
      borderLeft: `4px solid ${accent}`
    }}>
      <div style={{
        fontSize: '0.72rem', textTransform: 'uppercase',
        letterSpacing: '0.06em', fontWeight: 700,
        color: accent, marginBottom: 6
      }}>
        {title}
      </div>
      <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
        {children}
      </p>
    </div>
  )
}