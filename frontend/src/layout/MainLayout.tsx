import { Outlet } from 'react-router-dom';

import { ChatStompBridge } from '../components/chat/ChatStompBridge';
import { Sidebar } from '../components/chat/Sidebar';

export function MainLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--color-surface)]">
      <ChatStompBridge />
      <Sidebar />
      <main className="min-w-0 flex-1 flex flex-col bg-[var(--color-chat-bg)]">
        <Outlet />
      </main>
    </div>
  );
}
