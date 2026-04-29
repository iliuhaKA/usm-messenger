package com.usm.messenger.dto.response;

import java.time.LocalDateTime;

import com.usm.messenger.entity.enums.UserRoles;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class UserResponse {
    private Long id;
    private String idnp;
    private String firstName;
    private String lastName;
    private String email;
    private UserRoles role;
    private String avatarUrl;
    private String avatarFileId;
    private LocalDateTime lastSeen;
    /** Роль в конкретном чате (ADMIN/MEMBER) — заполняется только когда DTO выдаётся как член чата. */
    private String chatRole;
}
