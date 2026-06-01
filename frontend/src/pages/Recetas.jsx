// ============================================================
// RECETAS.JSX
// ============================================================
import { useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import React from 'react';
import { Plus, FileText, X, Trash2, Printer } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const INITIAL_RECETA = { paciente_id: '', fecha: new Date().toISOString().split('T')[0], indicaciones: '', items: [{ medicamento: '', dosis: '', frecuencia: '', duracion: '', observaciones: '' }] }

export function Recetas() {
  const { isAdmin } = useAuth()
  const [recetas, setRecetas] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(INITIAL_RECETA)
  const [saving, setSaving] = useState(false)
  const [detail, setDetail] = useState(null)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    try {
      const [rRes, pRes] = await Promise.all([api.get('/recetas/'), api.get('/pacientes/')])
      setRecetas(rRes.data); setPacientes(pRes.data)
    } catch { toast.error('Error al cargar') }
    finally { setLoading(false) }
  }

  const addItem = () => setForm({ ...form, items: [...form.items, { medicamento: '', dosis: '', frecuencia: '', duracion: '', observaciones: '' }] })
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) })
  const updateItem = (i, field, val) => {
    const items = [...form.items]; items[i] = { ...items[i], [field]: val }; setForm({ ...form, items })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.paciente_id) { toast.error('Debe seleccionar un paciente'); return }
    if (!form.fecha) { toast.error('La fecha es obligatoria'); return }
    if (form.items.length === 0) { toast.error('Debe agregar al menos un medicamento'); return }

    // Validar que cada item tenga al menos el nombre del medicamento
    const itemsInvalidos = form.items.some(it => !it.medicamento.trim())
    if (itemsInvalidos) { toast.error('Todos los medicamentos deben tener un nombre'); return }

    // Limpiar payload: convertir strings vacíos a null en campos opcionales
    const payload = {
      paciente_id: parseInt(form.paciente_id),
      fecha: form.fecha,
      indicaciones: form.indicaciones || null,
      items: form.items.map(it => ({
        medicamento: it.medicamento.trim(),
        dosis: it.dosis || null,
        frecuencia: it.frecuencia || null,
        duracion: it.duracion || null,
        observaciones: it.observaciones || null,
      })),
    }

    setSaving(true)
    try {
      await api.post('/recetas/', payload)
      toast.success('Receta emitida'); setModal(false); setForm(INITIAL_RECETA); loadAll()
    } catch (err) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        toast.error(detail.map(d => d.msg).join(', '))
      } else {
        toast.error(detail || 'Error al emitir receta')
      }
    } finally { setSaving(false) }
  }

  const getPacienteNombre = (id) => pacientes.find(p => p.id === id)?.nombre || 'Desconocido'

  if (loading) return <div className="page-loader"><div className="spinner" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Recetas Médicas</h1>
          <p className="page-subtitle">{recetas.length} receta(s) emitida(s)</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={() => { setForm(INITIAL_RECETA); setModal(true) }}><Plus size={16} /> Nueva Receta</button>}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>#</th><th>Fecha</th><th>Paciente</th><th>Medicamentos</th><th>Acciones</th></tr></thead>
            <tbody>
              {recetas.length === 0
                ? <tr><td colSpan={5}><div className="empty-state"><FileText size={36} /><p>Sin recetas</p></div></td></tr>
                : recetas.map((r, i) => (
                  <tr key={r.id}>
                    <td className="text-muted text-xs">{i + 1}</td>
                    <td>{r.fecha}</td>
                    <td className="font-medium">{getPacienteNombre(r.paciente_id)}</td>
                    <td>{r.items?.length || 0} medicamento(s)</td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => setDetail(r)}>Ver Receta</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Nueva Receta Médica</h3>
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
                    <label className="form-label">Fecha</label>
                    <input type="date" className="form-input" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Indicaciones generales</label>
                  <textarea className="form-textarea" value={form.indicaciones} onChange={e => setForm({ ...form, indicaciones: e.target.value })} placeholder="Indicaciones para el propietario..." />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Medicamentos</label>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={addItem}><Plus size={13} /> Agregar</button>
                </div>
                {form.items.map((item, i) => (
                  <div key={i} style={{ padding: 14, background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 10, position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 8, right: 8 }}>
                      {form.items.length > 1 && <button type="button" className="btn-icon" onClick={() => removeItem(i)}><Trash2 size={13} /></button>}
                    </div>
                    <div className="form-row">
                      <div className="form-group"><label className="form-label">Medicamento</label>
                        <input className="form-input" value={item.medicamento} onChange={e => updateItem(i, 'medicamento', e.target.value)} placeholder="Ej: Amoxicilina 500mg" /></div>
                      <div className="form-group"><label className="form-label">Dosis</label>
                        <input className="form-input" value={item.dosis} onChange={e => updateItem(i, 'dosis', e.target.value)} placeholder="Ej: 1 comprimido" /></div>
                    </div>
                    <div className="form-row">
                      <div className="form-group"><label className="form-label">Frecuencia</label>
                        <input className="form-input" value={item.frecuencia} onChange={e => updateItem(i, 'frecuencia', e.target.value)} placeholder="Ej: Cada 8 horas" /></div>
                      <div className="form-group"><label className="form-label">Duración</label>
                        <input className="form-input" value={item.duracion} onChange={e => updateItem(i, 'duracion', e.target.value)} placeholder="Ej: 7 días" /></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Emitiendo...' : 'Emitir Receta'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🩺 Receta Médica Veterinaria</h3>
              <button className="btn-icon" onClick={() => setDetail(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div style={{ border: '2px solid var(--border)', borderRadius: 10, padding: 20 }}>
                <div style={{ textAlign: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem' }}>Clínica Veterinaria AMVet</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Oruro, Bolivia</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.875rem' }}>
                  <div><strong>Paciente:</strong> {getPacienteNombre(detail.paciente_id)}</div>
                  <div><strong>Fecha:</strong> {detail.fecha}</div>
                </div>
                {detail.indicaciones && <div style={{ background: 'var(--bg-secondary)', padding: 10, borderRadius: 6, marginBottom: 12, fontSize: '0.875rem' }}><strong>Indicaciones:</strong> {detail.indicaciones}</div>}
                <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: 'var(--bg-secondary)' }}>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Medicamento</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Dosis</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Frecuencia</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Duración</th>
                  </tr></thead>
                  <tbody>
                    {(detail.items || []).map((it, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '8px' }}>{it.medicamento}</td>
                        <td style={{ padding: '8px' }}>{it.dosis}</td>
                        <td style={{ padding: '8px' }}>{it.frecuencia}</td>
                        <td style={{ padding: '8px' }}>{it.duracion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: 24, textAlign: 'right', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>Dr. Veterinario AMVet</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Médico Veterinario</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Recetas