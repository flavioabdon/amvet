import { useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import React from 'react';
import { Plus, Search, Users, Edit2, Trash2, X, Eye } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const INITIAL = { nombre: '', ci: '', telefono: '', direccion: '', correo: '', password: '' }

export default function Propietarios() {
  const { isAdmin } = useAuth()
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(INITIAL)
  const [saving, setSaving] = useState(false)
  const [viewModal, setViewModal] = useState(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const res = await api.get('/propietarios/')
      setItems(res.data)
    } catch { toast.error('Error al cargar') }
    finally { setLoading(false) }
  }

  const openCreate = () => { setEditing(null); setForm(INITIAL); setModal(true) }
  const openEdit = (p) => {
    setEditing(p)
    setForm({ nombre: p.nombre, ci: p.ci || '', telefono: p.telefono || '', direccion: p.direccion || '', correo: p.correo || '', password: '' })
    setModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) { toast.error('El nombre del propietario es obligatorio'); return }
    if (!form.correo.trim()) { toast.error('El correo electrónico es obligatorio'); return }
    if (!editing && !form.password) { toast.error('La contraseña es obligatoria para nuevos propietarios'); return }
    if (!editing && form.password.length < 6) { toast.error('La contraseña debe tener al menos 6 caracteres'); return }

    // Limpiar payload: solo campos que acepta el backend (ci no está en el modelo)
    const payload = {
      nombre: form.nombre.trim(),
      correo: form.correo.trim(),
      telefono: form.telefono || null,
      direccion: form.direccion || null,
      password: form.password || null,
    }

    setSaving(true)
    try {
      if (editing) {
        await api.put(`propietarios/${editing.id}`, payload)
        toast.success('Propietario actualizado')
      } else {
        await api.post('propietarios', payload)
        toast.success('Propietario registrado')
      }
      setModal(false); load()
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
    if (!confirm('¿Eliminar este propietario y todos sus datos?')) return
    try {
      await api.delete(`/propietarios/${id}`)
      toast.success('Eliminado'); load()
    } catch { toast.error('No se pudo eliminar') }
  }

  const filtered = items.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (p.correo || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.telefono || '').includes(search)
  )

  if (loading) return <div className="page-loader"><div className="spinner" /><span>Cargando...</span></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Propietarios</h1>
          <p className="page-subtitle">{items.length} propietario(s) registrado(s)</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> Nuevo Propietario
          </button>
        )}
      </div>

      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search size={15} />
          <input className="form-input" placeholder="Buscar por nombre, correo o teléfono..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>C.I.</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th>Dirección</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><Users size={36} /><p>Sin propietarios</p></div></td></tr>
              ) : filtered.map((p, i) => (
                <tr key={p.id}>
                  <td className="text-muted text-xs">{i + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'var(--accent-green)', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 600, flexShrink: 0
                      }}>{p.nombre.charAt(0).toUpperCase()}</div>
                      <span className="font-medium">{p.nombre}</span>
                    </div>
                  </td>
                  <td>{p.ci || '-'}</td>
                  <td>{p.telefono || '-'}</td>
                  <td>{p.correo || '-'}</td>
                  <td className="truncate" style={{ maxWidth: 180 }}>{p.direccion || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-icon" onClick={() => setViewModal(p)}><Eye size={14} /></button>
                      {isAdmin && <>
                        <button className="btn-icon" onClick={() => openEdit(p)}><Edit2 size={14} /></button>
                        <button className="btn-icon" style={{ color: 'var(--error)' }} onClick={() => handleDelete(p.id)}><Trash2 size={14} /></button>
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
              <h3 className="modal-title">{editing ? 'Editar Propietario' : 'Nuevo Propietario'}</h3>
              <button className="btn-icon" onClick={() => setModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Nombre completo *</label>
                    <input className="form-input" value={form.nombre}
                      onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Juan Mamani" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">C.I. (Cédula)</label>
                    <input className="form-input" value={form.ci}
                      onChange={e => setForm({ ...form, ci: e.target.value })} placeholder="Ej: 7654321" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Correo electrónico *</label>
                    <input type="email" className="form-input" value={form.correo}
                      onChange={e => setForm({ ...form, correo: e.target.value })} placeholder="correo@ejemplo.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teléfono / Celular</label>
                    <input className="form-input" value={form.telefono}
                      onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="Ej: 72345678" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Dirección</label>
                  <input className="form-input" value={form.direccion}
                    onChange={e => setForm({ ...form, direccion: e.target.value })} placeholder="Ej: Calle Bolívar #123, Oruro" />
                </div>
                {!editing && (
                  <div className="form-group">
                    <label className="form-label">Contraseña (acceso al sistema) *</label>
                    <input type="password" className="form-input" value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar'}
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
              <h3 className="modal-title">👤 {viewModal.nombre}</h3>
              <button className="btn-icon" onClick={() => setViewModal(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
                {[
                  ['C.I.', viewModal.ci || '-'],
                  ['Teléfono', viewModal.telefono || '-'],
                  ['Correo', viewModal.correo || '-'],
                  ['Dirección', viewModal.direccion || '-'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="text-xs text-muted font-medium" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{k}</div>
                    <div className="font-medium">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}