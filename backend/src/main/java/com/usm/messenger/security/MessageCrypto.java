package com.usm.messenger.security;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

/**
 * AES-GCM шифрование тела сообщений в БД.
 *
 * Формат хранения: "enc:v1:" + base64(iv || ciphertext || tag).
 * Префикс позволяет различать зашифрованные и старые plain-сообщения
 * (seed-данные из миграций), не ломая совместимость.
 */
@Component
public class MessageCrypto {

    private static final String PREFIX = "enc:v1:";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int IV_LENGTH = 12;
    private static final int TAG_LENGTH_BITS = 128;

    private final SecureRandom random = new SecureRandom();
    private SecretKey key;

    @Value("${app.security.message-encryption-key:}")
    private String base64Key;

    @PostConstruct
    void init() {
        if (base64Key == null || base64Key.isBlank()) {
            throw new IllegalStateException(
                "app.security.message-encryption-key is not set. " +
                "Generate a 32-byte AES key (base64) and put it into application.yml or env MESSAGE_ENCRYPTION_KEY."
            );
        }
        byte[] raw = Base64.getDecoder().decode(base64Key);
        if (raw.length != 16 && raw.length != 24 && raw.length != 32) {
            throw new IllegalStateException(
                "Invalid AES key length: " + raw.length + " bytes. Expected 16, 24 or 32."
            );
        }
        this.key = new SecretKeySpec(raw, "AES");
    }

    public String encrypt(String plaintext) {
        if (plaintext == null) return null;
        try {
            byte[] iv = new byte[IV_LENGTH];
            random.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            byte[] cipherText = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            byte[] payload = new byte[iv.length + cipherText.length];
            System.arraycopy(iv, 0, payload, 0, iv.length);
            System.arraycopy(cipherText, 0, payload, iv.length, cipherText.length);

            return PREFIX + Base64.getEncoder().encodeToString(payload);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to encrypt message", e);
        }
    }

    public String decrypt(String stored) {
        if (stored == null) return null;
        if (!stored.startsWith(PREFIX)) {
            return stored;
        }
        try {
            byte[] payload = Base64.getDecoder().decode(stored.substring(PREFIX.length()));
            if (payload.length <= IV_LENGTH) {
                throw new IllegalStateException("Encrypted payload is too short");
            }
            byte[] iv = new byte[IV_LENGTH];
            byte[] cipherText = new byte[payload.length - IV_LENGTH];
            System.arraycopy(payload, 0, iv, 0, IV_LENGTH);
            System.arraycopy(payload, IV_LENGTH, cipherText, 0, cipherText.length);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            byte[] plain = cipher.doFinal(cipherText);
            return new String(plain, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to decrypt message", e);
        }
    }
}
