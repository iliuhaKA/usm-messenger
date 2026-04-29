package com.usm.messenger.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.convert.MappingMongoConverter;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;

/**
 * Явная регистрация GridFsTemplate, чтобы быть совместимым с разными
 * версиями Spring Boot autoconfig. Использует datasource-bucket по умолчанию.
 */
@Configuration
public class MongoConfig {

    @Value("${spring.data.mongodb.gridfs.bucket:fs}")
    private String bucket;

    @Bean
    public GridFsTemplate gridFsTemplate(MongoDatabaseFactory dbFactory, MongoTemplate mongoTemplate) {
        MappingMongoConverter converter = (MappingMongoConverter) mongoTemplate.getConverter();
        return new GridFsTemplate(dbFactory, converter, bucket);
    }
}
