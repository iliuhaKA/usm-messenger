package com.usm.messenger.entity;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * MongoDB-документ с метаданными файла. Сам бинарь хранится в GridFS,
 * сюда мы кладём id GridFS-документа, тип, размер, владельца и назначение.
 *
 * Назначение определяется purpose:
 *   ATTACHMENT  — вложение в чат
 *   AVATAR_USER — аватар пользователя
 *   AVATAR_CHAT — аватар чата
 */
@Document(collection = "file_metadata")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FileMetadata {

    @Id
    private String id;

    @Indexed
    private String gridfsId;

    private String originalName;
    private String mimeType;
    private long sizeBytes;

    @Indexed
    private Long ownerId;

    @Indexed
    private Long chatId;

    @Indexed
    private String purpose;

    private Instant createdAt;
}
