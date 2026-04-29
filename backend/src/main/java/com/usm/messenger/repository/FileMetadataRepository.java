package com.usm.messenger.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

import com.usm.messenger.entity.FileMetadata;

public interface FileMetadataRepository extends MongoRepository<FileMetadata, String> {
    Optional<FileMetadata> findByGridfsId(String gridfsId);
    List<FileMetadata> findByChatIdAndPurposeOrderByCreatedAtDesc(Long chatId, String purpose);
    List<FileMetadata> findByOwnerIdAndPurpose(Long ownerId, String purpose);
}
