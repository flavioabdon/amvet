// ============================================================
// SEGUIMIENTO.JSX
// ============================================================
import { useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { Plus, Activity, X, Edit2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import React from 'react';

const INITIAL_SEG = { paciente_id: '', fecha_seguimiento: '', observaciones_evolucion: '', proximo_control: '', estado: 'pendiente' }
const ESTADO_BADGE = { pendiente: 'badge-yellow', realizado: 'badge-green', cancelado: 'badge-red' }

export function Seguimiento() {
  const { isAdmin } = useAuth()
  const [items, setItems] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(INITIAL_SEG)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    try {
      const [sRes, pRes] = await Promise.all([api.get('/seguimiento/'), api.get('/pacientes/')])
      setItems(sRes.data); setPacientes(pRes.data)
    } catch { toast.error('Error al cargar') }
    finally { setLoading(false) }
  }

  const openEdit = (s) => {
    setEditing(s)
    setForm({ paciente_id: s.paciente_id, fecha_seguimiento: s.fecha_seguimiento, observaciones_evolucion: s.observaciones_evolucion || '', proximo_control: s.proximo_control || '', estado: s.estado })
    setModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.paciente_id) { toast.error('Debe seleccionar un paciente'); return }
    if (!form.fecha_seguimiento) { toast.error('La fecha de seguimiento es obligatoria'); return }

    // Limpiar payload: strings vacíos → null para campos opcionales
    const payload = {
      paciente_id: parseInt(form.paciente_id),
      fecha_seguimiento: form.fecha_seguimiento,
      observaciones_evolucion: form.observaciones_evolucion || null,
      proximo_control: form.proximo_control || null,
      estado: form.estado || 'pendiente',
    }

    setSaving(true)
    try {
      if (editing) { await api.put(`/seguimiento/${editing.id}`, payload); toast.success('Actualizado') }
      else { await api.post('/seguimiento/', payload); toast.success('Seguimiento registrado') }
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

  if (loading) return <div className="page-loader"><div className="spinner" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Seguimiento Post-Consulta</h1>
          <p className="page-subtitle">{items.length} registro(s) de seguimiento</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={() => { setEditing(null); setForm(INITIAL_SEG); setModal(true) }}><Plus size={16} /> Nuevo Seguimiento</button>}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Fecha</th><th>Paciente</th><th>Evolución</th><th>Próximo Control</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {items.length === 0
                ? <tr><td colSpan={6}><div className="empty-state"><Activity size={36} /><p>Sin seguimientos</p></div></td></tr>
                : items.sort((a, b) => new Date(b.fecha_seguimiento) - new Date(a.fecha_seguimiento)).map(s => (
                  <tr key={s.id}>
                    <td className="font-medium">{s.fecha_seguimiento}</td>
                    <td>{getPacienteNombre(s.paciente_id)}</td>
                    <td style={{ maxWidth: 240 }}><div className="truncate">{s.observaciones_evolucion || '-'}</div></td>
                    <td>{s.proximo_control || '-'}</td>
                    <td><span className={`badge ${ESTADO_BADGE[s.estado] || 'badge-gray'}`}>{s.estado}</span></td>
                    <td>{isAdmin && <button className="btn-icon" onClick={() => openEdit(s)}><Edit2 size={14} /></button>}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editing ? 'Editar Seguimiento' : 'Nuevo Seguimiento'}</h3>
              <button className="btn-icon" onClick={() => setModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Paciente *</label>
                    <select className="form-select" value={form.paciente_id} onChange={e => setForm({ ...form, paciente_id: e.target.value })}>
                      <option value="">Seleccionar...</option>
                      {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fecha seguimiento *</label>
                    <input type="date" className="form-input" value={form.fecha_seguimiento} onChange={e => setForm({ ...form, fecha_seguimiento: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Observaciones de evolución</label>
                  <textarea className="form-textarea" value={form.observaciones_evolucion} onChange={e => setForm({ ...form, observaciones_evolucion: e.target.value })} placeholder="Describe la evolución del paciente..." />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Próximo control recomendado</label>
                    <input type="date" className="form-input" value={form.proximo_control} onChange={e => setForm({ ...form, proximo_control: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estado</label>
                    <select className="form-select" value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
                      <option value="pendiente">Pendiente</option>
                      <option value="realizado">Realizado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
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
    </div>
  )
}

export default Seguimiento