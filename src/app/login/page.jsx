'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '../../lib/data';
import { useI18n } from '../../hooks/useI18n';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch {
      setError(t('auth.loginError'));
    } finally {
      setLoading(false);
    }
   }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center mb-10">
        <div className="w-16 h-16 rounded-[20px] bg-[#0F4C5C] flex items-center justify-center mb-3">
          <svg width="36" height="36" viewBox="190 40 300 300" xmlns="http://www.w3.org/2000/svg">
            <rect x="190" y="40" width="300" height="300" rx="66" fill="#0F4C5C"/>
            <rect x="255" y="100" width="170" height="13" rx="6.5" fill="#FFFFFF"/>
            <rect x="265" y="140" width="130" height="13" rx="6.5" fill="#7FFFD4"/>
            <rect x="260" y="180" width="150" height="13" rx="6.5" fill="#FFFFFF"/>
            <rect x="255" y="220" width="170" height="13" rx="6.5" fill="#7FFFD4"/>
            <rect x="270" y="260" width="110" height="13" rx="6.5" fill="#FFFFFF" opacity="0.35"/>
          </svg>
        </div>
        <span className="text-2xl font-bold text-t1 trackin
