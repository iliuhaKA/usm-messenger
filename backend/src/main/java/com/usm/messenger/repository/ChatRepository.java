package com.usm.messenger.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.usm.messenger.entity.Chat;

public interface ChatRepository extends JpaRepository<Chat, Long> {
    @Query("Select c from Chat c join c.members cm where cm.user.id = :userId")
    List<Chat> findChatByUserId(@Param("userId") Long userId);
}
