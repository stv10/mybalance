package com.stv10.mybalance.domain.user;

import com.stv10.mybalance.domain.person.Person;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@Data
@AllArgsConstructor
@Document("users")
@Builder
public class User extends Person {

    private String password;

    @Indexed
    private String email;

    @DBRef
    private Person personData;


}
