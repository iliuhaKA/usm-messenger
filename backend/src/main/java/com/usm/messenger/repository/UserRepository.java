package com.usm.messenger.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import com.usm.messenger.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByIdnp(String idnp);
    List<User> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(String firstName, String lastName);
}
