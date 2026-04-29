import { ArrowLeft, Bell, LogOut, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useLogout } from '../hooks/useAuth';

const SOUND_KEY = 'usm-notification-sound';

export function SettingsPage() {
  const navigate = useNavigate();
  const logoutMutation = useLogout();

  const [soundOn, setSoundOn] = useState(() => {
    try {
      return localStorage.getItem(SOUND_KEY) !== '0';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SOUND_KEY, soundOn ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [soundOn]);

  const onLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => navigate('/login', { replace: true }),
    });
  };

  return (
    <div className="min-h-screen bg-[var(--color-chat-bg)]">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Link
          to="/chat"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-main"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к чатам
        </Link>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h1 className="mb-6 text-xl font-semibold text-text-main">Настройки</h1>

          <Section title="Уведомления">
            <Toggle
              icon={<Bell className="h-5 w-5 text-primary" />}
              label="Звук новых сообщений"
              description="Воспроизводить короткий сигнал при получении сообщения"
              checked={soundOn}
              onChange={setSoundOn}
            />
          </Section>

          <Section title="Внешний вид">
            <Toggle
              icon={<Sun className="h-5 w-5 text-primary" />}
              label="Светлая тема"
              description="Тёмная тема — в разработке"
              checked
              disabled
              onChange={() => undefined}
            />
            <Toggle
              icon={<Moon className="h-5 w-5 text-text-muted" />}
              label="Тёмная тема"
              description="В разработке"
              checked={false}
              disabled
              onChange={() => undefined}
            />
          </Section>

          <Section title="Аккаунт">
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-xl border border-accent-red/30 bg-accent-red/5 px-4 py-3 text-left text-sm text-accent-red hover:bg-accent-red/10"
            >
              <LogOut className="h-5 w-5" />
              <span className="flex-1 font-medium">Выйти из аккаунта</span>
            </button>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">{title}</h2>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function Toggle({
  icon,
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className={`flex items-center gap-3 rounded-xl border border-black/10 px-4 py-3 transition-colors ${
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-black/5'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-text-main">{label}</div>
        {description && <div className="text-xs text-text-muted">{description}</div>}
      </div>
      <input
        type="checkbox"
        className="h-5 w-5 cursor-pointer accent-primary disabled:cursor-not-allowed"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
