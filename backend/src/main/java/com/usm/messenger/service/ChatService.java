package com.usm.messenger.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.usm.messenger.dto.request.CreateChatRequest;
import com.usm.messenger.dto.response.ChatListItemResponse;
import com.usm.messenger.dto.response.ChatResponse;
import com.usm.messenger.entity.Chat;
import com.usm.messenger.entity.ChatMember;
import com.usm.messenger.entity.User;
import com.usm.messenger.entity.enums.ChatRoles;
import com.usm.messenger.exception.AccessDeniedException;
import com.usm.messenger.exception.UserNotFoundException;
import com.usm.messenger.repository.ChatMemberRepository;
import com.usm.messenger.repository.ChatRepository;
import com.usm.messenger.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service @RequiredArgsConstructor
public class ChatService {
    
    private final ChatRepository chatRepository;
    private final ChatMemberRepository chatMemberRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    public List<ChatListItemResponse> getChatsByUserId(Long userId) {
        List<ChatMember> memberships = chatMemberRepository.findByUserId(userId);
        return memberships.stream()
            .map(this::toListItemResponse)
            .sorted( (a, b) -> {
                if(a.isPinned() != b.isPinned()) return a.isPinned() ? -1 : 1;
                LocalDateTime timeA = a.getLastMessageTime() != null ? a.getLastMessageTime() : LocalDateTime.MIN;
                LocalDateTime timeB = b.getLastMessageTime() != null ? b.getLastMessageTime() : LocalDateTime.MIN;
                return timeB.compareTo(timeA);
            }).collect(Collectors.toList());
    }

    private ChatListItemResponse toListItemResponse(ChatMember cm) {
        Chat chat = cm.getChat();
        ChatListItemResponse dto = new ChatListItemResponse();
        dto.setId(chat.getId());
        dto.setName(chat.getName());
        dto.setType(chat.getType());
        dto.setAvatarUrl(chat.getAvatarUrl());
        dto.setLastMessage(null);
        dto.setLastMessageTime(chat.getCreatedAt());
        dto.setUnreadCount(0);
        dto.setPinned(Boolean.TRUE.equals(cm.getIsPinned()));
        dto.setMuted(Boolean.TRUE.equals(cm.getIsMuted()));
        dto.setMemberCount(chat.getMembers().size());
        return dto;
    }

    public ChatResponse getChatById(Long chatId, Long userId) {
        ChatMember membership = chatMemberRepository.findByUserIdAndChatId(userId, chatId)
            .orElseThrow( () -> new AccessDeniedException("Access denied to chat: " + chatId));

        Chat chat = membership.getChat();

        ChatResponse dto = new ChatResponse();

        dto.setId(chat.getId());
        dto.setName(chat.getName());
        dto.setType(chat.getType());
        dto.setDescription(chat.getDescription());
        dto.setAvatarUrl(chat.getAvatarUrl());
        dto.setCreatedAt(chat.getCreatedAt());
        dto.setUnreadCount(0);
        dto.setPinned(Boolean.TRUE.equals(membership.getIsPinned()));
        dto.setMuted(Boolean.TRUE.equals(membership.getIsMuted()));
        dto.setMemberCount(chat.getMembers().size());
        dto.setMembers(chat.getMembers().stream()
            .map(m -> userService.toUserResponse(m.getUser()))
            .collect(Collectors.toList()));

        return dto;
    }

    public ChatResponse createChat(CreateChatRequest request, Long creatorId){
        User creator = userRepository.findById(creatorId)
            .orElseThrow( () -> new UserNotFoundException("User not found: " + creatorId));

        Chat chat = Chat.builder()
            .name(request.getName())
            .type(request.getType())
            .description(request.getDescription())
            .createdBy(creator)
            .createdAt(LocalDateTime.now())
            .avatarUrl(null)
            .members(new ArrayList<>())
            .build();
        
        chat = chatRepository.save(chat);

        ChatMember creatorMember = ChatMember.builder()
            .user(creator)
            .chat(chat)
            .role(ChatRoles.ADMIN)
            .joinedAt(LocalDateTime.now())
            .isPinned(false)
            .isMuted(false)
            .build();
        
        chatMemberRepository.save(creatorMember);

        for(Long memberId : request.getMemberIds()){
            if(memberId.equals(creatorId)) continue;
            User member = userRepository.findById(memberId)
                .orElseThrow( () -> new UserNotFoundException("User not found: " + memberId));
            
            ChatMember cm = ChatMember.builder()
                .user(member)
                .chat(chat)
                .role(ChatRoles.MEMBER)
                .joinedAt(LocalDateTime.now())
                .isPinned(false)
                .isMuted(false)
                .build();
            
            chatMemberRepository.save(cm);
        }

        return getChatById(chat.getId(), creatorId);
    }

    public void pinChat(Long chatId, Long userId, boolean pinned) {
        ChatMember cm = chatMemberRepository.findByUserIdAndChatId(userId, chatId)
            .orElseThrow( () -> new AccessDeniedException("Access denied to chat: " + chatId));

        cm.setIsPinned(pinned);
        chatMemberRepository.save(cm);
    }

    public void muteChat(Long chatId, Long userId, boolean muted) {
        ChatMember cm = chatMemberRepository.findByUserIdAndChatId(userId, chatId)
            .orElseThrow( () -> new AccessDeniedException("Access denied to chat: " + chatId));

        cm.setIsMuted(muted);
        chatMemberRepository.save(cm);
    }
}
