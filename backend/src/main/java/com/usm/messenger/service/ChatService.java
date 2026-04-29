package com.usm.messenger.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.usm.messenger.dto.request.CreateChatRequest;
import com.usm.messenger.dto.request.UpdateChatRequest;
import com.usm.messenger.dto.response.ChatListItemResponse;
import com.usm.messenger.dto.response.ChatResponse;
import com.usm.messenger.dto.response.UserResponse;
import com.usm.messenger.entity.Chat;
import com.usm.messenger.entity.ChatMember;
import com.usm.messenger.entity.User;
import com.usm.messenger.entity.enums.ChatRoles;
import com.usm.messenger.exception.AccessDeniedException;
import com.usm.messenger.exception.UserNotFoundException;
import com.usm.messenger.repository.ChatMemberRepository;
import com.usm.messenger.repository.ChatRepository;
import com.usm.messenger.repository.MessageRepository;
import com.usm.messenger.repository.UserRepository;
import com.usm.messenger.security.MessageCrypto;

import lombok.RequiredArgsConstructor;

@Service @RequiredArgsConstructor
public class ChatService {

    private final ChatRepository chatRepository;
    private final ChatMemberRepository chatMemberRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final MessageRepository messageRepository;
    private final MessageCrypto messageCrypto;
    private final UnreadCacheService unreadCache;

    @Transactional(readOnly = true)
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
        dto.setAvatarFileId(chat.getAvatarFileId());
        dto.setUnreadCount((int) unreadCache.get(cm.getUser().getId(), chat.getId()));
        dto.setPinned(Boolean.TRUE.equals(cm.getIsPinned()));
        dto.setMuted(Boolean.TRUE.equals(cm.getIsMuted()));
        dto.setMemberCount(chat.getMembers().size());

        messageRepository.findFirstByChat_IdOrderByCreatedAtDesc(chat.getId()).ifPresentOrElse(last -> {
            dto.setLastMessage(messageCrypto.decrypt(last.getContent()));
            dto.setLastMessageTime(last.getCreatedAt());
        }, () -> {
            dto.setLastMessage(null);
            dto.setLastMessageTime(chat.getCreatedAt());
        });

        return dto;
    }

    @Transactional(readOnly = true)
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
        dto.setAvatarFileId(chat.getAvatarFileId());
        dto.setCreatedAt(chat.getCreatedAt());
        dto.setUnreadCount((int) unreadCache.get(userId, chatId));
        dto.setPinned(Boolean.TRUE.equals(membership.getIsPinned()));
        dto.setMuted(Boolean.TRUE.equals(membership.getIsMuted()));
        dto.setMemberCount(chat.getMembers().size());
        dto.setMembers(chat.getMembers().stream()
            .map(m -> {
                UserResponse u = userService.toUserResponse(m.getUser());
                u.setChatRole(m.getRole() != null ? m.getRole().name() : null);
                return u;
            })
            .collect(Collectors.toList()));

        return dto;
    }

    @Transactional
    public ChatResponse updateChat(Long chatId, Long userId, UpdateChatRequest request) {
        ensureAdmin(chatId, userId);
        Chat chat = chatRepository.findById(chatId)
            .orElseThrow(() -> new AccessDeniedException("Chat not found: " + chatId));
        if (request.getName() != null) chat.setName(request.getName().trim());
        if (request.getDescription() != null) chat.setDescription(request.getDescription().trim());
        chatRepository.save(chat);
        return getChatById(chatId, userId);
    }

    @Transactional
    public ChatResponse setChatAvatar(Long chatId, Long userId, String avatarFileId) {
        ensureAdmin(chatId, userId);
        Chat chat = chatRepository.findById(chatId)
            .orElseThrow(() -> new AccessDeniedException("Chat not found: " + chatId));
        chat.setAvatarFileId(avatarFileId);
        chatRepository.save(chat);
        return getChatById(chatId, userId);
    }

    @Transactional
    public void addMember(Long chatId, Long actorId, Long newUserId) {
        ensureAdmin(chatId, actorId);
        if (chatMemberRepository.existsByUserIdAndChatId(newUserId, chatId)) return;
        Chat chat = chatRepository.findById(chatId)
            .orElseThrow(() -> new AccessDeniedException("Chat not found: " + chatId));
        User user = userRepository.findById(newUserId)
            .orElseThrow(() -> new UserNotFoundException("User not found: " + newUserId));
        ChatMember cm = ChatMember.builder()
            .user(user)
            .chat(chat)
            .role(ChatRoles.MEMBER)
            .joinedAt(LocalDateTime.now())
            .isPinned(false)
            .isMuted(false)
            .lastReadAt(LocalDateTime.now())
            .build();
        chatMemberRepository.save(cm);
    }

    @Transactional
    public void removeMember(Long chatId, Long actorId, Long targetUserId) {
        // Сам себя — может убрать (выход). Чужого — только админ.
        if (!actorId.equals(targetUserId)) {
            ensureAdmin(chatId, actorId);
        } else if (!chatMemberRepository.existsByUserIdAndChatId(actorId, chatId)) {
            throw new AccessDeniedException("Not a member of chat: " + chatId);
        }
        ChatMember cm = chatMemberRepository.findByUserIdAndChatId(targetUserId, chatId)
            .orElseThrow(() -> new AccessDeniedException("User is not a member"));
        chatMemberRepository.delete(cm);
        unreadCache.invalidate(targetUserId, chatId);
    }

    @Transactional
    public void deleteChat(Long chatId, Long actorId) {
        ensureAdmin(chatId, actorId);
        Chat chat = chatRepository.findById(chatId)
            .orElseThrow(() -> new AccessDeniedException("Chat not found: " + chatId));
        // Postgres FK с ON DELETE CASCADE сам удалит messages и chats_members.
        chatRepository.delete(chat);
    }

    private void ensureAdmin(Long chatId, Long userId) {
        ChatMember cm = chatMemberRepository.findByUserIdAndChatId(userId, chatId)
            .orElseThrow(() -> new AccessDeniedException("Access denied to chat: " + chatId));
        if (cm.getRole() != ChatRoles.ADMIN) {
            throw new AccessDeniedException("Only admin can perform this action");
        }
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
            .lastReadAt(LocalDateTime.now())
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
                .lastReadAt(LocalDateTime.now())
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
