import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import React from 'react'
import { PawPrint, Eye, EyeOff, LogIn } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Completa todos los campos'); return }
    setLoading(true)
    try {
      const userData = await login(email, password)
      toast.success(`¡Bienvenido, ${userData.nombre}!`)
      window.location.href = '/';
    } catch (err) {
      if (err.code === 'ECONNABORTED' || !err.response) {
        toast.error('Error de conexión: El servidor tarda demasiado en responder o no hay internet.')
      } else {
        toast.error(err.response?.data?.detail || 'Credenciales incorrectas')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-bg">
      {/* Decoración */}
      <div className="login-deco" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <PawPrint size={30} />
          </div>
        </div>

        <h1 className="login-title">AMVet</h1>
        <p className="login-subtitle">Sistema de Información Veterinaria</p>
        <p className="login-location">📍 Bolivia</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <input
              type="email"
              className="form-input"
              placeholder="correo@amvet.bo"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingRight: '40px' }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute', right: 11, top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  padding: 0, display: 'flex'
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full login-btn" disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <LogIn size={16} />}
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className="login-hint">
          <p>Médico veterinario: <strong>admin@amvet.bo</strong></p>
          <p>Contraseña: <strong>admin123</strong></p>
        </div>
      </div>

      <style>{`
        .login-bg {
          min-height: 100vh;
          background: var(--bg-sidebar);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .login-deco {
          position: absolute;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(74,124,89,0.25) 0%, transparent 70%);
          top: -100px; right: -100px;
          pointer-events: none;
        }

        .login-card {
          background: var(--bg-card);
          border-radius: 20px;
          padding: 48px 40px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          position: relative;
          z-index: 1;
          text-align: center;
          animation: slideUp 0.3s ease;
        }

        .login-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 12px;
        }

        .login-logo-icon {
          width: 64px; height: 64px;
          background: linear-gradient(135deg, var(--accent-green), var(--accent-green-light));
          border-radius: 18px;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          box-shadow: 0 8px 24px rgba(74,124,89,0.35);
        }

        .login-title {
          font-family: var(--font-display);
          font-size: 2.2rem;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .login-subtitle {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }

        .login-location {
          font-size: 0.78rem;
          color: var(--text-muted);
          margin-bottom: 32px;
        }

        .login-form { text-align: left; }

        .login-btn {
          width: 100%;
          justify-content: center;
          padding: 12px;
          font-size: 0.95rem;
          margin-top: 8px;
          border-radius: var(--radius-sm);
        }

        .login-hint {
          margin-top: 24px;
          padding: 12px 16px;
          background: var(--bg-secondary);
          border-radius: var(--radius-sm);
          font-size: 0.78rem;
          color: var(--text-muted);
          text-align: left;
          line-height: 1.8;
          border: 1px dashed var(--border);
        }
      `}</style>
    </div>
  )
}