package com.usm.messenger.controller;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import com.usm.messenger.security.AuthenticatedUser;
import com.usm.messenger.service.PresenceService;
import com.usm.messenger.service.TypingService;

import lombok.RequiredArgsConstructor;

/**
 * STOMP-эндпоинты для лёгких real-time событий, не требующих REST-вызова.
 * Все handlers получают principal из STOMP-сессии (см. WebSocketConfig.ChannelInterceptor).
 */
@Controller
@RequiredArgsConstructor
public class WebSocketController {

    private final TypingService typingService;
    private final PresenceService presenceService;
    private final SimpMessagingTemplate broker;

    /** Клиент шлёт раз в ~30s, чтобы продлить TTL presence. */
    @MessageMapping("/heartbeat")
    public void heartbeat(Authentication auth) {
        Long userId = userIdOf(auth);
        if (userId != null) {
            presenceService.heartbeat(userId);
        }
    }

    /** Клиент шлёт пока пользователь печатает (раз в ~3s). */
    @MessageMapping("/chats/{chatId}/typing")
    public void typing(@DestinationVariable Long chatId, Authentication auth, @Payload(required = false) TypingPayload body) {
        Long userId = userIdOf(auth);
        if (userId == null) return;
        boolean typing = body == null || body.typing();
        if (typing) {
            typingService.startTyping(chatId, userId);
        } else {
            typingService.stopTyping(chatId, userId);
        }
        broker.convertAndSend("/topic/chats/" + chatId + "/typing",
            new TypingUpdate(chatId, userId, typing));
    }

    private static Long userIdOf(Authentication auth) {
        if (auth != null && auth.getPrincipal() instanceof AuthenticatedUser u) {
            return u.id();
        }
        return null;
    }

    public record TypingPayload(boolean typing) {}
    public record TypingUpdate(Long chatId, Long userId, boolean typing) {}
}
