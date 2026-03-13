package com.usm.messenger.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import com.usm.messenger.entity.enums.ChatTypes;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ChatResponse {
    private Long id;
    private String name;
    private ChatTypes type;
    private String description;
    private String avatarUrl;
    private int unreadCount;
    private boolean isPinned;
    private boolean isMuted;
    private LocalDateTime createdAt;
    private int memberCount;

    private List<UserResponse> members;
}
