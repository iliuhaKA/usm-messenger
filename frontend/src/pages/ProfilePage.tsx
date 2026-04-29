import { ArrowLeft, Camera } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { uploadUserAvatar } from '../api/files.api';
import {
  changePassword as apiChangePassword,
  setUserAvatar,
  updateProfile,
} from '../api/users.api';
import { Avatar } from '../components/Avatar';
import { useAuthStore } from '../store/authStore';
import { cn } from '../utils/cn';

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  const onAvatarPick = () => fileInputRef.current?.click();

  const onAvatarChosen = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const fileId = await uploadUserAvatar(file);
      const updated = await setUserAvatar(fileId);
      setUser(updated);
    } catch {
      /* ignore */
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const updated = await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
      });
      setUser(updated);
      setProfileMsg({ type: 'ok', text: 'Профиль обновлён' });
    } catch {
      setProfileMsg({ type: 'err', text: 'Не удалось обновить профиль' });
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePwd = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentPassword || newPassword.length < 6) return;
    setSavingPwd(true);
    setPwdMsg(null);
    try {
      await apiChangePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setPwdMsg({ type: 'ok', text: 'Пароль изменён' });
    } catch {
      setPwdMsg({ type: 'err', text: 'Не удалось сменить пароль (проверьте текущий)' });
    } finally {
      setSavingPwd(false);
    }
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
          <h1 className="mb-6 text-xl font-semibold text-text-main">Профиль</h1>

          <div className="mb-6 flex items-center gap-4">
            <button
              type="button"
              onClick={onAvatarPick}
              disabled={uploading}
              className="group relative"
              aria-label="Изменить аватар"
            >
              <Avatar
                name={`${user.firstName} ${user.lastName}`}
                fileId={user.avatarFileId}
                url={user.avatarUrl}
                size="xl"
              />
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="h-6 w-6" />
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onAvatarChosen(e.target.files?.[0])}
            />
            <div>
              <h2 className="font-medium text-text-main">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-sm text-text-muted">{user.role}</p>
              {uploading && <p className="text-xs text-text-muted">Загрузка аватара…</p>}
            </div>
          </div>

          <form onSubmit={onSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Имя">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none ring-primary focus:ring-2"
                />
              </Field>
              <Field label="Фамилия">
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none ring-primary focus:ring-2"
                />
              </Field>
            </div>
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none ring-primary focus:ring-2"
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="IDNP">
                <input
                  type="text"
                  value={user.idnp ?? '—'}
                  readOnly
                  className="w-full rounded-xl border border-black/10 bg-black/5 px-3 py-2 text-sm text-text-muted"
                />
              </Field>
              <Field label="Роль">
                <input
                  type="text"
                  value={user.role}
                  readOnly
                  className="w-full rounded-xl border border-black/10 bg-black/5 px-3 py-2 text-sm text-text-muted"
                />
              </Field>
            </div>

            {profileMsg && (
              <p
                className={cn(
                  'text-sm',
                  profileMsg.type === 'ok' ? 'text-emerald-600' : 'text-accent-red'
                )}
              >
                {profileMsg.text}
              </p>
            )}

            <button
              type="submit"
              disabled={savingProfile || !firstName.trim() || !lastName.trim()}
              className="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {savingProfile ? 'Сохраняю…' : 'Сохранить'}
            </button>
          </form>
        </div>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-4 text-lg font-semibold text-text-main">Смена пароля</h2>
          <form onSubmit={onChangePwd} className="space-y-4">
            <Field label="Текущий пароль">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none ring-primary focus:ring-2"
              />
            </Field>
            <Field label="Новый пароль">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none ring-primary focus:ring-2"
              />
              <p className="mt-1 text-xs text-text-muted">Минимум 6 символов</p>
            </Field>

            {pwdMsg && (
              <p
                className={cn(
                  'text-sm',
                  pwdMsg.type === 'ok' ? 'text-emerald-600' : 'text-accent-red'
                )}
              >
                {pwdMsg.text}
              </p>
            )}

            <button
              type="submit"
              disabled={savingPwd || !currentPassword || newPassword.length < 6}
              className="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {savingPwd ? 'Сохраняю…' : 'Сменить пароль'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-text-main">{label}</span>
      {children}
    </label>
  );
}
