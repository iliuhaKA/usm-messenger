package com.usm.messenger.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.usm.messenger.entity.enums.ChatTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Table;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data @AllArgsConstructor @Builder
@Entity @Table(name = "chats")
public class Chat {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) Long id;
    String name;
    @Enumerated(EnumType.STRING) ChatTypes type;
    @Column(name = "created_at") LocalDateTime createdAt;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "created_by") User createdBy;
    @Column(name = "avatar_url") String avatarUrl;
    String description;

    @OneToMany(mappedBy = "chat", fetch = FetchType.LAZY)

    final private List<ChatMember> members = new ArrayList<>();
}


