import { Client, type IMessage } from '@stomp/stompjs';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import SockJS from 'sockjs-client';

import { markChatRead } from '../../api/chats.api';
import { useChats } from '../../hooks/useChats';
import { normalizeStompMessage } from '../../lib/normalizeStompMessage';
import { playNotificationSound, primeNotificationAudio } from '../../lib/playNotificationSound';
import { getWsBaseUrl } from '../../lib/wsBaseUrl';
import { useAuthStore } from '../../store/authStore';
import type { Message } from '../../types/message.types';

function appendMessage(
  qc: ReturnType<typeof useQueryClient>,
  chatId: number,
  uid: number,
  msg: Message
) {
  qc.setQueryData<Message[]>(['messages', chatId, uid], (old) => {
    if (!old) return [msg];
    if (old.some((m) => m.id === msg.id)) return old;
    return [...old, msg];
  });
}

export function ChatStompBridge() {
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? null;
  const { data: chats } = useChats(uid);
  const qc = useQueryClient();

  const uidRef = useRef(uid);

  useEffect(() => {
    uidRef.current = uid;
  }, [uid]);

  useEffect(() => {
    const onFirstClick = () => {
      primeNotificationAudio();
      window.removeEventListener('click', onFirstClick);
    };
    window.addEventListener('click', onFirstClick);
    return () => window.removeEventListener('click', onFirstClick);
  }, []);

  const chatIdsKey = useMemo(
    () => chats?.map((c) => c.id).sort((a, b) => a - b).join(',') ?? '',
    [chats]
  );

  const onStompMessage = useCallback(
    (frame: IMessage) => {
      const myUid = uidRef.current;
      if (!myUid) return;
      let parsed: unknown;
      try {
        parsed = JSON.parse(frame.body);
      } catch {
        return;
      }
      const msg = normalizeStompMessage(parsed);
      if (!msg) return;

      const path = window.location.pathname.match(/\/chat\/(\d+)/);
      const active = path ? Number(path[1]) : null;

      const isOwn = msg.senderId === myUid;
      const isActive = active != null && Number.isFinite(active) && msg.chatId === active;

      void (async () => {
        if (isActive) {
          appendMessage(qc, msg.chatId, myUid, msg);
          if (!isOwn) {
            await markChatRead(msg.chatId);
          }
        } else {
          qc.invalidateQueries({ queryKey: ['messages', msg.chatId, myUid] });
        }

        if (
          !isOwn &&
          (active !== msg.chatId || document.visibilityState === 'hidden')
        ) {
          playNotificationSound();
        }

        qc.invalidateQueries({ queryKey: ['chats', myUid] });
      })();
    },
    [qc]
  );

  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!uid || !chatIdsKey) return;

    const base = getWsBaseUrl();
    const sockUrl = `${base.replace(/\/$/, '')}/ws`;

    if (import.meta.env.DEV) {
      console.info('[stomp] connecting to', sockUrl);
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(sockUrl) as unknown as WebSocket,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 4000,
      heartbeatIncoming: 15000,
      heartbeatOutgoing: 15000,
      onConnect: () => {
        if (import.meta.env.DEV) {
          console.info('[stomp] connected, subscribing to chats:', chatIdsKey);
        }
        chatIdsKey
          .split(',')
          .filter(Boolean)
          .map(Number)
          .forEach((id) => {
            client.subscribe(`/topic/chats/${id}/messages`, onStompMessage);
          });
      },
      onStompError: (frame) => {
        console.error('[stomp] broker error', frame.headers?.message, frame.body);
      },
      onWebSocketError: (e) => {
        console.error('[stomp] websocket error', e);
      },
    });

    client.activate();

    return () => {
      void client.deactivate();
    };
  }, [uid, chatIdsKey, onStompMessage, token]);

  return null;
}
