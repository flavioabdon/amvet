import { useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import React from 'react';
import { Plus, Search, Calendar, Edit2, Trash2, X, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const TIPOS = ['control', 'vacuna', 'cirugia', 'esterilizacion', 'peluqueria', 'emergencia', 'otro']
const ESTADOS = ['programada', 'confirmada', 'completada', 'cancelada']
const TIPO_LABEL = { control: 'Control', vacuna: 'Vacuna', cirugia: 'Cirugía', esterilizacion: 'Esterilización', peluqueria: 'Peluquería', emergencia: 'Emergencia', otro: 'Otro' }
const ESTADO_BADGE = { programada: 'badge-blue', confirmada: 'badge-green', completada: 'badge-gray', cancelada: 'badge-red' }
const INITIAL = { paciente_id: '', propietario_id: '', fecha: '', hora: '', tipo_consulta: 'control', motivo: '', estado: 'programada', notas: '' }

export default function Citas() {
  const { isAdmin } = useAuth()
  const [citas, setCitas] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [propietarios, setPropietarios] = useState([])
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(INITIAL)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    try {
      const [cRes, pRes, propRes] = await Promise.all([
        api.get('/citas/'),
        api.get('/pacientes/'),
        api.get('/propietarios/')
      ])
      setCitas(cRes.data)
      setPacientes(pRes.data)
      setPropietarios(propRes.data)
    } catch { toast.error('Error al cargar datos') }
    finally { setLoading(false) }
  }

  const openCreate = () => { setEditing(null); setForm(INITIAL); setModal(true) }
  const openEdit = (c) => {
    setEditing(c)
    setForm({
      paciente_id: c.paciente_id, propietario_id: c.propietario_id,
      fecha: c.fecha, hora: c.hora?.substring(0, 5),
      tipo_consulta: c.tipo_consulta, motivo: c.motivo || '',
      estado: c.estado, notas: c.notas || ''
    })
    setModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.paciente_id) { toast.error('Debe seleccionar un paciente'); return }
    if (!form.fecha) { toast.error('La fecha es obligatoria'); return }
    if (!form.hora) { toast.error('La hora es obligatoria'); return }
    if (!form.tipo_consulta) { toast.error('El tipo de consulta es obligatorio'); return }

    // Limpiar payload: strings vacíos → null, ids → enteros
    const payload = {
      paciente_id: parseInt(form.paciente_id),
      propietario_id: form.propietario_id ? parseInt(form.propietario_id) : null,
      fecha: form.fecha,
      hora: form.hora,
      tipo_consulta: form.tipo_consulta,
      estado: form.estado || 'programada',
      motivo: form.motivo || null,
      notas: form.notas || null,
    }

    setSaving(true)
    try {
      if (editing) {
        await api.put(`/citas/${editing.id}`, payload)
        toast.success('Cita actualizada')
      } else {
        await api.post('/citas/', payload)
        toast.success('Cita agendada')
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

  const handleDelete = async (id) => {
    if (!confirm('¿Cancelar/eliminar esta cita?')) return
    try {
      await api.delete(`/citas/${id}`)
      toast.success('Cita eliminada'); loadAll()
    } catch { toast.error('No se pudo eliminar') }
  }

  const handleEstadoRapido = async (id, estado) => {
    try {
      await api.patch(`/citas/${id}/estado`, { estado })
      toast.success(`Estado cambiado a: ${estado}`)
      loadAll()
    } catch { toast.error('Error') }
  }

  const onPacienteChange = (pid) => {
    const pac = pacientes.find(p => p.id === parseInt(pid))
    setForm({ ...form, paciente_id: pid, propietario_id: pac?.propietario_id || '' })
  }

  const getPacienteNombre = (id) => pacientes.find(p => p.id === id)?.nombre || 'Desconocido'
  const getPropietarioNombre = (id) => propietarios.find(p => p.id === id)?.nombre || 'Desconocido'

  const filtered = citas.filter(c => {
    const pNombre = getPacienteNombre(c.paciente_id)
    const pac = pacientes.find(p => p.id === c.paciente_id)
    const propNombre = getPropietarioNombre(pac?.propietario_id)
    
    const matchSearch = pNombre.toLowerCase().includes(search.toLowerCase()) ||
      propNombre.toLowerCase().includes(search.toLowerCase())
    const matchEstado = !filtroEstado || c.estado === filtroEstado
    return matchSearch && matchEstado
  })

  if (loading) return <div className="page-loader"><div className="spinner" /><span>Cargando...</span></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Citas</h1>
          <p className="page-subtitle">{citas.length} cita(s) registrada(s)</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Agendar Cita
        </button>
      </div>

      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search size={15} />
          <input className="form-input" placeholder="Buscar por paciente o propietario..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 180 }} value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Paciente</th>
                <th>Propietario</th>
                <th>Tipo</th>
                <th>Motivo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8}><div className="empty-state"><Calendar size={36} /><p>Sin citas</p></div></td></tr>
              ) : filtered.sort((a, b) => new Date(b.fecha + 'T' + b.hora) - new Date(a.fecha + 'T' + a.hora))
                .map(c => (
                  <tr key={c.id}>
                    <td className="font-medium">{c.fecha}</td>
                    <td>{c.hora?.substring(0, 5)}</td>
                    <td>{getPacienteNombre(c.paciente_id)}</td>
                    <td>{getPropietarioNombre(pacientes.find(p => p.id === c.paciente_id)?.propietario_id)}</td>
                    <td>
                      <span className="badge badge-green">{TIPO_LABEL[c.tipo_consulta]}</span>
                    </td>
                    <td className="text-sm" style={{ maxWidth: 160 }}>{c.motivo || '-'}</td>
                    <td>
                      {isAdmin ? (
                        <select
                          className="form-select"
                          style={{ padding: '3px 8px', fontSize: '0.8rem', width: 130 }}
                          value={c.estado}
                          onChange={e => handleEstadoRapido(c.id, e.target.value)}
                        >
                          {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <span className={`badge ${ESTADO_BADGE[c.estado] || 'badge-gray'}`}>{c.estado}</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-icon" onClick={() => openEdit(c)}><Edit2 size={14} /></button>
                        {isAdmin && (
                          <button className="btn-icon" style={{ color: 'var(--error)' }} onClick={() => handleDelete(c.id)}><Trash2 size={14} /></button>
                        )}
                      </div>
                    </td>
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
              <h3 className="modal-title">{editing ? 'Editar Cita' : 'Agendar Cita'}</h3>
              <button className="btn-icon" onClick={() => setModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Paciente *</label>
                    <select className="form-select" value={form.paciente_id}
                      onChange={e => onPacienteChange(e.target.value)}>
                      <option value="">Seleccionar...</option>
                      {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.especie})</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Propietario</label>
                    <select className="form-select" value={form.propietario_id}
                      onChange={e => setForm({ ...form, propietario_id: e.target.value })}>
                      <option value="">Seleccionar...</option>
                      {propietarios.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Fecha *</label>
                    <input type="date" className="form-input" value={form.fecha}
                      onChange={e => setForm({ ...form, fecha: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hora *</label>
                    <input type="time" className="form-input" value={form.hora}
                      onChange={e => setForm({ ...form, hora: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Tipo de consulta</label>
                    <select className="form-select" value={form.tipo_consulta}
                      onChange={e => setForm({ ...form, tipo_consulta: e.target.value })}>
                      {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estado</label>
                    <select className="form-select" value={form.estado}
                      onChange={e => setForm({ ...form, estado: e.target.value })}>
                      {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Motivo de consulta</label>
                  <input className="form-input" value={form.motivo}
                    onChange={e => setForm({ ...form, motivo: e.target.value })} placeholder="Ej: Chequeo rutinario" />
                </div>
                <div className="form-group">
                  <label className="form-label">Notas adicionales</label>
                  <textarea className="form-textarea" value={form.notas}
                    onChange={e => setForm({ ...form, notas: e.target.value })} placeholder="Observaciones..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Agendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}