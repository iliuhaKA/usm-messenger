package com.usm.messenger.service;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

/**
 * Online-presence в Redis. Ключ: presence:user:{id} = "ONLINE" с TTL 60s.
 * Heartbeat от клиента продлевает TTL; если не пришёл за минуту — пользователь оффлайн.
 */
@Service
@RequiredArgsConstructor
public class PresenceService {

    public static final String STATUS_ONLINE = "ONLINE";
    public static final String STATUS_OFFLINE = "OFFLINE";
    private static final Duration TTL = Duration.ofSeconds(60);
    private static final String PREFIX = "presence:user:";

    private final StringRedisTemplate redis;

    public void markOnline(Long userId) {
        redis.opsForValue().set(key(userId), STATUS_ONLINE, TTL);
    }

    public void heartbeat(Long userId) {
        redis.expire(key(userId), TTL);
        // если ключа не было (TTL истёк) — поднять заново
        if (Boolean.FALSE.equals(redis.hasKey(key(userId)))) {
            markOnline(userId);
        }
    }

    public void markOffline(Long userId) {
        redis.delete(key(userId));
    }

    public String getStatus(Long userId) {
        String v = redis.opsForValue().get(key(userId));
        return v != null ? v : STATUS_OFFLINE;
    }

    public Map<Long, String> getStatuses(List<Long> userIds) {
        Map<Long, String> out = new HashMap<>();
        if (userIds == null || userIds.isEmpty()) return out;
        List<String> keys = userIds.stream().map(PresenceService::key).toList();
        List<String> values = redis.opsForValue().multiGet(keys);
        if (values == null) {
            for (Long id : userIds) out.put(id, STATUS_OFFLINE);
            return out;
        }
        for (int i = 0; i < userIds.size(); i++) {
            String v = i < values.size() ? values.get(i) : null;
            out.put(userIds.get(i), v != null ? v : STATUS_OFFLINE);
        }
        return out;
    }

    private static String key(Long userId) {
        return PREFIX + userId;
    }
}
