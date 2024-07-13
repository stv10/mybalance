package com.stv10.mybalance.config;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.core.SimpleMongoClientDatabaseFactory;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@Configuration
@EnableMongoRepositories(basePackages = "com.stv10.mybalance.domain")
public class MongoDatabaseConfig {

    @Value("${spring.data.mongodb.uri}")
    private String mongoURI;

    @Value("${spring.data.mongodb.database}")
    private String database;

    @Value("${spring.data.mongodb.options}")
    private String options;

    @Bean
    public MongoClient mongoClient() {
        return MongoClients.create(mongoURI);
    }

    @Bean
    public MongoDatabaseFactory mongoDatabaseFactory(){
        return new SimpleMongoClientDatabaseFactory("%s%s".formatted(mongoURI, database));
//        return new SimpleMongoClientDatabaseFactory("%s%s%s".formatted(mongoURI, database, options));
    }

}
