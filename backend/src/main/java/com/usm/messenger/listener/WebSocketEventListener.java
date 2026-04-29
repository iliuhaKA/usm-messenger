package com.usm.messenger.listener;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import com.usm.messenger.security.AuthenticatedUser;
import com.usm.messenger.service.PresenceService;

import lombok.RequiredArgsConstructor;

/**
 * Поднимает/опускает presence пользователя в Redis по событиям WebSocket.
 * Подписчики /topic/presence получают `{userId, status}`.
 */
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final PresenceService presence;
    private final SimpMessagingTemplate broker;

    @EventListener
    public void onConnected(SessionConnectedEvent event) {
        Long userId = extractUserId(event.getUser());
        if (userId == null) return;
        presence.markOnline(userId);
        broker.convertAndSend("/topic/presence", new PresenceUpdate(userId, PresenceService.STATUS_ONLINE));
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        Long userId = extractUserId(event.getUser());
        if (userId == null) return;
        presence.markOffline(userId);
        broker.convertAndSend("/topic/presence", new PresenceUpdate(userId, PresenceService.STATUS_OFFLINE));
    }

    private static Long extractUserId(java.security.Principal principal) {
        if (principal instanceof Authentication auth && auth.getPrincipal() instanceof AuthenticatedUser u) {
            return u.id();
        }
        return null;
    }

    public record PresenceUpdate(Long userId, String status) {}
}
