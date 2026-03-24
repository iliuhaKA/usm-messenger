import axios from 'axios';
import { KeyRound, UserRound } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

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

  const err = login.isError && axios.isAxiosError(login.error)
    ? String(login.error.response?.data?.message ?? login.error.message)
    : null;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-login-bg)] px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0.06) 45%, transparent 45%),
            linear-gradient(225deg, transparent 50%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.05) 55%, transparent 55%),
            linear-gradient(315deg, rgba(0,0,0,0.12) 0%, transparent 60%)
          `,
        }}
      />

      <div className="relative z-10 w-full max-w-md rounded-3xl bg-white px-8 py-10 shadow-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/usm.png" alt="" className="mb-4 h-14 w-14" />
          <h1 className="text-xl font-bold text-text-main">Войти в систему</h1>
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
                placeholder="Введите логин или емаил"
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
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex min-h-[17px] justify-center">
            <Link to="#" className="text-xs text-primary/80 hover:underline" onClick={(e) => e.preventDefault()}>
              Забыли пароль?
            </Link>
          </div>

          {err && <p className="text-center text-sm text-accent-red">{err}</p>}

          <div className="flex justify-center pt-1">
            <button
              type="submit"
              disabled={login.isPending}
              className="rounded-full bg-primary px-12 py-2.5 text-sm font-semibold text-white shadow hover:opacity-90 disabled:opacity-60"
            >
              {login.isPending ? '…' : 'Войти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
