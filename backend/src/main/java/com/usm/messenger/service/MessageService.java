package com.usm.messenger.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.usm.messenger.dto.request.SendMessageRequest;
import com.usm.messenger.dto.response.MessageResponse;
import com.usm.messenger.entity.Chat;
import com.usm.messenger.entity.ChatMember;
import com.usm.messenger.entity.Message;
import com.usm.messenger.entity.User;
import com.usm.messenger.exception.AccessDeniedException;
import com.usm.messenger.exception.ChatNotFoundException;
import com.usm.messenger.repository.ChatMemberRepository;
import com.usm.messenger.repository.ChatRepository;
import com.usm.messenger.repository.MessageRepository;
import com.usm.messenger.repository.UserRepository;
import com.usm.messenger.security.MessageCrypto;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final ChatMemberRepository chatMemberRepository;
    private final ChatRepository chatRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final MessageCrypto messageCrypto;

    @Transactional(readOnly = true)
    public List<MessageResponse> getMessages(Long chatId, Long userId) {
        ensureMember(chatId, userId);
        return messageRepository.findByChat_IdOrderByCreatedAtAsc(chatId).stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @Transactional
    public MessageResponse sendMessage(Long chatId, Long userId, SendMessageRequest request) {
        ensureMember(chatId, userId);
        User sender = userRepository.findById(userId)
            .orElseThrow(() -> new AccessDeniedException("User not found: " + userId));
        Chat chat = chatRepository.findById(chatId)
            .orElseThrow(() -> new ChatNotFoundException("Chat not found: " + chatId));

        Message msg = Message.builder()
            .chat(chat)
            .sender(sender)
            .content(messageCrypto.encrypt(request.getContent().trim()))
            .type("TEXT")
            .createdAt(LocalDateTime.now())
            .build();
        msg = messageRepository.save(msg);
        MessageResponse dto = toResponse(msg);
        messagingTemplate.convertAndSend("/topic/chats/" + chatId + "/messages", dto);
        return dto;
    }

    @Transactional
    public void markChatAsRead(Long chatId, Long userId) {
        ensureMember(chatId, userId);
        ChatMember cm = chatMemberRepository.findByUserIdAndChatId(userId, chatId)
            .orElseThrow(() -> new AccessDeniedException("Access denied to chat: " + chatId));
        cm.setLastReadAt(LocalDateTime.now());
        chatMemberRepository.save(cm);
    }

    private void ensureMember(Long chatId, Long userId) {
        if (!chatMemberRepository.existsByUserIdAndChatId(userId, chatId)) {
            throw new AccessDeniedException("Access denied to chat: " + chatId);
        }
    }

    private MessageResponse toResponse(Message m) {
        User s = m.getSender();
        return MessageResponse.builder()
            .id(m.getId())
            .chatId(m.getChat().getId())
            .senderId(s != null ? s.getId() : null)
            .senderFirstName(s != null ? s.getFirstName() : null)
            .senderLastName(s != null ? s.getLastName() : null)
            .content(messageCrypto.decrypt(m.getContent()))
            .createdAt(m.getCreatedAt())
            .build();
    }
}
