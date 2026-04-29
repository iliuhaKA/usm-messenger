package com.usm.messenger.service;

import java.time.Duration;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

/**
 * Typing indicator: typing:chat:{chatId} — Redis SET userId, TTL 5s.
 * Каждый набирающий клиент шлёт раз в ~3 секунды событие в WebSocket;
 * получатели видят "печатает..." пока ключ жив.
 */
@Service
@RequiredArgsConstructor
public class TypingService {

    private static final Duration TTL = Duration.ofSeconds(5);
    private static final String PREFIX = "typing:chat:";

    private final StringRedisTemplate redis;

    public void startTyping(Long chatId, Long userId) {
        String k = key(chatId);
        redis.opsForSet().add(k, String.valueOf(userId));
        redis.expire(k, TTL);
    }

    public void stopTyping(Long chatId, Long userId) {
        redis.opsForSet().remove(key(chatId), String.valueOf(userId));
    }

    public Set<Long> getTypingUsers(Long chatId) {
        Set<String> raw = redis.opsForSet().members(key(chatId));
        if (raw == null) return Set.of();
        return raw.stream().map(Long::valueOf).collect(Collectors.toSet());
    }

    private static String key(Long chatId) {
        return PREFIX + chatId;
    }
}
