package com.mybalance.budget.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

import java.util.List;

public record BudgetModelRequest(
        @NotNull(message = "El límite total es requerido")
        BigDecimal totalLimit,

        @NotNull(message = "El porcentaje para Vida es requerido")
        BigDecimal percentVida,

        @NotNull(message = "El porcentaje para Ocio es requerido")
        BigDecimal percentOcio,

        @NotNull(message = "El porcentaje para Inversión-Deuda es requerido")
        BigDecimal percentInversionDeuda,

        @Valid
        List<BudgetItemRequest> items
) {}
