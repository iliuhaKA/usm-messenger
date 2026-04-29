package com.usm.messenger.service;

import java.time.Duration;
import java.time.LocalDateTime;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import com.usm.messenger.entity.ChatMember;
import com.usm.messenger.repository.ChatMemberRepository;
import com.usm.messenger.repository.MessageRepository;

import lombok.RequiredArgsConstructor;

/**
 * Кэш счётчиков непрочитанных сообщений в Redis.
 * Ключ: unread:user:{userId}:chat:{chatId} = INT, TTL 7 дней.
 *
 * Источник истины — Postgres (ChatMember.lastReadAt + COUNT messages),
 * но при cache-hit мы избегаем JOIN+COUNT по messages, что даёт хорошее
 * ускорение списка чатов на скейле.
 */
@Service
@RequiredArgsConstructor
public class UnreadCacheService {

    private static final Duration TTL = Duration.ofDays(7);
    private static final String PREFIX = "unread:user:";

    private final StringRedisTemplate redis;
    private final ChatMemberRepository chatMemberRepository;
    private final MessageRepository messageRepository;

    public long get(Long userId, Long chatId) {
        String v = redis.opsForValue().get(key(userId, chatId));
        if (v != null) {
            try {
                return Long.parseLong(v);
            } catch (NumberFormatException ignored) {
                // повреждённое значение — пересчитаем
            }
        }
        long fresh = recalculate(userId, chatId);
        redis.opsForValue().set(key(userId, chatId), String.valueOf(fresh), TTL);
        return fresh;
    }

    public void increment(Long userId, Long chatId) {
        String k = key(userId, chatId);
        redis.opsForValue().increment(k);
        redis.expire(k, TTL);
    }

    public void clear(Long userId, Long chatId) {
        redis.opsForValue().set(key(userId, chatId), "0", TTL);
    }

    public void invalidate(Long userId, Long chatId) {
        redis.delete(key(userId, chatId));
    }

    private long recalculate(Long userId, Long chatId) {
        ChatMember cm = chatMemberRepository.findByUserIdAndChatId(userId, chatId).orElse(null);
        if (cm == null) return 0;
        LocalDateTime since = cm.getLastReadAt() != null ? cm.getLastReadAt() : LocalDateTime.MIN;
        return messageRepository.countIncomingUnreadAfter(chatId, userId, since);
    }

    private static String key(Long userId, Long chatId) {
        return PREFIX + userId + ":chat:" + chatId;
    }
}
