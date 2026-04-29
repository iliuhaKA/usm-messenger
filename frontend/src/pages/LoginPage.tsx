import axios from 'axios';
import { KeyRound, UserRound } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { useLogin } from '../hooks/useAuth';
import { cn } from '../utils/cn';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const [loginField, setLoginField] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);

  const emptyLogin = touched && !loginField.trim();
  const emptyPass = touched && !password;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!loginField.trim() || !password) return;
    login.mutate(
      { login: loginField.trim(), password },
      {
        onSuccess: () => navigate('/chat', { replace: true }),
      }
    );
  };

  const err =
    login.isError && axios.isAxiosError(login.error)
      ? String(login.error.response?.data?.message ?? login.error.message)
      : null;

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10"
      style={{
        background:
          'radial-gradient(ellipse at top, rgba(45,90,39,0.95) 0%, rgba(26,61,31,1) 60%, rgba(15,40,18,1) 100%)',
      }}
    >
      {/* Декоративные мягкие пятна для глубины */}
      <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-12 h-80 w-80 rounded-full bg-emerald-300/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-md rounded-3xl bg-white px-8 py-10 shadow-2xl ring-1 ring-black/5">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/usm.png" alt="USM" className="mb-4 h-14 w-14" />
          <h1 className="text-xl font-bold text-text-main">Добро пожаловать</h1>
          <p className="mt-1 text-sm text-text-muted">Войдите в USMessenger</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <div
              className={cn(
                'flex items-center gap-3 rounded-full border-2 bg-white px-4 py-2.5 transition-colors',
                emptyLogin ? 'border-accent-red' : 'border-primary'
              )}
            >
              <UserRound className="h-5 w-5 shrink-0 text-primary" />
              <input
                type="text"
                autoComplete="username"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted"
                placeholder="Логин или email"
                value={loginField}
                onChange={(e) => setLoginField(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div
              className={cn(
                'flex items-center gap-3 rounded-full border-2 bg-white px-4 py-2.5 transition-colors',
                emptyPass ? 'border-accent-red' : 'border-primary'
              )}
            >
              <KeyRound className="h-5 w-5 shrink-0 text-primary" />
              <input
                type="password"
                autoComplete="current-password"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {err && <p className="text-center text-sm text-accent-red">{err}</p>}

          <div className="flex justify-center pt-1">
            <button
              type="submit"
              disabled={login.isPending}
              className="rounded-full bg-primary px-12 py-2.5 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {login.isPending ? 'Входим…' : 'Войти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
