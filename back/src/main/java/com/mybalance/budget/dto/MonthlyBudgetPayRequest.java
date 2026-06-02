package com.mybalance.budget.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record MonthlyBudgetPayRequest(
        @NotNull(message = "La cuenta es obligatoria")
        UUID accountId,

        @NotNull(message = "El monto es obligatorio")
        BigDecimal amount,

        @NotNull(message = "La fecha es obligatoria")
        LocalDate date
) {}
