package com.usm.messenger.entity;

import java.time.LocalDateTime;

import com.usm.messenger.entity.enums.UserRoles;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data @AllArgsConstructor @Builder
@Entity @Table(name = "users")
public class User {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) Long id;
    String idnp;
    @Column(name = "password_hash") String passwordHash;
    @Column(name = "first_name") String firstName;
    @Column(name = "last_name") String lastName;
    String email;
    @Enumerated(EnumType.STRING) UserRoles role;
    @Column(name = "avatar_url") String avatarUrl;
    @Column(name = "created_at") LocalDateTime createdAt;
    @Column(name = "last_seen") LocalDateTime lastSeen;
    @Column(name = "is_password_set") Boolean isPasswordSet;
}
