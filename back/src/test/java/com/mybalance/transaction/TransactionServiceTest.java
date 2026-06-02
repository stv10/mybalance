package com.mybalance.transaction;

import com.mybalance.account.Account;
import com.mybalance.account.AccountRepository;
import com.mybalance.category.Category;
import com.mybalance.category.CategoryRepository;
import com.mybalance.category.CategoryType;
import com.mybalance.shared.exception.BusinessException;
import com.mybalance.transaction.dto.TransactionRequest;
import com.mybalance.transaction.dto.TransactionResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private AccountRepository accountRepository;

    @InjectMocks
    private TransactionService transactionService;

    private String userEmail;
    private Account account;
    private Category categoryExpense;
    private Category categoryIncome;
    private UUID accountId;
    private UUID categoryExpenseId;
    private UUID categoryIncomeId;

    @BeforeEach
    void setUp() {
        userEmail = "user@test.com";
        accountId = UUID.randomUUID();
        categoryExpenseId = UUID.randomUUID();
        categoryIncomeId = UUID.randomUUID();

        account = Account.builder()
                .id(accountId)
                .name("Mi Cuenta")
                .balance(new BigDecimal("100.00"))
                .build();

        categoryExpense = Category.builder()
                .id(categoryExpenseId)
                .name("Comida")
                .type(CategoryType.EXPENSE)
                .build();

        categoryIncome = Category.builder()
                .id(categoryIncomeId)
                .name("Sueldo")
                .type(CategoryType.INCOME)
                .build();
    }

    @Test
    @DisplayName("Debería restar saldo al crear una transacción de GASTO")
    void testCreateExpenseTransactionRecalculatesBalance() {
        TransactionRequest request = new TransactionRequest(
                accountId, categoryExpenseId, CategoryType.EXPENSE, new BigDecimal("30.00"), "Cena", LocalDate.now()
        );

        when(accountRepository.findByIdAndUserEmail(accountId, userEmail)).thenReturn(Optional.of(account));
        when(categoryRepository.findByIdAndUserEmail(categoryExpenseId, userEmail)).thenReturn(Optional.of(categoryExpense));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> {
            Transaction t = invocation.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });

        TransactionResponse response = transactionService.createTransaction(request, userEmail);

        assertNotNull(response);
        assertEquals(new BigDecimal("70.00"), account.getBalance()); // 100.00 - 30.00 = 70.00
        verify(accountRepository, times(1)).save(account);
        verify(transactionRepository, times(1)).save(any(Transaction.class));
    }

    @Test
    @DisplayName("Debería sumar saldo al crear una transacción de INGRESO")
    void testCreateIncomeTransactionRecalculatesBalance() {
        TransactionRequest request = new TransactionRequest(
                accountId, categoryIncomeId, CategoryType.INCOME, new BigDecimal("50.00"), "Aguinaldo", LocalDate.now()
        );

        when(accountRepository.findByIdAndUserEmail(accountId, userEmail)).thenReturn(Optional.of(account));
        when(categoryRepository.findByIdAndUserEmail(categoryIncomeId, userEmail)).thenReturn(Optional.of(categoryIncome));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> {
            Transaction t = invocation.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });

        TransactionResponse response = transactionService.createTransaction(request, userEmail);

        assertNotNull(response);
        assertEquals(new BigDecimal("150.00"), account.getBalance()); // 100.00 + 50.00 = 150.00
        verify(accountRepository, times(1)).save(account);
    }

    @Test
    @DisplayName("Debería revertir y volver a sumar saldo al actualizar el monto de una transacción de GASTO")
    void testUpdateTransactionAmountRecalculatesBalance() {
        UUID transactionId = UUID.randomUUID();
        Transaction existing = Transaction.builder()
                .id(transactionId)
                .account(account)
                .category(categoryExpense)
                .type(CategoryType.EXPENSE)
                .amount(new BigDecimal("30.00")) // Gasto viejo
                .date(LocalDate.now())
                .build();

        TransactionRequest request = new TransactionRequest(
                accountId, categoryExpenseId, CategoryType.EXPENSE, new BigDecimal("40.00"), "Cena Premium", LocalDate.now()
        );

        when(transactionRepository.findByIdAndAccountUserEmail(transactionId, userEmail)).thenReturn(Optional.of(existing));
        when(categoryRepository.findByIdAndUserEmail(categoryExpenseId, userEmail)).thenReturn(Optional.of(categoryExpense));
        when(transactionRepository.save(any(Transaction.class))).thenReturn(existing);

        // Seteamos el saldo inicial en 70.00 (asumiendo que ya se había descontado el gasto viejo)
        account.setBalance(new BigDecimal("70.00"));

        TransactionResponse response = transactionService.updateTransaction(transactionId, request, userEmail);

        assertNotNull(response);
        // Balance esperado: 70.00 + 30.00 (reversa) - 40.00 (nuevo) = 60.00
        assertEquals(new BigDecimal("60.00"), account.getBalance());
        verify(accountRepository, times(1)).save(account);
    }

    @Test
    @DisplayName("Debería lanzar BusinessException si se intenta cambiar la cuenta de una transacción existente")
    void testUpdateTransactionThrowsExceptionOnAccountChange() {
        UUID transactionId = UUID.randomUUID();
        UUID otherAccountId = UUID.randomUUID();

        Transaction existing = Transaction.builder()
                .id(transactionId)
                .account(account) // Vinculada a accountId original
                .category(categoryExpense)
                .type(CategoryType.EXPENSE)
                .amount(new BigDecimal("30.00"))
                .build();

        // Petición con un different accountId
        TransactionRequest request = new TransactionRequest(
                otherAccountId, categoryExpenseId, CategoryType.EXPENSE, new BigDecimal("30.00"), "Cena", LocalDate.now()
        );

        when(transactionRepository.findByIdAndAccountUserEmail(transactionId, userEmail)).thenReturn(Optional.of(existing));

        BusinessException exception = assertThrows(BusinessException.class, () ->
                transactionService.updateTransaction(transactionId, request, userEmail)
        );

        assertTrue(exception.getMessage().contains("No se permite cambiar la cuenta"));
        verify(accountRepository, never()).save(any(Account.class));
    }

    @Test
    @DisplayName("Debería devolver saldo a la cuenta al eliminar una transacción de GASTO")
    void testDeleteTransactionRevertsBalance() {
        UUID transactionId = UUID.randomUUID();
        Transaction transaction = Transaction.builder()
                .id(transactionId)
                .account(account)
                .category(categoryExpense)
                .type(CategoryType.EXPENSE)
                .amount(new BigDecimal("30.00"))
                .build();

        when(transactionRepository.findByIdAndAccountUserEmail(transactionId, userEmail)).thenReturn(Optional.of(transaction));

        // Saldo inicial tras haberse descontado la transacción
        account.setBalance(new BigDecimal("70.00"));

        transactionService.deleteTransaction(transactionId, userEmail);

        // Esperado: 70.00 + 30.00 = 100.00
        assertEquals(new BigDecimal("100.00"), account.getBalance());
        verify(accountRepository, times(1)).save(account);
        verify(transactionRepository, times(1)).delete(transaction);
    }
}
