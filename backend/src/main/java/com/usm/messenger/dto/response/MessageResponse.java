package com.usm.messenger.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {

    private Long id;
    private Long chatId;
    private Long senderId;
    private String senderFirstName;
    private String senderLastName;
    private String content;
    private LocalDateTime createdAt;
}
