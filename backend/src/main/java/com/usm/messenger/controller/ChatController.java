package com.usm.messenger.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import com.usm.messenger.dto.request.CreateChatRequest;
import com.usm.messenger.dto.request.MuteRequest;
import com.usm.messenger.dto.request.PinRequest;
import com.usm.messenger.dto.request.SendMessageRequest;
import com.usm.messenger.dto.response.ChatListItemResponse;
import com.usm.messenger.dto.response.ChatResponse;
import com.usm.messenger.dto.response.MessageResponse;
import com.usm.messenger.dto.response.UserResponse;
import com.usm.messenger.security.AuthenticatedUser;
import com.usm.messenger.service.ChatService;
import com.usm.messenger.service.MessageService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

@RestController @RequestMapping("/api/chats") @RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final MessageService messageService;

    @GetMapping
    public ResponseEntity<List<ChatListItemResponse>> getChats(@AuthenticationPrincipal AuthenticatedUser me) {
        return ResponseEntity.ok(chatService.getChatsByUserId(me.id()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChatResponse> getChatById(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser me) {
        return ResponseEntity.ok(chatService.getChatById(id, me.id()));
    }

    @PostMapping
    public ResponseEntity<ChatResponse> createChat(@AuthenticationPrincipal AuthenticatedUser me, @RequestBody CreateChatRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(chatService.createChat(request, me.id()));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<UserResponse>> getMembers(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser me) {
        return ResponseEntity.ok(chatService.getChatById(id, me.id()).getMembers());
    }

    @PatchMapping("/{id}/pin")
    public ResponseEntity<Void> pinChat(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser me, @RequestBody PinRequest body) {
        chatService.pinChat(id, me.id(), body.isPinned());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/mute")
    public ResponseEntity<Void> muteChat(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser me, @RequestBody MuteRequest body) {
        chatService.muteChat(id, me.id(), body.isMuted());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{chatId}/messages")
    public ResponseEntity<List<MessageResponse>> getMessages(@PathVariable Long chatId, @AuthenticationPrincipal AuthenticatedUser me) {
        return ResponseEntity.ok(messageService.getMessages(chatId, me.id()));
    }

    @PostMapping("/{chatId}/messages")
    public ResponseEntity<MessageResponse> sendMessage(
        @PathVariable Long chatId,
        @AuthenticationPrincipal AuthenticatedUser me,
        @Valid @RequestBody SendMessageRequest body
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(messageService.sendMessage(chatId, me.id(), body));
    }

    @PostMapping("/{chatId}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long chatId, @AuthenticationPrincipal AuthenticatedUser me) {
        messageService.markChatAsRead(chatId, me.id());
        return ResponseEntity.noContent().build();
    }
}
