package com.mybalance.account;

import com.mybalance.account.dto.AccountRequest;
import com.mybalance.account.dto.AccountResponse;
import com.mybalance.auth.User;
import com.mybalance.auth.UserRepository;
import com.mybalance.shared.exception.BusinessException;
import com.mybalance.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<AccountResponse> listAccounts(String email) {
        return accountRepository.findByUserEmailOrderByNameAsc(email).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AccountResponse getAccount(UUID id, String email) {
        Account account = accountRepository.findByIdAndUserEmail(id, email)
                .orElseThrow(() -> new ResourceNotFoundException("Account", id.toString()));
        return mapToResponse(account);
    }

    @Transactional
    public AccountResponse createAccount(AccountRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", email));

        if (accountRepository.existsByUserEmailAndNameIgnoreCase(email, request.name())) {
            throw new BusinessException("Ya existe una cuenta con el nombre: " + request.name());
        }

        Account account = Account.builder()
                .user(user)
                .name(request.name().trim())
                .balance(request.balance())
                .build();

        account = accountRepository.save(account);
        return mapToResponse(account);
    }

    @Transactional
    public AccountResponse updateAccount(UUID id, AccountRequest request, String email) {
        Account account = accountRepository.findByIdAndUserEmail(id, email)
                .orElseThrow(() -> new ResourceNotFoundException("Account", id.toString()));

        if (!account.getName().equalsIgnoreCase(request.name().trim()) &&
                accountRepository.existsByUserEmailAndNameIgnoreCase(email, request.name())) {
            throw new BusinessException("Ya existe una cuenta con el nombre: " + request.name());
        }

        account.setName(request.name().trim());
        account.setBalance(request.balance());

        account = accountRepository.save(account);
        return mapToResponse(account);
    }

    @Transactional
    public void deleteAccount(UUID id, String email) {
        Account account = accountRepository.findByIdAndUserEmail(id, email)
                .orElseThrow(() -> new ResourceNotFoundException("Account", id.toString()));

        try {
            accountRepository.delete(account);
            // Ejecutamos un flush para que cualquier restricción de BD salte dentro de la transacción
            accountRepository.flush();
        } catch (DataIntegrityViolationException ex) {
            throw new BusinessException("No se puede eliminar la cuenta '" + account.getName() + 
                    "' porque tiene transacciones asociadas. Elimine las transacciones primero.");
        }
    }

    public AccountResponse mapToResponse(Account account) {
        return new AccountResponse(
                account.getId(),
                account.getName(),
                account.getBalance(),
                account.getCreatedAt()
        );
    }
}
