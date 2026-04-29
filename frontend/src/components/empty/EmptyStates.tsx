import { MessageSquarePlus, MessagesSquare, Users } from 'lucide-react';

export function EmptyChats({ onCreate }: { onCreate?: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Users className="h-7 w-7" />
      </div>
      <p className="text-sm font-medium text-text-main">У вас пока нет чатов</p>
      <p className="mt-1 text-xs text-text-muted">
        Создайте первый чат и пригласите участников
      </p>
      {onCreate && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <MessageSquarePlus className="h-4 w-4" />
          Создать чат
        </button>
      )}
    </div>
  );
}

export function NoChatSelected() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MessagesSquare className="h-10 w-10" />
      </div>
      <p className="text-lg font-medium text-text-main">Выберите чат</p>
      <p className="mt-1 max-w-xs text-sm text-text-muted">
        Откройте существующий чат из списка слева или создайте новый
      </p>
    </div>
  );
}

export function EmptyMessages() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MessagesSquare className="h-7 w-7" />
      </div>
      <p className="text-sm font-medium text-text-main">Здесь пока нет сообщений</p>
      <p className="mt-1 text-xs text-text-muted">Напишите первое сообщение, чтобы начать разговор</p>
    </div>
  );
}
