// src/hooks/useOnline.js
'use client';
import { useState, useEffect } from 'react';

const COLA_KEY = 'cajasmart_cola_pendiente';

export function useOnline() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const handleOnline  = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return online;
}

export function agregarACola(item) {
  try {
    const cola = JSON.parse(localStorage.getItem(COLA_KEY) || '[]');
    cola.push({ ...item, _timestamp: Date.now() });
    localStorage.setItem(COLA_KEY, JSON.stringify(cola));
  } catch {}
}

export function getCola() {
  try {
    return JSON.parse(localStorage.getItem(COLA_KEY) || '[]');
  } catch { return []; }
}

export function limpiarCola() {
  try { localStorage.removeItem(COLA_KEY); } catch {}
}
