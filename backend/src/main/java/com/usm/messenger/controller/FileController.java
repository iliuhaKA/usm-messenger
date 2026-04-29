package com.usm.messenger.controller;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.usm.messenger.dto.request.RenameFileRequest;
import com.usm.messenger.dto.response.AttachmentResponse;
import com.usm.messenger.security.AuthenticatedUser;
import com.usm.messenger.service.FileService;
import com.usm.messenger.service.FileService.DownloadResult;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @PostMapping(path = "/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AttachmentResponse> uploadAttachment(
        @AuthenticationPrincipal AuthenticatedUser me,
        @RequestParam("chatId") Long chatId,
        @RequestParam("file") MultipartFile file
    ) throws IOException {
        return ResponseEntity.ok(fileService.uploadAttachment(file, me.id(), chatId));
    }

    @PostMapping(path = "/avatars/user", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadUserAvatar(
        @AuthenticationPrincipal AuthenticatedUser me,
        @RequestParam("file") MultipartFile file
    ) throws IOException {
        String fileId = fileService.uploadAvatar(file, me.id(), FileService.PURPOSE_AVATAR_USER, null);
        return ResponseEntity.ok(fileId);
    }

    @PostMapping(path = "/avatars/chat/{chatId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadChatAvatar(
        @AuthenticationPrincipal AuthenticatedUser me,
        @PathVariable Long chatId,
        @RequestParam("file") MultipartFile file
    ) throws IOException {
        String fileId = fileService.uploadAvatar(file, me.id(), FileService.PURPOSE_AVATAR_CHAT, chatId);
        return ResponseEntity.ok(fileId);
    }

    @GetMapping("/{fileId}")
    public ResponseEntity<InputStreamResource> download(
        @AuthenticationPrincipal AuthenticatedUser me,
        @PathVariable String fileId
    ) throws IOException {
        Long requesterId = me != null ? me.id() : null;
        DownloadResult result = fileService.download(fileId, requesterId);

        String mime = result.meta().getMimeType() != null
            ? result.meta().getMimeType()
            : MediaType.APPLICATION_OCTET_STREAM_VALUE;
        String name = result.meta().getOriginalName() != null
            ? result.meta().getOriginalName()
            : "file";
        String encodedName = java.net.URLEncoder.encode(name, StandardCharsets.UTF_8).replace("+", "%20");

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(mime))
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "inline; filename=\"" + name + "\"; filename*=UTF-8''" + encodedName)
            .contentLength(result.meta().getSizeBytes())
            .body(new InputStreamResource(result.resource().getInputStream()));
    }

    @GetMapping("/chats/{chatId}")
    public ResponseEntity<List<AttachmentResponse>> listForChat(
        @AuthenticationPrincipal AuthenticatedUser me,
        @PathVariable Long chatId
    ) {
        return ResponseEntity.ok(fileService.listForChat(chatId, me.id()));
    }

    @PatchMapping("/{attachmentId}")
    public ResponseEntity<AttachmentResponse> rename(
        @AuthenticationPrincipal AuthenticatedUser me,
        @PathVariable Long attachmentId,
        @Valid @RequestBody RenameFileRequest body
    ) {
        return ResponseEntity.ok(fileService.rename(attachmentId, me.id(), body.getFileName()));
    }

    @DeleteMapping("/{attachmentId}")
    public ResponseEntity<Void> delete(
        @AuthenticationPrincipal AuthenticatedUser me,
        @PathVariable Long attachmentId
    ) {
        fileService.delete(attachmentId, me.id());
        return ResponseEntity.noContent().build();
    }
}
