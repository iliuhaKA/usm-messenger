package com.usm.messenger.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

import com.usm.messenger.dto.request.ChangePasswordRequest;
import com.usm.messenger.dto.request.LoginRequest;
import com.usm.messenger.dto.request.UpdateProfileRequest;
import com.usm.messenger.dto.response.UserResponse;
import com.usm.messenger.entity.User;
import com.usm.messenger.exception.BadCredentialsException;
import com.usm.messenger.exception.UserNotFoundException;
import com.usm.messenger.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service @RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id).orElseThrow( () -> new UserNotFoundException("User not found: " + id));
        return toResponse(user);
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    public List<UserResponse> searchUsers(String query){
        return userRepository.findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(query, query)
            .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public User authenticateAndGetUser(LoginRequest request) {
        Optional<User> userOpt = request.getLogin().contains("@")
            ? userRepository.findByEmailIgnoreCase(request.getLogin().trim())
            : userRepository.findByIdnp(request.getLogin().trim());

        User user = userOpt.orElseThrow(() -> new BadCredentialsException("Неверный логин или пароль"));

        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Неверный логин или пароль");
        }

        return user;
    }

    public UserResponse authenticate(LoginRequest request) {
        return toResponse(authenticateAndGetUser(request));
    }

    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));
        if (request.getFirstName() != null) user.setFirstName(request.getFirstName().trim());
        if (request.getLastName() != null) user.setLastName(request.getLastName().trim());
        if (request.getEmail() != null) user.setEmail(request.getEmail().trim());
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));
        if (user.getPasswordHash() == null
            || !passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Текущий пароль введён неверно");
        }
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setIsPasswordSet(true);
        userRepository.save(user);
    }

    @Transactional
    public UserResponse setAvatar(Long userId, String avatarFileId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));
        user.setAvatarFileId(avatarFileId);
        return toResponse(userRepository.save(user));
    }

    private UserResponse toResponse(User user) {
        UserResponse dto = new UserResponse();
        dto.setId(user.getId());
        dto.setIdnp(user.getIdnp());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setAvatarFileId(user.getAvatarFileId());
        dto.setLastSeen(user.getLastSeen());
        return dto;
    }

    public UserResponse toUserResponse(User user) {
        return toResponse(user);
    }
}
