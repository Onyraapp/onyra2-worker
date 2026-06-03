'use client';
import { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setFadeOut(true), 2500);
    const timer2 = setTimeout(() => setVisible(false), 3000);
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: '#0F4C5C',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      transition: 'opacity 0.5s ease',
      opacity: fadeOut ? 0 : 1,
    }}>
      <div style={{
        animation: 'splashPop 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
      }}>
        <img src="/logo.svg" alt="Troco" style={{ width: 200, height: 200 }} />
        <span translate="no" style={{
          color: '#7FFFD4', fontSize: 42, fontWeight: 800,
          letterSpacing: '-0.5px', fontFamily: 'Neonize, sans-serif',
        }}>
          troco
        </span>
      </div>
      <style>{`
        @keyframes splashPop {
          0% { opacity: 0; transform: scale(0.7); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
