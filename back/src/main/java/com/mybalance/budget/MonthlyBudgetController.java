package com.mybalance.budget;

import com.mybalance.budget.dto.BudgetComparisonResponse;
import com.mybalance.budget.dto.BudgetModelRequest;
import com.mybalance.budget.dto.BudgetModelResponse;
import com.mybalance.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.mybalance.budget.dto.MonthlyBudgetPayRequest;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/budgets/monthly")
@RequiredArgsConstructor
public class MonthlyBudgetController {

    private final MonthlyBudgetService monthlyBudgetService;

    @GetMapping("/compare")
    public ResponseEntity<ApiResponse<BudgetComparisonResponse>> compareBudget(
            @RequestParam Integer month,
            @RequestParam Integer year,
            @AuthenticationPrincipal String email) {
        BudgetComparisonResponse comparison = monthlyBudgetService.compareBudgetWithExpenses(email, month, year);
        return ResponseEntity.ok(ApiResponse.ok(comparison));
    }

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<BudgetComparisonResponse>> generateBudget(
            @RequestParam Integer month,
            @RequestParam Integer year,
            @AuthenticationPrincipal String email) {
        monthlyBudgetService.getOrCreateMonthlyBudget(email, month, year);
        BudgetComparisonResponse comparison = monthlyBudgetService.compareBudgetWithExpenses(email, month, year);
        return ResponseEntity.ok(ApiResponse.ok("Presupuesto del mes generado exitosamente", comparison));
    }

    @PostMapping("/regenerate")
    public ResponseEntity<ApiResponse<BudgetComparisonResponse>> regenerateBudget(
            @RequestParam Integer month,
            @RequestParam Integer year,
            @AuthenticationPrincipal String email) {
        BudgetComparisonResponse comparison = monthlyBudgetService.regenerateMonthlyBudget(email, month, year);
        return ResponseEntity.ok(ApiResponse.ok("Presupuesto del mes regenerado exitosamente", comparison));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BudgetModelResponse>> updateMonthlyBudget(
            @PathVariable UUID id,
            @Valid @RequestBody BudgetModelRequest request,
            @AuthenticationPrincipal String email) {
        BudgetModelResponse response = monthlyBudgetService.updateMonthlyBudget(id, request, email);
        return ResponseEntity.ok(ApiResponse.ok("Presupuesto del mes modificado exitosamente", response));
    }

    @PostMapping("/items/{itemId}/pay")
    public ResponseEntity<ApiResponse<BudgetComparisonResponse>> payBudgetItem(
            @PathVariable UUID itemId,
            @Valid @RequestBody MonthlyBudgetPayRequest request,
            @AuthenticationPrincipal String email) {
        BudgetComparisonResponse comparison = monthlyBudgetService.payBudgetItem(itemId, request, email);
        return ResponseEntity.ok(ApiResponse.ok("Ítem de presupuesto pagado exitosamente", comparison));
    }

    @PostMapping("/items/{itemId}/unpay")
    public ResponseEntity<ApiResponse<BudgetComparisonResponse>> unpayBudgetItem(
            @PathVariable UUID itemId,
            @AuthenticationPrincipal String email) {
        BudgetComparisonResponse comparison = monthlyBudgetService.unpayBudgetItem(itemId, email);
        return ResponseEntity.ok(ApiResponse.ok("Pago de ítem de presupuesto cancelado exitosamente", comparison));
    }
}
