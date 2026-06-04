package com.mybalance.infrastructure.bot;

import com.mybalance.account.Account;
import com.mybalance.account.AccountRepository;
import com.mybalance.auth.User;
import com.mybalance.category.Category;
import com.mybalance.category.CategoryRepository;
import com.mybalance.category.CategoryType;
import com.mybalance.infrastructure.bot.dto.AiTransactionResult;
import com.mybalance.shared.exception.BusinessException;
import com.mybalance.transaction.Transaction;
import com.mybalance.transaction.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BotTransactionHandlerTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @InjectMocks
    private BotTransactionHandler botTransactionHandler;

    private User user;
    private Account accountEfectivo;
    private Account accountPrincipal;
    private List<Account> accounts;
    private List<Category> categories;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(UUID.randomUUID())
                .name("Carlos")
                .email("carlos@test.com")
                .build();

        accountEfectivo = Account.builder()
                .id(UUID.randomUUID())
                .name("Efectivo")
                .balance(new BigDecimal("100.00"))
                .user(user)
                .build();

        accountPrincipal = Account.builder()
                .id(UUID.randomUUID())
                .name("Principal")
                .balance(new BigDecimal("500.00"))
                .user(user)
                .build();

        accounts = List.of(accountEfectivo, accountPrincipal);

        categories = new ArrayList<>();
        categories.add(Category.builder()
                .id(UUID.randomUUID())
                .name("Comida")
                .type(CategoryType.EXPENSE)
                .user(user)
                .build());
        categories.add(Category.builder()
                .id(UUID.randomUUID())
                .name("Sueldo")
                .type(CategoryType.INCOME)
                .user(user)
                .build());
    }

    @Test
    @DisplayName("Debería registrar gasto con cuenta específica de la IA y categoría existente")
    void testHandleTransactionWithSpecificAccountAndExistingCategory() {
        AiTransactionResult aiResult = new AiTransactionResult(
                new BigDecimal("50.00"),
                "EXPENSE",
                "Comida",
                "Principal"
        );

        when(accountRepository.findByUserEmailOrderByNameAsc(user.getEmail())).thenReturn(accounts);
        when(categoryRepository.findByUserEmailOrderByNameAsc(user.getEmail())).thenReturn(categories);
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Transaction result = botTransactionHandler.handleTransaction(aiResult, user, "Gaste 50 en comida de la cuenta Principal");

        assertNotNull(result);
        assertEquals(accountPrincipal, result.getAccount());
        assertEquals("Comida", result.getCategory().getName());
        assertEquals(CategoryType.EXPENSE, result.getType());
        assertEquals(new BigDecimal("50.00"), result.getAmount());
        assertEquals("Gaste 50 en comida de la cuenta ", result.getDescription());
        assertEquals("Gaste 50 en comida de la cuenta Principal", result.getNotes());

        // Verificar descuento de saldo: 500.00 - 50.00 = 450.00
        assertEquals(new BigDecimal("450.00"), accountPrincipal.getBalance());
        verify(accountRepository, times(1)).save(accountPrincipal);
        verify(categoryRepository, never()).save(any(Category.class)); // Ya existía
        verify(transactionRepository, times(1)).save(any(Transaction.class));
    }

    @Test
    @DisplayName("Debería aplicar fallback a la primera cuenta si la sugerida por la IA no existe")
    void testHandleTransactionWithAccountFallback() {
        AiTransactionResult aiResult = new AiTransactionResult(
                new BigDecimal("30.00"),
                "EXPENSE",
                "Comida",
                "CuentaInexistente"
        );

        when(accountRepository.findByUserEmailOrderByNameAsc(user.getEmail())).thenReturn(accounts);
        when(categoryRepository.findByUserEmailOrderByNameAsc(user.getEmail())).thenReturn(categories);
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Transaction result = botTransactionHandler.handleTransaction(aiResult, user, "Gaste 30 en comida con banco X");

        assertNotNull(result);
        // Fallback a accounts.get(0) -> accountEfectivo
        assertEquals(accountEfectivo, result.getAccount());
        assertEquals(new BigDecimal("70.00"), accountEfectivo.getBalance()); // 100.00 - 30.00
        assertEquals("Gaste 30 en comida con banco X", result.getDescription());
        assertEquals("Gaste 30 en comida con banco X", result.getNotes());
        verify(accountRepository, times(1)).save(accountEfectivo);
    }

    @Test
    @DisplayName("Debería crear automáticamente una categoría si esta no existe")
    void testHandleTransactionAutoCreatesCategory() {
        AiTransactionResult aiResult = new AiTransactionResult(
                new BigDecimal("1200.00"),
                "EXPENSE",
                "Sushi", // No existe en categories
                "Efectivo"
        );

        Category newCategory = Category.builder()
                .name("Sushi")
                .type(CategoryType.EXPENSE)
                .user(user)
                .build();

        when(accountRepository.findByUserEmailOrderByNameAsc(user.getEmail())).thenReturn(accounts);
        when(categoryRepository.findByUserEmailOrderByNameAsc(user.getEmail())).thenReturn(categories);
        when(categoryRepository.save(any(Category.class))).thenReturn(newCategory);
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Transaction result = botTransactionHandler.handleTransaction(aiResult, user, "Gaste 1200 en Sushi");

        assertNotNull(result);
        assertEquals("Sushi", result.getCategory().getName());
        assertEquals("Gaste 1200 en Sushi", result.getDescription());
        assertEquals("Gaste 1200 en Sushi", result.getNotes());
        verify(categoryRepository, times(1)).save(any(Category.class));
    }

    @Test
    @DisplayName("Debería registrar un ingreso incrementando el balance de la cuenta")
    void testHandleTransactionIncomeIncreasesBalance() {
        AiTransactionResult aiResult = new AiTransactionResult(
                new BigDecimal("15000.00"),
                "INCOME",
                "Sueldo",
                "Principal"
        );

        when(accountRepository.findByUserEmailOrderByNameAsc(user.getEmail())).thenReturn(accounts);
        when(categoryRepository.findByUserEmailOrderByNameAsc(user.getEmail())).thenReturn(categories);
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Transaction result = botTransactionHandler.handleTransaction(aiResult, user, "Cobre mi sueldo de 15000");

        assertNotNull(result);
        assertEquals(accountPrincipal, result.getAccount());
        assertEquals(CategoryType.INCOME, result.getType());
        // Incrementar saldo: 500.00 + 15000.00 = 15500.00
        assertEquals(new BigDecimal("15500.00"), accountPrincipal.getBalance());
        assertEquals("Cobre mi sueldo de 15000", result.getDescription());
        assertEquals("Cobre mi sueldo de 15000", result.getNotes());
        verify(accountRepository, times(1)).save(accountPrincipal);
    }

    @Test
    @DisplayName("Debería lanzar BusinessException si el monto es nulo o menor o igual a cero")
    void testHandleTransactionThrowsExceptionForInvalidAmount() {
        AiTransactionResult aiResult = new AiTransactionResult(
                BigDecimal.ZERO,
                "EXPENSE",
                "Comida",
                "Principal"
        );

        BusinessException exception = assertThrows(BusinessException.class, () ->
                botTransactionHandler.handleTransaction(aiResult, user, "Gaste nada")
        );

        assertTrue(exception.getMessage().contains("monto de la transacción debe ser mayor que cero"));
        verify(transactionRepository, never()).save(any(Transaction.class));
    }

    @Test
    @DisplayName("Debería lanzar BusinessException si el tipo de transacción no es válido")
    void testHandleTransactionThrowsExceptionForInvalidType() {
        AiTransactionResult aiResult = new AiTransactionResult(
                new BigDecimal("10.00"),
                "INVALID_TYPE",
                "Comida",
                "Principal"
        );

        BusinessException exception = assertThrows(BusinessException.class, () ->
                botTransactionHandler.handleTransaction(aiResult, user, "Gaste 10")
        );

        assertTrue(exception.getMessage().contains("Tipo de transacción inválido"));
        verify(transactionRepository, never()).save(any(Transaction.class));
    }
}
