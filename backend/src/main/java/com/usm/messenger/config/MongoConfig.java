package com.usm.messenger.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.SimpleMongoClientDatabaseFactory;
import org.springframework.data.mongodb.core.convert.MappingMongoConverter;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;

/**
 * Явная конфигурация MongoDB. Spring Boot 4 / spring-data-mongodb 5 в
 * текущей версии не всегда корректно подхватывает spring.data.mongodb.host/uri
 * из ENV (наблюдаемое поведение: продолжает ходить на localhost:27017).
 * Здесь жёстко берём host/port/db из переменных окружения.
 */
@Configuration
public class MongoConfig {

    @Value("${SPRING_DATA_MONGODB_HOST:localhost}")
    private String host;

    @Value("${SPRING_DATA_MONGODB_PORT:27017}")
    private int port;

    @Value("${SPRING_DATA_MONGODB_DATABASE:usm_messenger}")
    private String database;

    @Bean
    public MongoClient mongoClient() {
        ConnectionString cs = new ConnectionString("mongodb://" + host + ":" + port);
        MongoClientSettings settings = MongoClientSettings.builder()
            .applyConnectionString(cs)
            .build();
        return MongoClients.create(settings);
    }

    @Bean
    public MongoDatabaseFactory mongoDatabaseFactory(MongoClient client) {
        return new SimpleMongoClientDatabaseFactory(client, database);
    }

    @Bean
    public MongoTemplate mongoTemplate(MongoDatabaseFactory factory) {
        return new MongoTemplate(factory);
    }

    @Bean
    public GridFsTemplate gridFsTemplate(MongoDatabaseFactory dbFactory, MongoTemplate mongoTemplate) {
        MappingMongoConverter converter = (MappingMongoConverter) mongoTemplate.getConverter();
        return new GridFsTemplate(dbFactory, converter);
    }
}
