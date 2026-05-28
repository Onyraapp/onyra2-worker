// src/hooks/useAuth.js
'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { getClient } from '../lib/supabase';
import { getUsuarioActual } from '../lib/data';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const sb = getClient();

    // Cargar sesión inicial
    sb.auth.getSession().then(({ data: { session } }) => {
      if (session) cargarUsuario();
      else setCargando(false);
    });

    // Escuchar cambios de auth
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      if (session) cargarUsuario();
      else { setUsuario(null); setCargando(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function cargarUsuario() {
    try {
      const u = await getUsuarioActual();
      setUsuario(u);
    } catch {
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, recargar: cargarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
