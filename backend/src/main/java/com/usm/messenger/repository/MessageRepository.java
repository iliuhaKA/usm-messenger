package com.usm.messenger.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.usm.messenger.entity.Message;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByChat_IdOrderByCreatedAtAsc(Long chatId);

    Optional<Message> findFirstByChat_IdOrderByCreatedAtDesc(Long chatId);

    @Query("""
        SELECT COUNT(m) FROM Message m
        WHERE m.chat.id = :chatId
        AND m.sender IS NOT NULL
        AND m.sender.id <> :userId
        AND m.createdAt > :since
        """)
    long countIncomingUnreadAfter(
        @Param("chatId") Long chatId,
        @Param("userId") Long userId,
        @Param("since") LocalDateTime since
    );
}
