package com.mybalance.category;

import com.mybalance.category.dto.CategoryRequest;
import com.mybalance.category.dto.CategoryResponse;
import com.mybalance.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> listCategories(
            @AuthenticationPrincipal String email) {
        List<CategoryResponse> categories = categoryService.listCategories(email);
        return ResponseEntity.ok(ApiResponse.ok(categories));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
            @Valid @RequestBody CategoryRequest request,
            @AuthenticationPrincipal String email) {
        CategoryResponse category = categoryService.createCategory(request, email);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Categoría creada exitosamente", category));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(
            @PathVariable UUID id,
            @AuthenticationPrincipal String email) {
        categoryService.deleteCategory(id, email);
        return ResponseEntity.ok(ApiResponse.ok("Categoría eliminada exitosamente", null));
    }
}
