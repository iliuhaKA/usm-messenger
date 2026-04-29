package com.usm.messenger.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RenameFileRequest {
    @NotBlank
    private String fileName;
}
