package com.mybalance.transaction.dto;

import com.mybalance.category.CategoryType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record TransactionResponse(
        UUID id,
        UUID accountId,
        String accountName,
        UUID categoryId,
        String categoryName,
        CategoryType type,
        BigDecimal amount,
        String description,
        String notes,
        LocalDate date,
        LocalDateTime createdAt
) {}
