import { useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import React from 'react';
import { Plus, Search, PawPrint, Edit2, Trash2, X, Eye } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const INITIAL = {
  nombre: '', especie: '', raza: '', edad_anios: '', edad_meses: '',
  sexo: '', peso: '', color: '', observaciones: '', propietario_id: ''
}

const ESPECIES = ['Perro', 'Gato', 'Ave', 'Conejo', 'Hamster', 'Reptil', 'Otro']

export default function Pacientes() {
  const { isAdmin } = useAuth()
  const [pacientes, setPacientes] = useState([])
  const [propietarios, setPropietarios] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(INITIAL)
  const [saving, setSaving] = useState(false)
  const [viewModal, setViewModal] = useState(null)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    try {
      const [pRes, propRes] = await Promise.all([
        api.get('pacientes'),
        api.get('propietarios')
      ])
      setPacientes(pRes.data)
      setPropietarios(propRes.data)
    } catch { toast.error('Error al cargar datos') }
    finally { setLoading(false) }
  }

  const openCreate = () => { setEditing(null); setForm(INITIAL); setModal(true) }

  const openEdit = (p) => {
    setEditing(p)
    setForm({
      nombre: p.nombre, especie: p.especie, raza: p.raza || '',
      edad_anios: p.edad_anios || '', edad_meses: p.edad_meses || '',
      sexo: p.sexo || '', peso: p.peso || '', color: p.color || '',
      observaciones: p.observaciones || '', propietario_id: p.propietario_id
    })
    setModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) { toast.error('El nombre del paciente es obligatorio'); return }
    if (!form.especie) { toast.error('La especie es obligatoria'); return }
    if (!form.propietario_id) { toast.error('Debe seleccionar un propietario'); return }

    // Calcular edad total en años (fracción) combinando años + meses
    const anios = parseFloat(form.edad_anios) || 0
    const meses = parseFloat(form.edad_meses) || 0
    const edadDecimal = anios + (meses / 12)

    // Limpiar payload: solo campos que el modelo backend acepta
    const payload = {
      nombre: form.nombre.trim(),
      especie: form.especie,
      raza: form.raza || null,
      sexo: form.sexo || null,
      peso: form.peso !== '' ? parseFloat(form.peso) : null,
      edad: (anios > 0 || meses > 0) ? parseFloat(edadDecimal.toFixed(2)) : null,
      propietario_id: parseInt(form.propietario_id),
    }

    setSaving(true)
    try {
      if (editing) {
        await api.put(`pacientes/${editing.id}`, payload)
        toast.success('Paciente actualizado')
      } else {
        await api.post('pacientes', payload)
        toast.success('Paciente registrado')
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
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este paciente?')) return
    try {
      await api.delete(`pacientes/${id}`)
      toast.success('Paciente eliminado')
      loadAll()
    } catch { toast.error('No se pudo eliminar') }
  }

  const filtered = pacientes.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    p.especie.toLowerCase().includes(search.toLowerCase()) ||
    (p.propietario_nombre || '').toLowerCase().includes(search.toLowerCase())
  )

  const getPropietarioNombre = (id) => propietarios.find(p => p.id === id)?.nombre || '-'

  if (loading) return <div className="page-loader"><div className="spinner" /><span>Cargando...</span></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Pacientes</h1>
          <p className="page-subtitle">{pacientes.length} mascota(s) registrada(s)</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> Nuevo Paciente
          </button>
        )}
      </div>

      {/* Búsqueda */}
      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search size={15} />
          <input
            className="form-input"
            placeholder="Buscar por nombre, especie o propietario..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Especie / Raza</th>
                <th>Edad</th>
                <th>Sexo</th>
                <th>Peso</th>
                <th>Propietario</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty-state">
                    <PawPrint size={36} />
                    <p>No se encontraron pacientes</p>
                  </div>
                </td></tr>
              ) : filtered.map((p, i) => (
                <tr key={p.id}>
                  <td className="text-muted text-xs">{i + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        width: 32, height: 32, background: 'var(--bg-secondary)',
                        borderRadius: '50%', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', flexShrink: 0, fontSize: 14
                      }}>
                        {p.especie === 'Perro' ? '🐕' : p.especie === 'Gato' ? '🐈' :
                          p.especie === 'Ave' ? '🐦' : p.especie === 'Conejo' ? '🐇' : '🐾'}
                      </span>
                      <span className="font-medium">{p.nombre}</span>
                    </div>
                  </td>
                  <td>
                    <div>{p.especie}</div>
                    <div className="text-xs text-muted">{p.raza || '-'}</div>
                  </td>
                  <td>
                    {p.edad_anios || p.edad_meses
                      ? `${p.edad_anios || 0}a ${p.edad_meses || 0}m`
                      : '-'}
                  </td>
                  <td>
                    {p.sexo ? (
                      <span className={`badge ${p.sexo === 'macho' ? 'badge-blue' : 'badge-terracota'}`}>
                        {p.sexo === 'macho' ? '♂' : '♀'} {p.sexo}
                      </span>
                    ) : '-'}
                  </td>
                  <td>{p.peso ? `${p.peso} kg` : '-'}</td>
                  <td>{p.propietario_nombre || getPropietarioNombre(p.propietario_id)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-icon" title="Ver" onClick={() => setViewModal(p)}><Eye size={14} /></button>
                      {isAdmin && <>
                        <button className="btn-icon" title="Editar" onClick={() => openEdit(p)}><Edit2 size={14} /></button>
                        <button className="btn-icon" title="Eliminar" onClick={() => handleDelete(p.id)}
                          style={{ color: 'var(--error)' }}><Trash2 size={14} /></button>
                      </>}
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
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editing ? 'Editar Paciente' : 'Nuevo Paciente'}</h3>
              <button className="btn-icon" onClick={() => setModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Nombre *</label>
                    <input className="form-input" value={form.nombre}
                      onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Firulais" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Especie *</label>
                    <select className="form-select" value={form.especie}
                      onChange={e => setForm({ ...form, especie: e.target.value })}>
                      <option value="">Seleccionar...</option>
                      {ESPECIES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Raza</label>
                    <input className="form-input" value={form.raza}
                      onChange={e => setForm({ ...form, raza: e.target.value })} placeholder="Ej: Labrador" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Color</label>
                    <input className="form-input" value={form.color}
                      onChange={e => setForm({ ...form, color: e.target.value })} placeholder="Ej: Café" />
                  </div>
                </div>
                <div className="form-row-3">
                  <div className="form-group">
                    <label className="form-label">Edad (años)</label>
                    <input type="number" min="0" className="form-input" value={form.edad_anios}
                      onChange={e => setForm({ ...form, edad_anios: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Edad (meses)</label>
                    <input type="number" min="0" max="11" className="form-input" value={form.edad_meses}
                      onChange={e => setForm({ ...form, edad_meses: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Peso (kg)</label>
                    <input type="number" step="0.01" min="0" className="form-input" value={form.peso}
                      onChange={e => setForm({ ...form, peso: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Sexo</label>
                    <select className="form-select" value={form.sexo}
                      onChange={e => setForm({ ...form, sexo: e.target.value })}>
                      <option value="">Seleccionar...</option>
                      <option value="macho">Macho</option>
                      <option value="hembra">Hembra</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Propietario *</label>
                    <select className="form-select" value={form.propietario_id}
                      onChange={e => setForm({ ...form, propietario_id: e.target.value })}>
                      <option value="">Seleccionar...</option>
                      {propietarios.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Observaciones</label>
                  <textarea className="form-textarea" value={form.observaciones}
                    onChange={e => setForm({ ...form, observaciones: e.target.value })}
                    placeholder="Notas adicionales..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Guardando...</> : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver */}
      {viewModal && (
        <div className="modal-overlay" onClick={() => setViewModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🐾 {viewModal.nombre}</h3>
              <button className="btn-icon" onClick={() => setViewModal(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
                {[
                  ['Especie', viewModal.especie],
                  ['Raza', viewModal.raza || '-'],
                  ['Sexo', viewModal.sexo || '-'],
                  ['Color', viewModal.color || '-'],
                  ['Edad', `${viewModal.edad_anios || 0} años ${viewModal.edad_meses || 0} meses`],
                  ['Peso', viewModal.peso ? `${viewModal.peso} kg` : '-'],
                  ['Propietario', viewModal.propietario_nombre || '-'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="text-xs text-muted font-medium" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{k}</div>
                    <div className="font-medium">{v}</div>
                  </div>
                ))}
              </div>
              {viewModal.observaciones && (
                <div style={{ marginTop: 16, padding: '12px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <div className="text-xs text-muted font-medium" style={{ marginBottom: 4 }}>OBSERVACIONES</div>
                  <p style={{ fontSize: '0.875rem' }}>{viewModal.observaciones}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}