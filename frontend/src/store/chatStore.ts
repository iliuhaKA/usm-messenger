import { create } from 'zustand';

interface ChatUiState {
  activeChatId: number | null;
  setActiveChatId: (id: number | null) => void;
}

export const useChatStore = create<ChatUiState>((set) => ({
  activeChatId: null,
  setActiveChatId: (id) => set({ activeChatId: id }),
}));
