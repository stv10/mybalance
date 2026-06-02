package com.mybalance.budget;

import com.mybalance.budget.dto.BudgetModelRequest;
import com.mybalance.budget.dto.BudgetModelResponse;
import com.mybalance.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/budgets/model")
@RequiredArgsConstructor
public class BudgetModelController {

    private final BudgetModelService budgetModelService;

    @GetMapping
    public ResponseEntity<ApiResponse<BudgetModelResponse>> getBudgetModel(
            @AuthenticationPrincipal String email) {
        BudgetModelResponse response = budgetModelService.getBudgetModel(email);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<BudgetModelResponse>> saveBudgetModel(
            @Valid @RequestBody BudgetModelRequest request,
            @AuthenticationPrincipal String email) {
        BudgetModelResponse response = budgetModelService.saveBudgetModel(request, email);
        return ResponseEntity.ok(ApiResponse.ok("Modelo de presupuesto guardado exitosamente", response));
    }
}
