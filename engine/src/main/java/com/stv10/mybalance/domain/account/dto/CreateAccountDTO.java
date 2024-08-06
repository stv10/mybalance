package com.stv10.mybalance.domain.account.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class CreateAccountDTO {
    private String name;
    private String icon;
    private String description;
    private String userId;
}
