package com.usm.messenger.dto.request;

import java.util.List;

import com.usm.messenger.entity.enums.ChatTypes;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class CreateChatRequest {
    @NotBlank(message = "Chat name is required")
    private String name;

    @NotNull(message = "Chat type is required")
    private ChatTypes type;

    private String description;

    @NotNull(message = "memberIds is required")
    private List<Long> memberIds;
}
