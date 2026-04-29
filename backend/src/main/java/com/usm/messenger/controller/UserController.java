package com.usm.messenger.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.usm.messenger.dto.request.ChangePasswordRequest;
import com.usm.messenger.dto.request.UpdateProfileRequest;
import com.usm.messenger.dto.response.UserResponse;
import com.usm.messenger.security.AuthenticatedUser;
import com.usm.messenger.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController @RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal AuthenticatedUser me) {
        return ResponseEntity.ok(userService.getUserById(me.id()));
    }

    @PatchMapping("/me")
    public ResponseEntity<UserResponse> updateProfile(
        @AuthenticationPrincipal AuthenticatedUser me,
        @Valid @RequestBody UpdateProfileRequest body
    ) {
        return ResponseEntity.ok(userService.updateProfile(me.id(), body));
    }

    @PostMapping("/me/password")
    public ResponseEntity<Void> changePassword(
        @AuthenticationPrincipal AuthenticatedUser me,
        @Valid @RequestBody ChangePasswordRequest body
    ) {
        userService.changePassword(me.id(), body);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/me/avatar")
    public ResponseEntity<UserResponse> setAvatar(
        @AuthenticationPrincipal AuthenticatedUser me,
        @RequestParam("fileId") String fileId
    ) {
        return ResponseEntity.ok(userService.setAvatar(me.id(), fileId));
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id)  {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserResponse>> searchUsers(@RequestParam(name = "q") String query) {
        return ResponseEntity.ok(userService.searchUsers(query));
    }
}
