import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth';
import { Mail, Lock } from 'lucide-react';
import { logger } from '../utils/logger';

const ROLES: { label: string; value: UserRole }[] = [
  { label: 'Usuario', value: 'user' },
  { label: 'Monitor Deportivo', value: 'instructor' },
];

type AuthMode = 'login' | 'register';

export function Auth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = React.useState<AuthMode>('login');
  const [selectedRole, setSelectedRole] = React.useState<UserRole>('user');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (user) {
      navigate('/profile');
    }
  }, [user, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        logger.info('Attempting login', { email });
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        logger.info('Login successful');
        navigate('/profile');
      } else {
        logger.info('Attempting registration', { email, role: selectedRole });
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role: selectedRole },
          },
        });

        if (error) throw error;
        
        logger.info('Registration successful');
        navigate('/profile');
      }
    } catch (err: any) {
      logger.error('Authentication error', { error: err });
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center mb-8">
        {mode === 'login' ? t('common.login') : t('common.register')}
      </h1>
      
      {/* Selector de modo */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setMode('login')}
            className={`p-3 rounded-lg border-2 transition-colors ${
              mode === 'login'
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 hover:border-indigo-200'
            }`}
          >
            {t('common.login')}
          </button>
          <button
            onClick={() => setMode('register')}
            className={`p-3 rounded-lg border-2 transition-colors ${
              mode === 'register'
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 hover:border-indigo-200'
            }`}
          >
            {t('common.register')}
          </button>
        </div>
      </div>

      {/* Selector de rol (solo para registro) */}
      {mode === 'register' && <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-4">Tipo de Cuenta</h2>
        <div className="grid grid-cols-2 gap-4">
          {ROLES.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setSelectedRole(value)}
              className={`p-4 rounded-lg border-2 transition-colors ${
                selectedRole === value
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 hover:border-indigo-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-4 text-sm text-gray-600">
          {selectedRole === 'instructor'
            ? 'Como monitor podrás crear y gestionar eventos deportivos.'
            : 'Como usuario podrás inscribirte en eventos y valorar a los monitores.'}
        </p>
      </div>}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.email')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.password')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isLoading ? t('common.loading') : mode === 'login' ? t('common.login') : t('common.register')}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">O continúa con</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
            className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Google
          </button>
        </form>
      </div>
    </div>
  );
}