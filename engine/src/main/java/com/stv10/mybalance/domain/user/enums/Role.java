package com.stv10.mybalance.domain.user.enums;

import lombok.Getter;

@Getter
public enum Role {
    USER("User",0), ADMIN("Admin",1), SUPER_ADMIN("Super Admin",2);

    private String value;
    private int weight;

    Role(String value, int weight) {
        this.value = value;
        this.weight = weight;
    }
}
