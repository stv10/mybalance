package com.stv10.mybalance.domain.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserRegisterDTO {
    private String email;
    private String password;
    private String confirmPassword;
    private String name;
    private String lastName;
}
