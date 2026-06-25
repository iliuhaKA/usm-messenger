package com.usm.messenger.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AttachmentResponse {
    private Long id;
    private String fileId;       // gridfsId — для скачивания через /api/files/{fileId}
    private String fileName;
    private String mimeType;
    private long sizeBytes;
    private Long uploadedById;
    private Long durationMs;     // для голосовых сообщений
}
