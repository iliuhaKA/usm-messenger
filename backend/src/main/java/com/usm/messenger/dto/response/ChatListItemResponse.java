package com.usm.messenger.dto.response;

import java.time.LocalDateTime;

import com.usm.messenger.entity.enums.ChatTypes;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class ChatListItemResponse {
    private Long id;
    private String name;
    private ChatTypes type;
    private String avatarUrl;
    private String avatarFileId;
    private String lastMessage;
    private LocalDateTime lastMessageTime;
    private int unreadCount;
    private boolean isPinned;
    private boolean isMuted;
    private int memberCount;
}
