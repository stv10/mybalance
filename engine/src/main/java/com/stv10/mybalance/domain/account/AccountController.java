package com.stv10.mybalance.domain.account;

import com.stv10.mybalance.domain.account.dto.AccountResponseDTO;
import com.stv10.mybalance.domain.account.dto.CreateAccountDTO;
import lombok.RequiredArgsConstructor;
import org.apache.coyote.Response;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("${protectedApiPrefix}/accounts")
public class AccountController {
    private final AccountService accountService;

    @GetMapping("/id")
    public ResponseEntity<?> getAccountById(String id) {
        return ResponseEntity.ok(accountService.getAccountById(id).orElse(null));
    }

    @PostMapping("/save")
    public ResponseEntity<AccountResponseDTO> saveAccount(@RequestBody CreateAccountDTO createAccountDTO) {
        ResponseEntity<AccountResponseDTO> response;

        try {
            response = ResponseEntity.ok(accountService.saveAccount(createAccountDTO));
        } catch (Exception ex) {
            response = ResponseEntity.badRequest().body(AccountResponseDTO.builder().message(ex.getMessage()).build());
        }

        return response;
    }
}
