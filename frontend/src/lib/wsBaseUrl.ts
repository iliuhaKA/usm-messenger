/**
 * Origin бэкенда для SockJS (путь `/ws` на том же хосте, что и REST).
 *
 * Приоритет:
 * 1) `VITE_BACKEND_ORIGIN` — явно, напр. http://localhost:8080
 * 2) `VITE_WS_URL` — ws:// или http(s)://…/ws → берём origin
 * 3) Абсолютный `VITE_API_URL` → origin (8080)
 * 4) Относительный `/api` → `window.location.origin` (нужен proxy в vite на /api и /ws)
 */
export function getWsBaseUrl(): string {
  const backend = import.meta.env.VITE_BACKEND_ORIGIN?.trim();
  if (backend) return backend.replace(/\/$/, '');

  const wsUrl = import.meta.env.VITE_WS_URL?.trim();
  if (wsUrl) {
    try {
      const normalized = wsUrl.startsWith('ws:')
        ? 'http:' + wsUrl.slice(3)
        : wsUrl.startsWith('wss:')
          ? 'https:' + wsUrl.slice(4)
          : wsUrl;
      return new URL(normalized).origin;
    } catch {
      /* fallthrough */
    }
  }

  const api = import.meta.env.VITE_API_URL || 'https://localhost:8443/api';
  if (api.startsWith('http://') || api.startsWith('https://')) {
    return new URL(api).origin;
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'https://localhost:8443';
}
