package com.mybalance.category.dto;

import com.mybalance.category.CategoryType;
import java.time.LocalDateTime;
import java.util.UUID;

public record CategoryResponse(
        UUID id,
        String name,
        CategoryType type,
        UUID parentCategoryId,
        String parentCategoryName,
        boolean isUserCreated,
        LocalDateTime createdAt
) {}
