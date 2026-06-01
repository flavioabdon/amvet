import { useState, useEffect } from 'react'
import api from '../api/axios'
import React from 'react';
import toast from 'react-hot-toast'
import { Plus, Search, ClipboardList, Edit2, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const TIPOS = ['consulta', 'vacuna', 'cirugia', 'esterilizacion', 'peluqueria', 'control', 'emergencia', 'otro']
const TIPO_LABEL = { consulta: 'Consulta', vacuna: 'Vacuna', cirugia: 'Cirugía', esterilizacion: 'Esterilización', peluqueria: 'Peluquería', control: 'Control', emergencia: 'Emergencia', otro: 'Otro' }
const TIPO_BADGE = { consulta: 'badge-blue', vacuna: 'badge-green', cirugia: 'badge-terracota', esterilizacion: 'badge-yellow', peluqueria: 'badge-gray', control: 'badge-green', emergencia: 'badge-red', otro: 'badge-gray' }

const INITIAL = {
  paciente_id: '', fecha: new Date().toISOString().split('T')[0], tipo: 'consulta',
  diagnostico: '', tratamiento: '', vacuna_nombre: '', vacuna_lote: '', proxima_vacuna: '',
  peso_actual: '', temperatura: '', observaciones: ''
}

export default function Historial() {
  const { isAdmin } = useAuth()
  const [items, setItems] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(INITIAL)
  const [saving, setSaving] = useState(false)
  const [detail, setDetail] = useState(null)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    try {
      const [hRes, pRes] = await Promise.all([api.get('/historial/'), api.get('/pacientes/')])
      setItems(hRes.data)
      setPacientes(pRes.data)
    } catch { toast.error('Error al cargar') }
    finally { setLoading(false) }
  }

  const openCreate = () => { setEditing(null); setForm(INITIAL); setModal(true) }
  const openEdit = (h) => {
    setEditing(h)
    setForm({
      paciente_id: h.paciente_id, fecha: h.fecha, tipo: h.tipo,
      diagnostico: h.diagnostico || '', tratamiento: h.tratamiento || '',
      vacuna_nombre: h.vacuna_nombre || '', vacuna_lote: h.vacuna_lote || '',
      proxima_vacuna: h.proxima_vacuna || '', peso_actual: h.peso_actual || '',
      temperatura: h.temperatura || '', observaciones: h.observaciones || ''
    })
    setModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.paciente_id) { toast.error('Debe seleccionar un paciente'); return }
    if (!form.fecha) { toast.error('La fecha es obligatoria'); return }
    if (!form.tipo) { toast.error('El tipo de atención es obligatorio'); return }

    // Limpiar campos opcionales: convertir "" a null para que el backend no falle
    const payload = {
      ...form,
      paciente_id: parseInt(form.paciente_id),
      peso_actual: form.peso_actual !== '' ? parseFloat(form.peso_actual) : null,
      temperatura: form.temperatura !== '' ? parseFloat(form.temperatura) : null,
      vacuna_nombre: form.vacuna_nombre || null,
      vacuna_lote: form.vacuna_lote || null,
      proxima_vacuna: form.proxima_vacuna || null,
      diagnostico: form.diagnostico || null,
      tratamiento: form.tratamiento || null,
      observaciones: form.observaciones || null,
    }

    setSaving(true)
    try {
      if (editing) {
        await api.put(`/historial/${editing.id}`, payload)
        toast.success('Registro actualizado')
      } else {
        await api.post('/historial/', payload)
        toast.success('Registro creado')
      }
      setModal(false); loadAll()
    } catch (err) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        toast.error(detail.map(d => d.msg).join(', '))
      } else {
        toast.error(detail || 'Error al guardar')
      }
    } finally { setSaving(false) }
  }

  const getPacienteNombre = (id) => pacientes.find(p => p.id === id)?.nombre || 'Desconocido'

  const filtered = items.filter(h =>
    getPacienteNombre(h.paciente_id).toLowerCase().includes(search.toLowerCase()) ||
    (h.diagnostico || '').toLowerCase().includes(search.toLowerCase()) ||
    (h.tipo || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="page-loader"><div className="spinner" /><span>Cargando...</span></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Historial Clínico</h1>
          <p className="page-subtitle">{items.length} registro(s) clínico(s)</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> Nuevo Registro
          </button>
        )}
      </div>

      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search size={15} />
          <input className="form-input" placeholder="Buscar por paciente, diagnóstico o tipo..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Paciente</th>
                <th>Tipo</th>
                <th>Diagnóstico</th>
                <th>Tratamiento</th>
                <th>Peso</th>
                <th>Temp.</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8}><div className="empty-state"><ClipboardList size={36} /><p>Sin registros</p></div></td></tr>
              ) : filtered.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map(h => (
                <tr key={h.id}>
                  <td className="font-medium">{h.fecha}</td>
                  <td>{getPacienteNombre(h.paciente_id)}</td>
                  <td><span className={`badge ${TIPO_BADGE[h.tipo] || 'badge-gray'}`}>{TIPO_LABEL[h.tipo]}</span></td>
                  <td style={{ maxWidth: 180 }}><div className="truncate">{h.diagnostico || '-'}</div></td>
                  <td style={{ maxWidth: 180 }}><div className="truncate">{h.tratamiento || '-'}</div></td>
                  <td>{h.peso_actual ? `${h.peso_actual} kg` : '-'}</td>
                  <td>{h.temperatura ? `${h.temperatura}°C` : '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => setDetail(h)}>Ver</button>
                      {isAdmin && <button className="btn-icon" onClick={() => openEdit(h)}><Edit2 size={14} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear/Editar */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editing ? 'Editar Registro' : 'Nuevo Registro Clínico'}</h3>
              <button className="btn-icon" onClick={() => setModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Paciente *</label>
                    <select className="form-select" value={form.paciente_id}
                      onChange={e => setForm({ ...form, paciente_id: e.target.value })}>
                      <option value="">Seleccionar...</option>
                      {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.especie})</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fecha *</label>
                    <input type="date" className="form-input" value={form.fecha}
                      onChange={e => setForm({ ...form, fecha: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Tipo de atención</label>
                    <select className="form-select" value={form.tipo}
                      onChange={e => setForm({ ...form, tipo: e.target.value })}>
                      {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
                    </select>
                  </div>
                  <div className="form-row" style={{ marginBottom: 0 }}>
                    <div className="form-group">
                      <label className="form-label">Peso (kg)</label>
                      <input type="number" step="0.01" className="form-input" value={form.peso_actual}
                        onChange={e => setForm({ ...form, peso_actual: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Temperatura (°C)</label>
                      <input type="number" step="0.1" className="form-input" value={form.temperatura}
                        onChange={e => setForm({ ...form, temperatura: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Diagnóstico</label>
                  <textarea className="form-textarea" value={form.diagnostico}
                    onChange={e => setForm({ ...form, diagnostico: e.target.value })} placeholder="Diagnóstico clínico..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Tratamiento</label>
                  <textarea className="form-textarea" value={form.tratamiento}
                    onChange={e => setForm({ ...form, tratamiento: e.target.value })} placeholder="Tratamiento indicado..." />
                </div>
                {form.tipo === 'vacuna' && (
                  <div className="form-row-3">
                    <div className="form-group">
                      <label className="form-label">Nombre de vacuna</label>
                      <input className="form-input" value={form.vacuna_nombre}
                        onChange={e => setForm({ ...form, vacuna_nombre: e.target.value })} placeholder="Ej: Antirrábica" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Lote</label>
                      <input className="form-input" value={form.vacuna_lote}
                        onChange={e => setForm({ ...form, vacuna_lote: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Próxima vacuna</label>
                      <input type="date" className="form-input" value={form.proxima_vacuna}
                        onChange={e => setForm({ ...form, proxima_vacuna: e.target.value })} />
                    </div>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Observaciones</label>
                  <textarea className="form-textarea" value={form.observaciones}
                    onChange={e => setForm({ ...form, observaciones: e.target.value })} placeholder="Notas adicionales..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal detalle */}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📋 Registro Clínico — {getPacienteNombre(detail.paciente_id)}</h3>
              <button className="btn-icon" onClick={() => setDetail(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginBottom: 16 }}>
                {[
                  ['Fecha', detail.fecha], ['Tipo', TIPO_LABEL[detail.tipo]],
                  ['Peso', detail.peso_actual ? `${detail.peso_actual} kg` : '-'],
                  ['Temperatura', detail.temperatura ? `${detail.temperatura}°C` : '-'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{k}</div>
                    <div className="font-medium">{v}</div>
                  </div>
                ))}
              </div>
              {[['Diagnóstico', detail.diagnostico], ['Tratamiento', detail.tratamiento], ['Observaciones', detail.observaciones]].map(([k, v]) => v ? (
                <div key={k} style={{ marginBottom: 12, padding: '12px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <div className="text-xs text-muted font-medium" style={{ marginBottom: 4, textTransform: 'uppercase' }}>{k}</div>
                  <p style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{v}</p>
                </div>
              ) : null)}
              {detail.vacuna_nombre && (
                <div style={{ padding: '12px', background: '#D1FAE5', borderRadius: 8, border: '1px solid #A7F3D0' }}>
                  <div className="text-xs font-medium" style={{ color: '#065F46', marginBottom: 4 }}>VACUNA</div>
                  <p style={{ fontSize: '0.875rem', color: '#065F46' }}>
                    {detail.vacuna_nombre} · Lote: {detail.vacuna_lote || '-'} · Próxima: {detail.proxima_vacuna || '-'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}