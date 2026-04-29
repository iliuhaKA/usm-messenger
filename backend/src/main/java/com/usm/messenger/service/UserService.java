package com.usm.messenger.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.usm.messenger.dto.request.LoginRequest;
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

    private UserResponse toResponse(User user) {
        UserResponse dto = new UserResponse();
        dto.setId(user.getId());
        dto.setIdnp(user.getIdnp());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setLastSeen(user.getLastSeen());
        return dto;
    }

    public UserResponse toUserResponse(User user) {
        return toResponse(user);
    }
}
