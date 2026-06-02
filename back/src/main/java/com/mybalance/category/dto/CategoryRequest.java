package com.mybalance.category.dto;

import com.mybalance.category.CategoryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record CategoryRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 100, message = "El nombre no puede superar los 100 caracteres")
        String name,

        @NotNull(message = "El tipo es obligatorio")
        CategoryType type,

        UUID parentCategoryId
) {}
