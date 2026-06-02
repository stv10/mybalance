package com.mybalance.transaction;

import com.mybalance.shared.response.ApiResponse;
import com.mybalance.transaction.dto.TransactionRequest;
import com.mybalance.transaction.dto.TransactionResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TransactionResponse>>> listTransactions(
            @AuthenticationPrincipal String email) {
        List<TransactionResponse> transactions = transactionService.listTransactions(email);
        return ResponseEntity.ok(ApiResponse.ok(transactions));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionResponse>> getTransaction(
            @PathVariable UUID id,
            @AuthenticationPrincipal String email) {
        TransactionResponse transaction = transactionService.getTransaction(id, email);
        return ResponseEntity.ok(ApiResponse.ok(transaction));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TransactionResponse>> createTransaction(
            @Valid @RequestBody TransactionRequest request,
            @AuthenticationPrincipal String email) {
        TransactionResponse transaction = transactionService.createTransaction(request, email);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Transacción creada exitosamente", transaction));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionResponse>> updateTransaction(
            @PathVariable UUID id,
            @Valid @RequestBody TransactionRequest request,
            @AuthenticationPrincipal String email) {
        TransactionResponse transaction = transactionService.updateTransaction(id, request, email);
        return ResponseEntity.ok(ApiResponse.ok("Transacción modificada exitosamente", transaction));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTransaction(
            @PathVariable UUID id,
            @AuthenticationPrincipal String email) {
        transactionService.deleteTransaction(id, email);
        return ResponseEntity.ok(ApiResponse.ok("Transacción eliminada exitosamente", null));
    }
}
