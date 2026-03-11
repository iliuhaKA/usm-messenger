package com.usm.messenger.entity;

import java.time.LocalDateTime;

import com.usm.messenger.entity.enums.ChatRoles;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
@Entity @Table(name = "chats_members", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "chat_id"}))
public class ChatMember {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id") User user;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "chat_id") Chat chat;
    @Enumerated(EnumType.STRING) ChatRoles role;
    @Column(name = "joined_at") LocalDateTime joinedAt;
    @Column(name = "is_pinned") Boolean isPinned;
    @Column(name = "is_muted") Boolean isMuted;
}
