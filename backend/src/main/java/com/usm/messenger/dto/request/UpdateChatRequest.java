package com.usm.messenger.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateChatRequest {
    @Size(min = 1, max = 255)
    private String name;

    @Size(max = 2000)
    private String description;
}
