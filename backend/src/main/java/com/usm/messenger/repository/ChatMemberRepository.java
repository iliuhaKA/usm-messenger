package com.usm.messenger.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.usm.messenger.entity.ChatMember;

public interface ChatMemberRepository extends JpaRepository<ChatMember, Long> {
    List<ChatMember> findByUserId(Long userId);
    List<ChatMember> findByChatId(Long chatId);

    Optional<ChatMember> findByUserIdAndChatId(Long userId, Long chatId);

    boolean existsByUserIdAndChatId(Long userId, Long chatId);
}
