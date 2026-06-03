package com.mybalance.budget.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record BudgetItemResponse(
        UUID id,
        String name,
        UUID categoryId,
        String categoryName,
        String baseCategoryName,
        BigDecimal amountLimit,
        Integer dueDay
) {}
