import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import React from 'react';
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Pacientes from './pages/Pacientes'
import Propietarios from './pages/Propietarios'
import Citas from './pages/Citas'
import Historial from './pages/Historial'
import Recetas from './pages/Recetas'
import Inventario from './pages/Inventario'
import Seguimiento from './pages/Seguimiento'
import Examenes from './pages/Examenes'
import Reportes from './pages/Reportes'

const AppLayout = ({ children }) => (
  <div className="app-layout">
    <Sidebar />
    <div className="main-content">
      <Navbar />
      <div className="page-container">
        {children}
      </div>
    </div>
  </div>
)

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '0.875rem',
              borderRadius: '8px',
              border: '1px solid #DDD8CC',
            },
            success: { iconTheme: { primary: '#4A7C59', secondary: '#fff' } },
            error: { iconTheme: { primary: '#C4622D', secondary: '#fff' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <PrivateRoute>
              <AppLayout><Dashboard /></AppLayout>
            </PrivateRoute>
          } />
          <Route path="/pacientes" element={
            <PrivateRoute><AppLayout><Pacientes /></AppLayout></PrivateRoute>
          } />
          <Route path="/propietarios" element={
            <PrivateRoute><AppLayout><Propietarios /></AppLayout></PrivateRoute>
          } />
          <Route path="/citas" element={
            <PrivateRoute><AppLayout><Citas /></AppLayout></PrivateRoute>
          } />
          <Route path="/historial" element={
            <PrivateRoute><AppLayout><Historial /></AppLayout></PrivateRoute>
          } />
          <Route path="/recetas" element={
            <PrivateRoute><AppLayout><Recetas /></AppLayout></PrivateRoute>
          } />
          <Route path="/inventario" element={
            <PrivateRoute adminOnly><AppLayout><Inventario /></AppLayout></PrivateRoute>
          } />
          <Route path="/seguimiento" element={
            <PrivateRoute><AppLayout><Seguimiento /></AppLayout></PrivateRoute>
          } />
          <Route path="/examenes" element={
            <PrivateRoute><AppLayout><Examenes /></AppLayout></PrivateRoute>
          } />
          <Route path="/reportes" element={
            <PrivateRoute adminOnly><AppLayout><Reportes /></AppLayout></PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}