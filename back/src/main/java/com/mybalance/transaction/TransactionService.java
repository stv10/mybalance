package com.mybalance.transaction;

import com.mybalance.account.Account;
import com.mybalance.account.AccountRepository;
import com.mybalance.category.Category;
import com.mybalance.category.CategoryRepository;
import com.mybalance.category.CategoryType;
import com.mybalance.shared.exception.BusinessException;
import com.mybalance.shared.exception.ResourceNotFoundException;
import com.mybalance.transaction.dto.TransactionRequest;
import com.mybalance.transaction.dto.TransactionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final AccountRepository accountRepository;

    @Transactional(readOnly = true)
    public List<TransactionResponse> listTransactions(String email) {
        return transactionRepository.findByAccountUserEmailOrderByDateDesc(email).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TransactionResponse getTransaction(UUID id, String email) {
        Transaction transaction = transactionRepository.findByIdAndAccountUserEmail(id, email)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", id.toString()));
        return mapToResponse(transaction);
    }

    @Transactional
    public TransactionResponse createTransaction(TransactionRequest request, String email) {
        Account account = accountRepository.findByIdAndUserEmail(request.accountId(), email)
                .orElseThrow(() -> new ResourceNotFoundException("Account", request.accountId().toString()));

        Category category = categoryRepository.findByIdAndUserEmail(request.categoryId(), email)
                .orElseThrow(() -> new ResourceNotFoundException("Category", request.categoryId().toString()));

        if (category.getType() != request.type()) {
            throw new BusinessException("El tipo de transacción (" + request.type() + 
                    ") no coincide con el tipo de la categoría seleccionada (" + category.getType() + ")");
        }

        // Aplicar recalculo de saldo utilizando la lógica del modelo de dominio
        if (request.type() == CategoryType.INCOME) {
            account.credit(request.amount());
        } else {
            account.debit(request.amount());
        }

        // Guardar la cuenta con el saldo actualizado
        accountRepository.save(account);

        Transaction transaction = Transaction.builder()
                .account(account)
                .category(category)
                .type(request.type())
                .amount(request.amount())
                .description(request.description())
                .date(request.date())
                .build();

        transaction = transactionRepository.save(transaction);
        return mapToResponse(transaction);
    }

    @Transactional
    public TransactionResponse updateTransaction(UUID id, TransactionRequest request, String email) {
        Transaction transaction = transactionRepository.findByIdAndAccountUserEmail(id, email)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", id.toString()));

        // Validación crítica: No se puede cambiar de cuenta una transacción existente
        if (!transaction.getAccount().getId().equals(request.accountId())) {
            throw new BusinessException("No se permite cambiar la cuenta de una transacción existente. " +
                    "Elimine la transacción y créela de nuevo en la cuenta correcta.");
        }

        Category category = categoryRepository.findByIdAndUserEmail(request.categoryId(), email)
                .orElseThrow(() -> new ResourceNotFoundException("Category", request.categoryId().toString()));

        if (category.getType() != request.type()) {
            throw new BusinessException("El tipo de transacción (" + request.type() + 
                    ") no coincide con el tipo de la categoría seleccionada (" + category.getType() + ")");
        }

        Account account = transaction.getAccount();

        // 1. Revertir efecto viejo en el saldo de la cuenta
        if (transaction.getType() == CategoryType.INCOME) {
            account.debit(transaction.getAmount());
        } else {
            account.credit(transaction.getAmount());
        }

        // 2. Aplicar efecto nuevo en el saldo de la cuenta
        if (request.type() == CategoryType.INCOME) {
            account.credit(request.amount());
        } else {
            account.debit(request.amount());
        }

        // Guardar la cuenta actualizada
        accountRepository.save(account);

        // Actualizar datos de la transacción
        transaction.setCategory(category);
        transaction.setType(request.type());
        transaction.setAmount(request.amount());
        transaction.setDescription(request.description());
        transaction.setDate(request.date());

        transaction = transactionRepository.save(transaction);
        return mapToResponse(transaction);
    }

    @Transactional
    public void deleteTransaction(UUID id, String email) {
        Transaction transaction = transactionRepository.findByIdAndAccountUserEmail(id, email)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", id.toString()));

        Account account = transaction.getAccount();

        // Revertir efecto en el saldo de la cuenta antes de borrar
        if (transaction.getType() == CategoryType.INCOME) {
            account.debit(transaction.getAmount());
        } else {
            account.credit(transaction.getAmount());
        }

        accountRepository.save(account);
        transactionRepository.delete(transaction);
    }

    private TransactionResponse mapToResponse(Transaction transaction) {
        return new TransactionResponse(
                transaction.getId(),
                transaction.getAccount().getId(),
                transaction.getAccount().getName(),
                transaction.getCategory().getId(),
                transaction.getCategory().getName(),
                transaction.getType(),
                transaction.getAmount(),
                transaction.getDescription(),
                transaction.getDate(),
                transaction.getCreatedAt()
        );
    }
}
