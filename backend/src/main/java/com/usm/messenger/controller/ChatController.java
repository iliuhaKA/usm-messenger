package com.usm.messenger.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
import com.usm.messenger.service.ChatService;
import com.usm.messenger.service.MessageService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

@RestController @RequestMapping("/api/chats") @RequiredArgsConstructor
public class ChatController {
    
    private final ChatService chatService;
    private final MessageService messageService;

    @GetMapping
    public ResponseEntity<List<ChatListItemResponse>> getChats(@RequestParam Long userId) {
        return ResponseEntity.ok(chatService.getChatsByUserId(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChatResponse> getChatById(@PathVariable Long id, @RequestParam Long userId) {
        return ResponseEntity.ok(chatService.getChatById(id, userId));
    }

    @PostMapping
    public ResponseEntity<ChatResponse> createChat(@RequestParam Long userId, @RequestBody CreateChatRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(chatService.createChat(request, userId));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<UserResponse>> getMembers(@PathVariable Long id, @RequestParam Long userId) {
        return ResponseEntity.ok(chatService.getChatById(id, userId).getMembers());
    }

    @PatchMapping("/{id}/pin")
    public ResponseEntity<Void> pinChat(@PathVariable Long id, @RequestParam Long userId, @RequestBody PinRequest body) {
        chatService.pinChat(id, userId, body.isPinned());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/mute")
    public ResponseEntity<Void> muteChat(@PathVariable Long id, @RequestParam Long userId, @RequestBody MuteRequest body) {
        chatService.muteChat(id, userId, body.isMuted());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{chatId}/messages")
    public ResponseEntity<List<MessageResponse>> getMessages(@PathVariable Long chatId, @RequestParam Long userId) {
        return ResponseEntity.ok(messageService.getMessages(chatId, userId));
    }

    @PostMapping("/{chatId}/messages")
    public ResponseEntity<MessageResponse> sendMessage(
        @PathVariable Long chatId,
        @RequestParam Long userId,
        @Valid @RequestBody SendMessageRequest body
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(messageService.sendMessage(chatId, userId, body));
    }

    @PostMapping("/{chatId}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long chatId, @RequestParam Long userId) {
        messageService.markChatAsRead(chatId, userId);
        return ResponseEntity.noContent().build();
    }

}

