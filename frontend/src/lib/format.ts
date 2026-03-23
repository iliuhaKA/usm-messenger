/**
 * Spring отдаёт LocalDateTime как ISO без зоны; в Docker JVM часто UTC.
 * Без суффикса Z браузер трактует строку иначе — сдвиг на экране.
 */
export function parseApiDateTime(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const s = iso.trim();
  if (!s) return null;
  if (s.endsWith('Z') || s.endsWith('z') || /[+-]\d{2}:\d{2}$/.test(s)) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,9})?$/.test(s)) {
    const d = new Date(`${s}Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatMessageTime(iso: string | null | undefined): string {
  const d = parseApiDateTime(iso);
  if (!d) return '';
  return d.toLocaleTimeString('ro-MD', { hour: '2-digit', minute: '2-digit' });
}

export function formatMessageDateLabel(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = parseApiDateTime(iso);
  if (!d) return '';
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) return formatMessageTime(iso);
  return d.toLocaleDateString('ro-MD', { day: 'numeric', month: 'short' });
}
