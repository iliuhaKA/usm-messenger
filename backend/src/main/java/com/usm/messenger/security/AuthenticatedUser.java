package com.usm.messenger.security;

/**
 * Principal в SecurityContext'е — лёгкий immutable-объект, чтобы каждый
 * запрос не дёргал БД. Контроллеры получают его через @AuthenticationPrincipal.
 */
public record AuthenticatedUser(Long id, String email, String jti) {
}
