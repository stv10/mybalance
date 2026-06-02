package com.mybalance.account.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record AccountRequest(
        @NotBlank(message = "El nombre de la cuenta es obligatorio")
        @Size(max = 100, message = "El nombre de la cuenta no debe exceder 100 caracteres")
        String name,

        @NotNull(message = "El saldo inicial/actual es obligatorio")
        BigDecimal balance
) {}
