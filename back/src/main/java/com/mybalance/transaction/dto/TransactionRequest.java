package com.mybalance.transaction.dto;

import com.mybalance.category.CategoryType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record TransactionRequest(
        @NotNull(message = "La cuenta es obligatoria")
        UUID accountId,

        @NotNull(message = "La categoría es obligatoria")
        UUID categoryId,

        @NotNull(message = "El tipo de transacción es obligatorio")
        CategoryType type,

        @NotNull(message = "El monto es obligatorio")
        @DecimalMin(value = "0.01", message = "El monto debe ser mayor que cero")
        BigDecimal amount,

        @Size(max = 32, message = "El título no debe exceder 32 caracteres")
        String description,

        @Size(max = 256, message = "Las observaciones no deben exceder 256 caracteres")
        String notes,

        @NotNull(message = "La fecha es obligatoria")
        LocalDate date
) {}
