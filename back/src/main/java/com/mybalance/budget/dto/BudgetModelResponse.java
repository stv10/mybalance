package com.mybalance.budget.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record BudgetModelResponse(
        UUID id,
        BigDecimal totalLimit,
        BigDecimal percentVida,
        BigDecimal percentOcio,
        BigDecimal percentInversionDeuda,
        List<BudgetItemResponse> items
) {}
