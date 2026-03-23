package com.usm.messenger.controller;

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
    public List<ChatListItemResponse> getChats(@RequestParam Long userId) {
        return chatService.getChatsByUserId(userId);
    }

    @GetMapping("/{id}")
    public ChatResponse getChatById(@PathVariable Long id, @RequestParam Long userId) {
        return chatService.getChatById(id, userId);
    }

    @PostMapping
    public ChatResponse createChat(@RequestParam Long userId, @RequestBody CreateChatRequest request) {
        return chatService.createChat(request, userId);
    }

    @GetMapping("/{id}/members")
    public List<UserResponse> getMembers(@PathVariable Long id, @RequestParam Long userId) {
        return chatService.getChatById(id, userId).getMembers();
    }

    @PatchMapping("/{id}/pin")
    public void pinChat(@PathVariable Long id, @RequestParam Long userId, @RequestBody PinRequest body) {
        chatService.pinChat(id, userId, body.isPinned());
    }

    @PatchMapping("/{id}/mute")
    public void muteChat(@PathVariable Long id, @RequestParam Long userId, @RequestBody MuteRequest body) {
        chatService.muteChat(id, userId, body.isMuted());
    }

    @GetMapping("/{chatId}/messages")
    public List<MessageResponse> getMessages(@PathVariable Long chatId, @RequestParam Long userId) {
        return messageService.getMessages(chatId, userId);
    }

    @PostMapping("/{chatId}/messages")
    public MessageResponse sendMessage(
        @PathVariable Long chatId,
        @RequestParam Long userId,
        @Valid @RequestBody SendMessageRequest body
    ) {
        return messageService.sendMessage(chatId, userId, body);
    }

    @PostMapping("/{chatId}/read")
    public void markRead(@PathVariable Long chatId, @RequestParam Long userId) {
        messageService.markChatAsRead(chatId, userId);
    }

}

