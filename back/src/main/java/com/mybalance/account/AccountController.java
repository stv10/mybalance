package com.mybalance.account;

import com.mybalance.account.dto.AccountRequest;
import com.mybalance.account.dto.AccountResponse;
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
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AccountResponse>>> listAccounts(
            @AuthenticationPrincipal String email) {
        List<AccountResponse> accounts = accountService.listAccounts(email);
        return ResponseEntity.ok(ApiResponse.ok(accounts));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AccountResponse>> getAccount(
            @PathVariable UUID id,
            @AuthenticationPrincipal String email) {
        AccountResponse account = accountService.getAccount(id, email);
        return ResponseEntity.ok(ApiResponse.ok(account));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AccountResponse>> createAccount(
            @Valid @RequestBody AccountRequest request,
            @AuthenticationPrincipal String email) {
        AccountResponse account = accountService.createAccount(request, email);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Cuenta creada exitosamente", account));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AccountResponse>> updateAccount(
            @PathVariable UUID id,
            @Valid @RequestBody AccountRequest request,
            @AuthenticationPrincipal String email) {
        AccountResponse account = accountService.updateAccount(id, request, email);
        return ResponseEntity.ok(ApiResponse.ok("Cuenta modificada exitosamente", account));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAccount(
            @PathVariable UUID id,
            @AuthenticationPrincipal String email) {
        accountService.deleteAccount(id, email);
        return ResponseEntity.ok(ApiResponse.ok("Cuenta eliminada exitosamente", null));
    }
}
