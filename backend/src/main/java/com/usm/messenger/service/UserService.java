package com.usm.messenger.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.usm.messenger.dto.response.UserResponse;
import com.usm.messenger.entity.User;
import com.usm.messenger.exception.UserNotFoundException;
import com.usm.messenger.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service @RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;

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
