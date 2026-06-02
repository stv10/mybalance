package com.mybalance.infrastructure.bot.dto;

import java.math.BigDecimal;

public record AiTransactionResult(
        BigDecimal amount,
        String type,
        String categoryName,
        String accountName
) {}
