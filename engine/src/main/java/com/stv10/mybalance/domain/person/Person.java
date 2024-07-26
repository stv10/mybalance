package com.stv10.mybalance.domain.person;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.apache.logging.log4j.util.Strings;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Objects;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Document("persons")
@SuperBuilder
public class Person {
    @Id
    private String id;

    @Indexed
    private String name;

    @Indexed
    private String lastName;

    private String fullName;


    public String parseFullName() {
        return "%s %s".formatted(Objects.toString(name, Strings.EMPTY),
                Objects.toString(lastName, Strings.EMPTY)).trim();
    }
}
