package com.usm.messenger.config;

import java.util.List;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import com.usm.messenger.security.AuthenticatedUser;
import com.usm.messenger.security.JwtTokenProvider;
import com.usm.messenger.security.RedisSessionService;

import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtTokenProvider tokenProvider;
    private final RedisSessionService sessions;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns(
                "http://localhost:5173",  "https://localhost:5173",
                "http://127.0.0.1:5173",  "https://127.0.0.1:5173",
                "http://localhost:5174",  "https://localhost:5174",
                "http://127.0.0.1:5174",  "https://127.0.0.1:5174",
                "http://localhost:3000",  "https://localhost:3000",
                "http://127.0.0.1:3000",  "https://127.0.0.1:3000"
            )
            .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authHeader = accessor.getFirstNativeHeader("Authorization");
                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String token = authHeader.substring(7).trim();
                        try {
                            Claims claims = tokenProvider.parse(token);
                            String jti = claims.getId();
                            if (sessions.isActive(jti)) {
                                Long userId = Long.valueOf(claims.getSubject());
                                String email = claims.get("email", String.class);
                                AuthenticatedUser principal = new AuthenticatedUser(userId, email, jti);
                                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                    principal, null, List.of(new SimpleGrantedAuthority("ROLE_USER"))
                                );
                                accessor.setUser(auth);
                            }
                        } catch (Exception ignored) {
                            // невалидный токен — соединение пройдёт без principal,
                            // подписки на /topic могут быть запрещены позже на уровне правил
                        }
                    }
                }
                return message;
            }
        });
    }
}
