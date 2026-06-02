package com.mybalance.budget.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record BudgetComparisonResponse(
        UUID monthlyBudgetId,
        BigDecimal totalLimit,
        BigDecimal totalSpent,
        BigDecimal percentVida,
        BigDecimal percentOcio,
        BigDecimal percentInversionDeuda,
        List<MonthlyBudgetItemResponse> items
) {}
