package com.mybalance.transaction.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record TransferRequest(
        @NotNull(message = "La cuenta origen es requerida")
        UUID sourceAccountId,

        @NotNull(message = "La cuenta destino es requerida")
        UUID destinationAccountId,

        @NotNull(message = "El monto es requerido")
        @Positive(message = "El monto debe ser mayor a cero")
        BigDecimal amount,

        String description,

        @NotNull(message = "La fecha es requerida")
        LocalDate date
) {}
