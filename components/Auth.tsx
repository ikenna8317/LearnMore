import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card } from './UIComponents';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const { login, signup } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (!formData.name || !formData.email || !formData.password) {
            throw new Error('All fields are required.');
        }
        await signup(formData.email, formData.password, formData.name);
      } else {
        if (!formData.email || !formData.password) {
            throw new Error('Email and password are required.');
        }
        await login(formData.email, formData.password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-indigo-200 dark:shadow-none shadow-lg">L</div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
                {mode === 'login' ? 'Enter your details to access your study materials.' : 'Start your learning journey with AI-powered tools.'}
            </p>
        </div>

        <Card className="shadow-xl shadow-slate-200/50 dark:shadow-none border-slate-200 dark:border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="you@example.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <input
                type="password"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-900/30 flex items-center gap-2">
                ⚠️ {error}
              </div>
            )}

            <Button className="w-full justify-center" size="lg" isLoading={isLoading}>
              {mode === 'login' ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 text-center text-sm">
            <span className="text-slate-500 dark:text-slate-400">
                {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button 
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
                className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline"
            >
                {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
