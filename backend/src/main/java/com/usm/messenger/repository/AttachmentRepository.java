package com.usm.messenger.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.usm.messenger.entity.Attachment;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {
    Optional<Attachment> findByGridfsId(String gridfsId);
    List<Attachment> findByMessage_Chat_IdOrderByCreatedAtDesc(Long chatId);
}
