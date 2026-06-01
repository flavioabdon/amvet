import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'
import React from 'react';

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('amvet_token'))
const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('amvet_user');
    // Si hay algo guardado, lo usamos de inmediato para evitar el parpadeo
    return (saved && saved !== "undefined") ? JSON.parse(saved) : null;
  });
  
  const [loading, setLoading] = useState(!user);

 useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('amvet_token');
      if (savedToken) {
        api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
        try {
          // IMPORTANTE: Asegúrate que esta ruta en el backend exista y funcione
          const res = await api.get('auth/me'); 
          setUser(res.data);
          localStorage.setItem('amvet_user', JSON.stringify(res.data));
        } catch (err) {
          // Si el token no sirve, limpiamos todo
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const fetchMe = async () => {
    try {
      // Ajustado para coincidir con el prefijo /api/auth del backend
      const res = await api.get('/api/auth/me') 
      setUser(res.data)
    } catch {
      logout()
    } finally {
      setLoading(false)
    }
  }

 const login = async (email, password) => {
  const res = await api.post('auth/login', {
    email,
    password
  });

  const t = res.data.access_token;
  
  const userData = {
    nombre: res.data.nombre,
    rol: res.data.rol,
    propietario_id: res.data.propietario_id
  };

  // 2. Persistencia en disco (para cuando el usuario cierre el navegador)
  localStorage.setItem('amvet_token', t);
  localStorage.setItem('amvet_user', JSON.stringify(userData));
  
  // 3. Configuración de Axios para futuras peticiones
  api.defaults.headers.common['Authorization'] = `Bearer ${t}`;

  // --- LOS AJUSTES CLAVE VIENEN AQUÍ ---

  // 4. Actualizamos el estado de React INMEDIATAMENTE
  // Esto hará que los botones de "Agregar" aparezcan al instante sin parpadeos
  setUser(userData); 
  setToken(t);
  
  // 5. IMPORTANTE: Ponemos loading en false al final
  setLoading(false);
  return res.data; // Devolvemos los datos para uso en componentes
};
  const logout = () => {
    localStorage.removeItem('amvet_token')
    delete api.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAdmin: user?.rol === 'admin' }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)