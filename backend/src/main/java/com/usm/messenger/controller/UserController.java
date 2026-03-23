package com.usm.messenger.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.usm.messenger.dto.response.UserResponse;
import com.usm.messenger.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController @RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    
    private final UserService userService;

    @GetMapping
    public List<UserResponse> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public UserResponse getUserById(@PathVariable Long id)  {
        return userService.getUserById(id);
    }

    @GetMapping("/search")
    public List<UserResponse> searchUsers(@RequestParam(name = "q") String query) {
        return userService.searchUsers(query);
    }
}
