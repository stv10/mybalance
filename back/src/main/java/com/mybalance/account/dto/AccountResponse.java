package com.mybalance.account.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record AccountResponse(
        UUID id,
        String name,
        BigDecimal balance,
        LocalDateTime createdAt
) {}
