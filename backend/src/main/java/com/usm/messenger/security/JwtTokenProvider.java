package com.usm.messenger.security;

import java.util.Base64;
import java.util.Date;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;

/**
 * Генерация и валидация JWT (HS256). Subject = userId, jti = UUID для blacklist'инга через Redis.
 */
@Component
public class JwtTokenProvider {

    @Value("${app.jwt.secret}")
    private String base64Secret;

    @Value("${app.jwt.expiration-ms}")
    private long expirationMs;

    private SecretKey key;

    @PostConstruct
    void init() {
        byte[] raw = Base64.getDecoder().decode(base64Secret);
        if (raw.length < 32) {
            throw new IllegalStateException(
                "app.jwt.secret must be >= 32 bytes (256 bits) when base64-decoded. Got: " + raw.length
            );
        }
        this.key = Keys.hmacShaKeyFor(raw);
    }

    public TokenPair generate(Long userId, String email) {
        String jti = UUID.randomUUID().toString();
        Date now = new Date();
        Date exp = new Date(now.getTime() + expirationMs);

        String token = Jwts.builder()
            .id(jti)
            .subject(String.valueOf(userId))
            .claim("email", email)
            .issuedAt(now)
            .expiration(exp)
            .signWith(key)
            .compact();

        return new TokenPair(token, jti, exp.toInstant().toEpochMilli());
    }

    public Claims parse(String token) throws JwtException {
        return Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    public Long extractUserId(String token) {
        return Long.valueOf(parse(token).getSubject());
    }

    public String extractJti(String token) {
        return parse(token).getId();
    }

    public long getExpirationMs() {
        return expirationMs;
    }

    public record TokenPair(String token, String jti, long expiresAtEpochMs) {}
}
