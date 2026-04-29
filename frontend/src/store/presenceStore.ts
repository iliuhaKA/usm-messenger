import { create } from 'zustand';

interface PresenceState {
  /** userId -> "ONLINE" | "OFFLINE" */
  statuses: Map<number, string>;
  /** chatId -> Set<userId> кто сейчас печатает */
  typing: Map<number, Set<number>>;

  setStatus: (userId: number, status: string) => void;
  setStatuses: (entries: Record<number, string>) => void;
  setTyping: (chatId: number, userId: number, typing: boolean) => void;
  clearTyping: (chatId: number, userId: number) => void;
  isOnline: (userId: number) => boolean;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  statuses: new Map(),
  typing: new Map(),

  setStatus: (userId, status) =>
    set((s) => {
      const next = new Map(s.statuses);
      next.set(userId, status);
      return { statuses: next };
    }),

  setStatuses: (entries) =>
    set((s) => {
      const next = new Map(s.statuses);
      for (const [k, v] of Object.entries(entries)) {
        next.set(Number(k), v);
      }
      return { statuses: next };
    }),

  setTyping: (chatId, userId, typing) =>
    set((s) => {
      const next = new Map(s.typing);
      const set0 = new Set(next.get(chatId) ?? []);
      if (typing) set0.add(userId);
      else set0.delete(userId);
      next.set(chatId, set0);
      return { typing: next };
    }),

  clearTyping: (chatId, userId) =>
    set((s) => {
      const next = new Map(s.typing);
      const set0 = new Set(next.get(chatId) ?? []);
      set0.delete(userId);
      next.set(chatId, set0);
      return { typing: next };
    }),

  isOnline: (userId) => get().statuses.get(userId) === 'ONLINE',
}));
