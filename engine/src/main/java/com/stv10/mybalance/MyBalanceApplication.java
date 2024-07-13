package com.stv10.mybalance;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.context.annotation.PropertySources;

@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class, MongoAutoConfiguration.class})
@PropertySources({
		@PropertySource(value = "classpath:application.properties")
		,
		@PropertySource(value = "file:${user.home}${file.separator}.mybalance{file.separator}application.properties", ignoreResourceNotFound = true)
})
public class MyBalanceApplication {

	public static void main(String[] args) {
		SpringApplication.run(MyBalanceApplication.class, args);
	}

}
