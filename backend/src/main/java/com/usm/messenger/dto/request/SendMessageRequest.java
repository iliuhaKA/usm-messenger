package com.usm.messenger.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {

    /**
     * Текст сообщения. Может быть пустым, если есть attachmentId
     * (отправка только файла без текста).
     */
    private String content;

    /**
     * id записи в attachments (Postgres). Опционально.
     * Файл должен быть предварительно загружен через POST /api/files/attachments.
     */
    private Long attachmentId;
}
