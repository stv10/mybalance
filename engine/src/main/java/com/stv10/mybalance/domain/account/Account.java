package com.stv10.mybalance.domain.account;

import com.stv10.mybalance.domain.user.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

@NoArgsConstructor
@AllArgsConstructor
@Builder
@Data
@Document("accounts")
public class Account {
    @Id
    private String id;

    @Indexed
    private String name;

    private String icon;

    private String description;

    @DBRef
    private User user;

}
