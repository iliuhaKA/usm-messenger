package com.usm.messenger.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.usm.messenger.dto.request.LoginRequest;
import com.usm.messenger.dto.response.LoginResponse;
import com.usm.messenger.dto.response.UserResponse;
import com.usm.messenger.entity.User;
import com.usm.messenger.security.AuthenticatedUser;
import com.usm.messenger.security.JwtTokenProvider;
import com.usm.messenger.security.JwtTokenProvider.TokenPair;
import com.usm.messenger.security.RedisSessionService;
import com.usm.messenger.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtTokenProvider tokenProvider;
    private final RedisSessionService sessions;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        User user = userService.authenticateAndGetUser(request);
        TokenPair tokens = tokenProvider.generate(user.getId(), user.getEmail());
        sessions.register(tokens.jti(), user.getId(), tokenProvider.getExpirationMs());

        UserResponse userDto = userService.getUserById(user.getId());
        return ResponseEntity.ok(LoginResponse.builder()
            .token(tokens.token())
            .expiresAtEpochMs(tokens.expiresAtEpochMs())
            .user(userDto)
            .build());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal AuthenticatedUser principal) {
        if (principal != null) {
            sessions.revoke(principal.jti());
        }
        return ResponseEntity.noContent().build();
    }
}
