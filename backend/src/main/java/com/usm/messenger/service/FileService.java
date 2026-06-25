package com.usm.messenger.service;

import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.mongodb.client.gridfs.model.GridFSFile;
import com.usm.messenger.dto.response.AttachmentResponse;
import com.usm.messenger.entity.Attachment;
import com.usm.messenger.entity.FileMetadata;
import com.usm.messenger.entity.User;
import com.usm.messenger.exception.AccessDeniedException;
import com.usm.messenger.repository.AttachmentRepository;
import com.usm.messenger.repository.ChatMemberRepository;
import com.usm.messenger.repository.FileMetadataRepository;
import com.usm.messenger.repository.UserRepository;

import lombok.RequiredArgsConstructor;

/**
 * Работа с файлами: бинарь — в MongoDB GridFS, метаданные — в Mongo (file_metadata)
 * + параллельная запись в Postgres-таблицу attachments (для сообщений) или
 * users.avatar_file_id / chats.avatar_file_id (для аватаров).
 *
 * Связка двух БД: gridfs_id из Postgres = id документа в Mongo fs.files и file_metadata.
 */
@Service
@RequiredArgsConstructor
public class FileService {

    public static final String PURPOSE_ATTACHMENT = "ATTACHMENT";
    public static final String PURPOSE_AVATAR_USER = "AVATAR_USER";
    public static final String PURPOSE_AVATAR_CHAT = "AVATAR_CHAT";
    public static final String PURPOSE_VOICE = "VOICE";

    private final GridFsTemplate gridFs;
    private final FileMetadataRepository metadataRepo;
    private final AttachmentRepository attachmentRepo;
    private final UserRepository userRepo;
    private final ChatMemberRepository chatMemberRepo;

    @Transactional
    public AttachmentResponse uploadAttachment(MultipartFile file, Long userId, Long chatId) throws IOException {
        return uploadAttachment(file, userId, chatId, null, false);
    }

    @Transactional
    public AttachmentResponse uploadAttachment(MultipartFile file,
                                               Long userId,
                                               Long chatId,
                                               Long durationMs,
                                               boolean voice) throws IOException {
        ensureMember(chatId, userId);
        String purpose = voice ? PURPOSE_VOICE : PURPOSE_ATTACHMENT;
        FileMetadata meta = storeBinary(file, userId, chatId, purpose, durationMs);

        User uploader = userRepo.findById(userId)
            .orElseThrow(() -> new AccessDeniedException("User not found"));

        Attachment a = Attachment.builder()
            .fileName(meta.getOriginalName())
            .fileType(meta.getMimeType())
            .fileSize(meta.getSizeBytes())
            .gridfsId(meta.getGridfsId())
            .uploadedBy(uploader)
            .createdAt(LocalDateTime.now())
            .durationMs(durationMs)
            .build();
        a = attachmentRepo.save(a);

        return toResponse(a);
    }

    @Transactional
    public String uploadAvatar(MultipartFile file, Long userId, String purpose, Long targetChatId) throws IOException {
        if (!PURPOSE_AVATAR_USER.equals(purpose) && !PURPOSE_AVATAR_CHAT.equals(purpose)) {
            throw new IllegalArgumentException("Unsupported avatar purpose: " + purpose);
        }
        FileMetadata meta = storeBinary(file, userId, targetChatId, purpose, null);
        return meta.getGridfsId();
    }

    private FileMetadata storeBinary(MultipartFile file, Long ownerId, Long chatId, String purpose, Long durationMs) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Empty file");
        }
        String mime = file.getContentType() != null ? file.getContentType() : "application/octet-stream";

        try (InputStream in = file.getInputStream()) {
            ObjectId gridId = gridFs.store(in, file.getOriginalFilename(), mime);

            FileMetadata meta = FileMetadata.builder()
                .gridfsId(gridId.toHexString())
                .originalName(file.getOriginalFilename())
                .mimeType(mime)
                .sizeBytes(file.getSize())
                .ownerId(ownerId)
                .chatId(chatId)
                .purpose(purpose)
                .createdAt(Instant.now())
                .durationMs(durationMs)
                .build();

            return metadataRepo.save(meta);
        }
    }

    public DownloadResult download(String gridfsId, Long requesterId) {
        FileMetadata meta = metadataRepo.findByGridfsId(gridfsId)
            .orElseThrow(() -> new AccessDeniedException("File not found: " + gridfsId));

        // Скачивание публично — id это 24-символьный криптостойкий ObjectId,
        // угадать его невозможно. Если в будущем потребуется строгая проверка
        // прав на вложения, нужно либо подписывать URL'ы, либо отдавать через
        // авторизованный endpoint, который проксирует bytes в blob на клиенте.
        // requesterId здесь оставлен для будущих use-case'ов (логирование).
        if (requesterId != null
            && PURPOSE_ATTACHMENT.equals(meta.getPurpose())
            && meta.getChatId() != null) {
            ensureMember(meta.getChatId(), requesterId);
        }

        GridFSFile file = gridFs.findOne(byId(gridfsId));
        if (file == null) {
            throw new AccessDeniedException("File payload missing in GridFS: " + gridfsId);
        }
        GridFsResource resource = gridFs.getResource(file);
        return new DownloadResult(resource, meta);
    }

    @Transactional
    public AttachmentResponse rename(Long attachmentId, Long userId, String newName) {
        Attachment a = attachmentRepo.findById(attachmentId)
            .orElseThrow(() -> new AccessDeniedException("Attachment not found: " + attachmentId));
        if (a.getUploadedBy() == null || !a.getUploadedBy().getId().equals(userId)) {
            throw new AccessDeniedException("Only uploader can rename");
        }
        a.setFileName(newName);
        attachmentRepo.save(a);

        metadataRepo.findByGridfsId(a.getGridfsId()).ifPresent(m -> {
            m.setOriginalName(newName);
            metadataRepo.save(m);
        });

        return toResponse(a);
    }

    @Transactional
    public void delete(Long attachmentId, Long userId) {
        Attachment a = attachmentRepo.findById(attachmentId)
            .orElseThrow(() -> new AccessDeniedException("Attachment not found: " + attachmentId));
        if (a.getUploadedBy() == null || !a.getUploadedBy().getId().equals(userId)) {
            throw new AccessDeniedException("Only uploader can delete");
        }
        String gridId = a.getGridfsId();
        if (gridId != null) {
            gridFs.delete(byId(gridId));
            metadataRepo.findByGridfsId(gridId).ifPresent(metadataRepo::delete);
        }
        attachmentRepo.delete(a);
    }

    public List<AttachmentResponse> listForChat(Long chatId, Long userId) {
        ensureMember(chatId, userId);
        return attachmentRepo.findByMessage_Chat_IdOrderByCreatedAtDesc(chatId).stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    public AttachmentResponse toResponse(Attachment a) {
        return AttachmentResponse.builder()
            .id(a.getId())
            .fileId(a.getGridfsId())
            .fileName(a.getFileName())
            .mimeType(a.getFileType())
            .sizeBytes(a.getFileSize() == null ? 0 : a.getFileSize())
            .uploadedById(a.getUploadedBy() != null ? a.getUploadedBy().getId() : null)
            .durationMs(a.getDurationMs())
            .build();
    }

    private void ensureMember(Long chatId, Long userId) {
        if (chatId != null && !chatMemberRepo.existsByUserIdAndChatId(userId, chatId)) {
            throw new AccessDeniedException("Access denied to chat: " + chatId);
        }
    }

    private static Query byId(String gridfsId) {
        return Query.query(Criteria.where("_id").is(new ObjectId(gridfsId)));
    }

    public record DownloadResult(GridFsResource resource, FileMetadata meta) {}
}
