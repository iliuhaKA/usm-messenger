package com.usm.messenger.security;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

/**
 * Работа с активными JWT-сессиями в Redis.
 *
 * Логика: при login — кладём jti → userId с TTL (срок жизни токена).
 * При logout — удаляем ключ. При каждом запросе — проверяем существование.
 * Это позволяет выпускать «отзываемые» JWT, не теряя stateless-преимущества.
 */
@Service
@RequiredArgsConstructor
public class RedisSessionService {

    private static final String KEY_PREFIX = "jwt:session:";

    private final StringRedisTemplate redis;

    public void register(String jti, Long userId, long ttlMs) {
        redis.opsForValue().set(key(jti), String.valueOf(userId), Duration.ofMillis(ttlMs));
    }

    public void revoke(String jti) {
        redis.delete(key(jti));
    }

    public boolean isActive(String jti) {
        return Boolean.TRUE.equals(redis.hasKey(key(jti)));
    }

    public Long ttlSeconds(String jti) {
        Long ttl = redis.getExpire(key(jti), TimeUnit.SECONDS);
        return ttl == null ? -1L : ttl;
    }

    private static String key(String jti) {
        return KEY_PREFIX + jti;
    }
}
