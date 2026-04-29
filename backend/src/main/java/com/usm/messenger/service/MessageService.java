package com.usm.messenger.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.usm.messenger.dto.request.SendMessageRequest;
import com.usm.messenger.dto.response.MessageResponse;
import com.usm.messenger.entity.Attachment;
import com.usm.messenger.entity.Chat;
import com.usm.messenger.entity.ChatMember;
import com.usm.messenger.entity.Message;
import com.usm.messenger.entity.User;
import com.usm.messenger.exception.AccessDeniedException;
import com.usm.messenger.exception.ChatNotFoundException;
import com.usm.messenger.repository.AttachmentRepository;
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
    private final AttachmentRepository attachmentRepository;
    private final FileService fileService;
    private final UnreadCacheService unreadCache;
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

        String text = request.getContent() != null ? request.getContent().trim() : "";
        Attachment attachment = null;
        if (request.getAttachmentId() != null) {
            attachment = attachmentRepository.findById(request.getAttachmentId())
                .orElseThrow(() -> new AccessDeniedException("Attachment not found: " + request.getAttachmentId()));
            if (attachment.getUploadedBy() == null || !attachment.getUploadedBy().getId().equals(userId)) {
                throw new AccessDeniedException("Cannot attach foreign file");
            }
        }
        if (text.isEmpty() && attachment == null) {
            throw new IllegalArgumentException("Message must have content or attachment");
        }

        Message msg = Message.builder()
            .chat(chat)
            .sender(sender)
            .content(text.isEmpty() ? null : messageCrypto.encrypt(text))
            .type(attachment != null ? "FILE" : "TEXT")
            .createdAt(LocalDateTime.now())
            .attachment(attachment)
            .build();
        msg = messageRepository.save(msg);

        // Привязываем attachment ↔ message обратной ссылкой (для каскадного удаления и поиска вложений по чату).
        if (attachment != null) {
            attachment.setMessage(msg);
            attachmentRepository.save(attachment);
        }

        MessageResponse dto = toResponse(msg);
        // Инкремент unread для всех получателей кроме отправителя — Redis
        chatMemberRepository.findByChatId(chatId).forEach(member -> {
            Long memberId = member.getUser().getId();
            if (!memberId.equals(userId)) {
                unreadCache.increment(memberId, chatId);
            }
        });
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
        unreadCache.clear(userId, chatId);
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
            .senderAvatarFileId(s != null ? s.getAvatarFileId() : null)
            .content(m.getContent() == null ? null : messageCrypto.decrypt(m.getContent()))
            .createdAt(m.getCreatedAt())
            .attachment(m.getAttachment() != null ? fileService.toResponse(m.getAttachment()) : null)
            .build();
    }
}
