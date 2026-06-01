import { useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import React from 'react';
import { Plus, Search, Package, Edit2, X, AlertTriangle } from 'lucide-react'

const CATEGORIAS = ['medicamento', 'vacuna', 'insumo', 'peluqueria', 'otro']
const CAT_LABEL = { medicamento: 'Medicamento', vacuna: 'Vacuna', insumo: 'Insumo', peluqueria: 'Peluquería', otro: 'Otro' }
const CAT_BADGE = { medicamento: 'badge-blue', vacuna: 'badge-green', insumo: 'badge-gray', peluqueria: 'badge-terracota', otro: 'badge-gray' }

const INITIAL = { nombre: '', categoria: 'medicamento', descripcion: '', cantidad: '', cantidad_minima: 5, unidad: '', precio_unitario: '', proveedor: '', fecha_vencimiento: '' }

export default function Inventario() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(INITIAL)
  const [saving, setSaving] = useState(false)
  const [movModal, setMovModal] = useState(null)
  const [movForm, setMovForm] = useState({ tipo: 'entrada', cantidad: '', motivo: '' })

  useEffect(() => { load() }, [])

  const load = async () => {
    try { const res = await api.get('/inventario/'); setItems(res.data) }
    catch { toast.error('Error al cargar') }
    finally { setLoading(false) }
  }

  const openEdit = (item) => {
    setEditing(item)
    setForm({ nombre: item.nombre, categoria: item.categoria, descripcion: item.descripcion || '', cantidad: item.cantidad, cantidad_minima: item.cantidad_minima, unidad: item.unidad || '', precio_unitario: item.precio_unitario || '', proveedor: item.proveedor || '', fecha_vencimiento: item.fecha_vencimiento || '' })
    setModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) { toast.error('El nombre es obligatorio'); return }
    if (form.cantidad === '') { toast.error('La cantidad es obligatoria'); return }

    // Limpiar payload: convertir strings vacíos a null en campos opcionales
    const payload = {
      nombre: form.nombre.trim(),
      categoria: form.categoria || 'otro',
      descripcion: form.descripcion || null,
      cantidad: parseFloat(form.cantidad) || 0,
      cantidad_minima: parseFloat(form.cantidad_minima) || 0,
      unidad: form.unidad || null,
      precio_unitario: form.precio_unitario !== '' ? parseFloat(form.precio_unitario) : null,
      proveedor: form.proveedor || null,
      fecha_vencimiento: form.fecha_vencimiento || null,
    }

    setSaving(true)
    try {
      if (editing) { await api.put(`/inventario/${editing.id}`, payload); toast.success('Actualizado') }
      else { await api.post('/inventario/', payload); toast.success('Producto registrado') }
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

  const handleMovimiento = async (e) => {
    e.preventDefault()
    const cant = parseInt(movForm.cantidad)
    if (!movForm.cantidad || isNaN(cant) || cant < 0) { toast.error('Cantidad inválida'); return }
    
    const payload = {
      tipo: movForm.tipo,
      cantidad: cant,
      motivo: movForm.motivo || null
    }

    try {
      await api.post(`/inventario/${movModal.id}/movimiento`, payload)
      toast.success('Movimiento registrado'); setMovModal(null); load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Error al registrar movimiento') }
  }

  const filtered = items.filter(i =>
    i.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (i.categoria || '').includes(search.toLowerCase())
  )

  const bajoStock = items.filter(i => i.cantidad <= i.cantidad_minima)

  if (loading) return <div className="page-loader"><div className="spinner" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Inventario</h1>
          <p className="page-subtitle">{items.length} producto(s) · {bajoStock.length} con stock bajo</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm(INITIAL); setModal(true) }}>
          <Plus size={16} /> Nuevo Producto
        </button>
      </div>

      {bajoStock.length > 0 && (
        <div style={{ padding: '12px 16px', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.875rem', color: '#92400E' }}>
          <AlertTriangle size={16} />
          <span><strong>{bajoStock.length}</strong> producto(s) con stock bajo o agotado: {bajoStock.map(i => i.nombre).join(', ')}</span>
        </div>
      )}

      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search size={15} />
          <input className="form-input" placeholder="Buscar producto..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Nombre</th><th>Categoría</th><th>Cantidad</th><th>Mín.</th><th>Unidad</th><th>Precio</th><th>Vence</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={9}><div className="empty-state"><Package size={36} /><p>Sin productos</p></div></td></tr>
                : filtered.map(item => {
                  const bajo = item.cantidad <= item.cantidad_minima
                  return (
                    <tr key={item.id}>
                      <td className="font-medium">{item.nombre}</td>
                      <td><span className={`badge ${CAT_BADGE[item.categoria]}`}>{CAT_LABEL[item.categoria]}</span></td>
                      <td>
                        <span style={{ fontWeight: 600, color: bajo ? 'var(--error)' : 'var(--text-primary)' }}>
                          {item.cantidad}
                        </span>
                      </td>
                      <td className="text-muted">{item.cantidad_minima}</td>
                      <td className="text-muted">{item.unidad || '-'}</td>
                      <td>{item.precio_unitario ? `Bs. ${parseFloat(item.precio_unitario).toFixed(2)}` : '-'}</td>
                      <td className="text-sm">{item.fecha_vencimiento || '-'}</td>
                      <td>
                        {bajo
                          ? <span className="badge badge-red">⚠ Bajo</span>
                          : <span className="badge badge-green">OK</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-sm btn-secondary" onClick={() => { setMovModal(item); setMovForm({ tipo: 'entrada', cantidad: '', motivo: '' }) }}>Mov.</button>
                          <button className="btn-icon" onClick={() => openEdit(item)}><Edit2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal producto */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <button className="btn-icon" onClick={() => setModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Nombre *</label>
                    <input className="form-input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Categoría</label>
                    <select className="form-select" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                      {CATEGORIAS.map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row-3">
                  <div className="form-group">
                    <label className="form-label">Cantidad</label>
                    <input type="number" min="0" className="form-input" value={form.cantidad} onChange={e => setForm({ ...form, cantidad: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mín. stock</label>
                    <input type="number" min="0" className="form-input" value={form.cantidad_minima} onChange={e => setForm({ ...form, cantidad_minima: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unidad</label>
                    <input className="form-input" value={form.unidad} onChange={e => setForm({ ...form, unidad: e.target.value })} placeholder="Ej: comprimidos" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Precio unitario (Bs.)</label>
                    <input type="number" step="0.01" min="0" className="form-input" value={form.precio_unitario} onChange={e => setForm({ ...form, precio_unitario: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fecha vencimiento</label>
                    <input type="date" className="form-input" value={form.fecha_vencimiento} onChange={e => setForm({ ...form, fecha_vencimiento: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Proveedor</label>
                  <input className="form-input" value={form.proveedor} onChange={e => setForm({ ...form, proveedor: e.target.value })} placeholder="Nombre del proveedor" />
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

      {/* Modal movimiento */}
      {movModal && (
        <div className="modal-overlay" onClick={() => setMovModal(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Movimiento — {movModal.nombre}</h3>
              <button className="btn-icon" onClick={() => setMovModal(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handleMovimiento}>
              <div className="modal-body">
                <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 16, fontSize: '0.875rem' }}>
                  Stock actual: <strong>{movModal.cantidad} {movModal.unidad || ''}</strong>
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select className="form-select" value={movForm.tipo} onChange={e => setMovForm({ ...movForm, tipo: e.target.value })}>
                    <option value="entrada">Entrada (agregar)</option>
                    <option value="salida">Salida (restar)</option>
                    <option value="ajuste">Ajuste</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Cantidad</label>
                  <input type="number" min="1" className="form-input" value={movForm.cantidad} onChange={e => setMovForm({ ...movForm, cantidad: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Motivo</label>
                  <input className="form-input" value={movForm.motivo} onChange={e => setMovForm({ ...movForm, motivo: e.target.value })} placeholder="Ej: Compra a proveedor" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setMovModal(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}