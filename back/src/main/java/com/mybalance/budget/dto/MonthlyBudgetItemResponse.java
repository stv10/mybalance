package com.mybalance.budget.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record MonthlyBudgetItemResponse(
        UUID id,
        String name,
        UUID categoryId,
        String categoryName,
        BigDecimal amountLimit,
        boolean paid,
        UUID transactionId,
        BigDecimal paidAmount,
        String accountName,
        Integer dueDay,
        LocalDate dueDate
) {}
