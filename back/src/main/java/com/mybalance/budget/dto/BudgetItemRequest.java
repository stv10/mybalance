package com.mybalance.budget.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import java.math.BigDecimal;
import java.util.UUID;

public record BudgetItemRequest(
        @NotBlank(message = "El nombre del ítem es obligatorio")
        @Size(max = 100, message = "El nombre del ítem no puede superar los 100 caracteres")
        String name,

        @NotNull(message = "La categoría es obligatoria")
        UUID categoryId,

        @NotNull(message = "El monto límite es obligatorio")
        BigDecimal amountLimit,

        @Min(value = 1, message = "El día de vencimiento mínimo es 1")
        @Max(value = 31, message = "El día de vencimiento máximo es 31")
        Integer dueDay
) {}
