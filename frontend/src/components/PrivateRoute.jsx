import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import React from 'react';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAdmin } = useAuth();

  // 1. MIENTRAS CARGA: No redireccionar, mostrar un indicador de carga
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner">Cargando AMVet...</div>
      </div>
    );
  }

  // 2. SI NO HAY USUARIO: Mandar al login
  if (!user) {
    return <Navigate to="/login" />;
  }

  // 3. SI ES RUTA DE ADMIN Y NO LO ES: Mandar al dashboard (o raíz)
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" />;
  }

  // 4. SI TODO ESTÁ BIEN: Mostrar el contenido
  return children;
};

export default PrivateRoute;