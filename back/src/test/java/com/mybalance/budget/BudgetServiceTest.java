package com.mybalance.budget;

import com.mybalance.auth.User;
import com.mybalance.auth.UserRepository;
import com.mybalance.budget.dto.*;
import com.mybalance.category.Category;
import com.mybalance.category.CategoryRepository;
import com.mybalance.category.CategoryType;
import com.mybalance.transaction.TransactionRepository;
import com.mybalance.transaction.TransactionService;
import com.mybalance.transaction.Transaction;
import com.mybalance.account.Account;
import com.mybalance.transaction.dto.TransactionResponse;
import com.mybalance.transaction.dto.TransactionRequest;
import com.mybalance.shared.exception.BusinessException;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BudgetServiceTest {

    @Mock
    private BudgetModelRepository budgetModelRepository;
    @Mock
    private BudgetModelItemRepository budgetModelItemRepository;
    @Mock
    private MonthlyBudgetRepository monthlyBudgetRepository;
    @Mock
    private MonthlyBudgetItemRepository monthlyBudgetItemRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private TransactionService transactionService;

    private String userEmail;
    private User user;
    private Category categoryVida;
    private UUID categoryVidaId;

    @BeforeEach
    void setUp() {
        userEmail = "user@test.com";
        user = User.builder()
                .id(UUID.randomUUID())
                .name("Test User")
                .email(userEmail)
                .build();

        categoryVidaId = UUID.randomUUID();
        categoryVida = Category.builder()
                .id(categoryVidaId)
                .name("Vida")
                .type(CategoryType.EXPENSE)
                .isUserCreated(false) // Semilla raíz
                .build();
    }

    @Test
    @DisplayName("Debería obtener un presupuesto modelo vacío si no existe en la BD")
    void testGetBudgetModelEmptyWhenNotExists() {
        BudgetModelService localService = new BudgetModelService(budgetModelRepository, budgetModelItemRepository, userRepository, categoryRepository);
        when(budgetModelRepository.findByUserEmail(userEmail)).thenReturn(Optional.empty());

        BudgetModelResponse response = localService.getBudgetModel(userEmail);

        assertNotNull(response);
        assertNull(response.id());
        assertEquals(BigDecimal.ZERO, response.totalLimit());
        assertTrue(response.items().isEmpty());
    }

    @Test
    @DisplayName("Debería inicializar perezosamente el presupuesto mensual si existe plantilla modelo")
    void testGetOrCreateMonthlyBudgetLazyInitialization() {
        MonthlyBudgetService localMonthlyService = new MonthlyBudgetService(
                monthlyBudgetRepository,
                monthlyBudgetItemRepository,
                budgetModelRepository,
                budgetModelItemRepository,
                userRepository,
                categoryRepository,
                transactionRepository,
                transactionService
        );

        Integer month = 6;
        Integer year = 2026;

        BudgetModel budgetModel = BudgetModel.builder()
                .id(UUID.randomUUID())
                .user(user)
                .totalLimit(new BigDecimal("500.00"))
                .percentVida(new BigDecimal("50.00"))
                .percentOcio(new BigDecimal("30.00"))
                .percentInversionDeuda(new BigDecimal("20.00"))
                .build();

        BudgetModelItem budgetModelItem = BudgetModelItem.builder()
                .id(UUID.randomUUID())
                .budgetModel(budgetModel)
                .category(categoryVida)
                .name("Luz")
                .amountLimit(new BigDecimal("100.00"))
                .dueDay(15)
                .build();

        when(monthlyBudgetRepository.findByUserEmailAndMonthAndYear(userEmail, month, year))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(user));
        when(budgetModelRepository.findByUserEmail(userEmail)).thenReturn(Optional.of(budgetModel));
        when(budgetModelItemRepository.findByBudgetModelId(budgetModel.getId()))
                .thenReturn(List.of(budgetModelItem));
        when(monthlyBudgetRepository.save(any(MonthlyBudget.class))).thenAnswer(inv -> inv.getArgument(0));

        MonthlyBudget result = localMonthlyService.getOrCreateMonthlyBudget(userEmail, month, year);

        assertNotNull(result);
        assertEquals(month, result.getMonth());
        assertEquals(year, result.getYear());
        assertEquals(new BigDecimal("500.00"), result.getTotalLimit());
        assertEquals(new BigDecimal("50.00"), result.getPercentVida());
        assertEquals(new BigDecimal("30.00"), result.getPercentOcio());
        assertEquals(new BigDecimal("20.00"), result.getPercentInversionDeuda());
        
        verify(monthlyBudgetRepository, times(1)).save(any(MonthlyBudget.class));
        
        org.mockito.ArgumentCaptor<MonthlyBudgetItem> itemCaptor = org.mockito.ArgumentCaptor.forClass(MonthlyBudgetItem.class);
        verify(monthlyBudgetItemRepository, times(1)).save(itemCaptor.capture());
        MonthlyBudgetItem savedItem = itemCaptor.getValue();
        assertNotNull(savedItem);
        assertEquals(15, savedItem.getDueDay());
        assertEquals(java.time.LocalDate.of(2026, 6, 15), savedItem.getDueDate());
    }

    @Test
    @DisplayName("Debería regenerar el presupuesto mensual eliminando ítems anteriores y revirtiendo transacciones de los ítems pagados")
    void testRegenerateMonthlyBudget() {
        MonthlyBudgetService localMonthlyService = new MonthlyBudgetService(
                monthlyBudgetRepository,
                monthlyBudgetItemRepository,
                budgetModelRepository,
                budgetModelItemRepository,
                userRepository,
                categoryRepository,
                transactionRepository,
                transactionService
        );

        Integer month = 6;
        Integer year = 2026;

        MonthlyBudget existingBudget = MonthlyBudget.builder()
                .id(UUID.randomUUID())
                .user(user)
                .month(month)
                .year(year)
                .totalLimit(new BigDecimal("300.00"))
                .percentVida(new BigDecimal("100.00"))
                .percentOcio(BigDecimal.ZERO)
                .percentInversionDeuda(BigDecimal.ZERO)
                .build();

        BudgetModel budgetModel = BudgetModel.builder()
                .id(UUID.randomUUID())
                .user(user)
                .totalLimit(new BigDecimal("500.00"))
                .percentVida(new BigDecimal("50.00"))
                .percentOcio(new BigDecimal("30.00"))
                .percentInversionDeuda(new BigDecimal("20.00"))
                .build();

        BudgetModelItem budgetModelItem = BudgetModelItem.builder()
                .id(UUID.randomUUID())
                .budgetModel(budgetModel)
                .category(categoryVida)
                .name("Luz Nueva")
                .amountLimit(new BigDecimal("100.00"))
                .dueDay(15)
                .build();

        Account account = Account.builder()
                .id(UUID.randomUUID())
                .name("Principal")
                .balance(new BigDecimal("1000.00"))
                .build();

        Transaction transaction = Transaction.builder()
                .id(UUID.randomUUID())
                .amount(new BigDecimal("50.00"))
                .account(account)
                .build();

        MonthlyBudgetItem existingPaidItem = MonthlyBudgetItem.builder()
                .id(UUID.randomUUID())
                .monthlyBudget(existingBudget)
                .name("Luz Vieja Pagada")
                .category(categoryVida)
                .amountLimit(new BigDecimal("50.00"))
                .paid(true)
                .transaction(transaction)
                .build();

        MonthlyBudgetItem existingUnpaidItem = MonthlyBudgetItem.builder()
                .id(UUID.randomUUID())
                .monthlyBudget(existingBudget)
                .name("Ocio Viejo")
                .category(categoryVida)
                .amountLimit(new BigDecimal("20.00"))
                .paid(false)
                .build();

        when(monthlyBudgetRepository.findByUserEmailAndMonthAndYear(userEmail, month, year))
                .thenReturn(Optional.of(existingBudget));
        when(budgetModelRepository.findByUserEmail(userEmail))
                .thenReturn(Optional.of(budgetModel));
        when(monthlyBudgetItemRepository.findByMonthlyBudgetId(existingBudget.getId()))
                .thenReturn(List.of(existingPaidItem, existingUnpaidItem));
        when(budgetModelItemRepository.findByBudgetModelId(budgetModel.getId()))
                .thenReturn(List.of(budgetModelItem));
        when(monthlyBudgetRepository.save(any(MonthlyBudget.class))).thenAnswer(inv -> inv.getArgument(0));

        // Ejecutar
        BudgetComparisonResponse response = localMonthlyService.regenerateMonthlyBudget(userEmail, month, year);

        // Verificar límites actualizados
        assertEquals(new BigDecimal("500.00"), existingBudget.getTotalLimit());
        assertEquals(new BigDecimal("50.00"), existingBudget.getPercentVida());

        // Verificar reversión de pago (eliminación de transacción)
        verify(transactionService, times(1)).deleteTransaction(transaction.getId(), userEmail);

        // Verificar eliminación de ítems anteriores
        verify(monthlyBudgetItemRepository, times(1)).deleteAll(anyList());

        // Verificar creación de nuevo ítem
        verify(monthlyBudgetItemRepository, times(1)).save(any(MonthlyBudgetItem.class));
    }

    @Test
    @DisplayName("Debería registrar el pago de un ítem de presupuesto y crear su transacción correspondiente")
    void testPayBudgetItem() {
        MonthlyBudgetService localMonthlyService = new MonthlyBudgetService(
                monthlyBudgetRepository,
                monthlyBudgetItemRepository,
                budgetModelRepository,
                budgetModelItemRepository,
                userRepository,
                categoryRepository,
                transactionRepository,
                transactionService
        );

        UUID itemId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        BigDecimal amount = new BigDecimal("150.00");
        LocalDate date = LocalDate.now();

        MonthlyBudget monthlyBudget = MonthlyBudget.builder()
                .id(UUID.randomUUID())
                .user(user)
                .month(6)
                .year(2026)
                .totalLimit(new BigDecimal("1000.00"))
                .percentVida(new BigDecimal("100.00"))
                .build();

        MonthlyBudgetItem item = MonthlyBudgetItem.builder()
                .id(itemId)
                .name("Supermercado")
                .category(categoryVida)
                .amountLimit(new BigDecimal("300.00"))
                .monthlyBudget(monthlyBudget)
                .paid(false)
                .build();

        MonthlyBudgetPayRequest request = new MonthlyBudgetPayRequest(accountId, amount, date);

        TransactionResponse txResponse = new TransactionResponse(
                UUID.randomUUID(),
                accountId,
                "Principal",
                categoryVidaId,
                "Vida",
                CategoryType.EXPENSE,
                amount,
                "Pago de presupuesto: Supermercado",
                date,
                java.time.LocalDateTime.now()
        );

        Account account = Account.builder()
                .id(accountId)
                .name("Principal")
                .balance(new BigDecimal("1000.00"))
                .build();

        Transaction transaction = Transaction.builder()
                .id(txResponse.id())
                .amount(amount)
                .account(account)
                .build();

        when(monthlyBudgetItemRepository.findByIdAndMonthlyBudgetUserEmail(itemId, userEmail))
                .thenReturn(Optional.of(item));
        when(transactionService.createTransaction(any(TransactionRequest.class), eq(userEmail)))
                .thenReturn(txResponse);
        when(transactionRepository.findById(txResponse.id()))
                .thenReturn(Optional.of(transaction));
        when(monthlyBudgetRepository.findByUserEmailAndMonthAndYear(userEmail, 6, 2026))
                .thenReturn(Optional.of(monthlyBudget));
        when(monthlyBudgetItemRepository.findByMonthlyBudgetId(monthlyBudget.getId()))
                .thenReturn(List.of(item));

        // Ejecutar
        BudgetComparisonResponse response = localMonthlyService.payBudgetItem(itemId, request, userEmail);

        // Verificar resultados
        assertNotNull(response);
        assertTrue(item.isPaid());
        assertEquals(transaction, item.getTransaction());
        verify(transactionService, times(1)).createTransaction(any(TransactionRequest.class), eq(userEmail));
        verify(monthlyBudgetItemRepository, times(1)).save(item);
    }

    @Test
    @DisplayName("Debería guardar exitosamente el modelo de presupuesto vinculando un ítem a la categoría Comida")
    void testSaveBudgetModelWithComidaCategory() {
        BudgetModelService localService = new BudgetModelService(
                budgetModelRepository,
                budgetModelItemRepository,
                userRepository,
                categoryRepository
        );

        UUID categoryComidaId = UUID.randomUUID();
        Category categoryComida = Category.builder()
                .id(categoryComidaId)
                .name("Comida")
                .type(CategoryType.EXPENSE)
                .parent(categoryVida)
                .isUserCreated(false) // Semilla
                .build();

        BudgetModelRequest request = new BudgetModelRequest(
                new BigDecimal("1000.00"),
                new BigDecimal("50.00"),
                new BigDecimal("30.00"),
                new BigDecimal("20.00"),
                List.of(new BudgetItemRequest("Supermercado", categoryComidaId, new BigDecimal("400.00"), 10))
        );

        BudgetModel budgetModel = BudgetModel.builder()
                .id(UUID.randomUUID())
                .user(user)
                .totalLimit(new BigDecimal("1000.00"))
                .percentVida(new BigDecimal("50.00"))
                .percentOcio(new BigDecimal("30.00"))
                .percentInversionDeuda(new BigDecimal("20.00"))
                .build();

        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(user));
        when(budgetModelRepository.findByUserEmail(userEmail)).thenReturn(Optional.of(budgetModel));
        when(budgetModelRepository.save(any(BudgetModel.class))).thenAnswer(inv -> inv.getArgument(0));
        when(categoryRepository.findByIdAndUserEmail(categoryComidaId, userEmail)).thenReturn(Optional.of(categoryComida));
        when(budgetModelItemRepository.save(any(BudgetModelItem.class))).thenAnswer(inv -> inv.getArgument(0));

        BudgetModelResponse response = localService.saveBudgetModel(request, userEmail);

        assertNotNull(response);
        assertEquals(new BigDecimal("1000.00"), response.totalLimit());
        assertEquals(1, response.items().size());
        assertEquals("Supermercado", response.items().get(0).name());
        assertEquals("Comida", response.items().get(0).categoryName());
    }

    @Test
    @DisplayName("Debería lanzar excepción al intentar guardar un ítem de presupuesto con categoría inválida")
    void testSaveBudgetModelWithInvalidCategoryThrowsException() {
        BudgetModelService localService = new BudgetModelService(
                budgetModelRepository,
                budgetModelItemRepository,
                userRepository,
                categoryRepository
        );

        UUID categoryInvalidaId = UUID.randomUUID();
        Category categoryInvalida = Category.builder()
                .id(categoryInvalidaId)
                .name("Alcohol")
                .type(CategoryType.EXPENSE)
                .isUserCreated(true) // Creada por el usuario
                .build();

        BudgetModelRequest request = new BudgetModelRequest(
                new BigDecimal("1000.00"),
                new BigDecimal("50.00"),
                new BigDecimal("30.00"),
                new BigDecimal("20.00"),
                List.of(new BudgetItemRequest("Bebidas", categoryInvalidaId, new BigDecimal("100.00"), 10))
        );

        BudgetModel budgetModel = BudgetModel.builder()
                .id(UUID.randomUUID())
                .user(user)
                .totalLimit(new BigDecimal("1000.00"))
                .percentVida(new BigDecimal("50.00"))
                .percentOcio(new BigDecimal("30.00"))
                .percentInversionDeuda(new BigDecimal("20.00"))
                .build();

        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(user));
        when(budgetModelRepository.findByUserEmail(userEmail)).thenReturn(Optional.of(budgetModel));
        when(budgetModelRepository.save(any(BudgetModel.class))).thenAnswer(inv -> inv.getArgument(0));
        when(categoryRepository.findByIdAndUserEmail(categoryInvalidaId, userEmail)).thenReturn(Optional.of(categoryInvalida));

        BusinessException exception = assertThrows(BusinessException.class, () -> {
            localService.saveBudgetModel(request, userEmail);
        });

        assertTrue(exception.getMessage().contains("únicamente se puede asociar a una de las categorías base"));
    }

    @Test
    @DisplayName("Debería calcular dinámicamente el gasto de comida y subcategorías al comparar presupuestos")
    void testCompareBudgetWithExpensesDynamicComida() {
        MonthlyBudgetService localMonthlyService = new MonthlyBudgetService(
                monthlyBudgetRepository,
                monthlyBudgetItemRepository,
                budgetModelRepository,
                budgetModelItemRepository,
                userRepository,
                categoryRepository,
                transactionRepository,
                transactionService
        );

        Integer month = 6;
        Integer year = 2026;

        MonthlyBudget monthlyBudget = MonthlyBudget.builder()
                .id(UUID.randomUUID())
                .user(user)
                .month(month)
                .year(year)
                .totalLimit(new BigDecimal("1000.00"))
                .percentVida(new BigDecimal("100.00"))
                .build();

        Category categoryComida = Category.builder()
                .id(UUID.randomUUID())
                .name("Comida")
                .type(CategoryType.EXPENSE)
                .isUserCreated(false)
                .build();

        Category categoryPedidos = Category.builder()
                .id(UUID.randomUUID())
                .name("Pedidos")
                .type(CategoryType.EXPENSE)
                .parent(categoryComida)
                .isUserCreated(true)
                .build();

        MonthlyBudgetItem itemComida = MonthlyBudgetItem.builder()
                .id(UUID.randomUUID())
                .name("Alimentacion")
                .category(categoryComida)
                .amountLimit(new BigDecimal("500.00"))
                .monthlyBudget(monthlyBudget)
                .paid(false)
                .build();

        Account account = Account.builder()
                .id(UUID.randomUUID())
                .name("Principal")
                .build();

        Transaction txComida = Transaction.builder()
                .id(UUID.randomUUID())
                .amount(new BigDecimal("50.00"))
                .category(categoryComida)
                .type(CategoryType.EXPENSE)
                .account(account)
                .date(LocalDate.of(2026, 6, 10))
                .build();

        Transaction txPedidos = Transaction.builder()
                .id(UUID.randomUUID())
                .amount(new BigDecimal("30.00"))
                .category(categoryPedidos)
                .type(CategoryType.EXPENSE)
                .account(account)
                .date(LocalDate.of(2026, 6, 12))
                .build();

        when(monthlyBudgetRepository.findByUserEmailAndMonthAndYear(userEmail, month, year))
                .thenReturn(Optional.of(monthlyBudget));
        when(monthlyBudgetItemRepository.findByMonthlyBudgetId(monthlyBudget.getId()))
                .thenReturn(List.of(itemComida));
        when(transactionRepository.findByAccountUserEmailAndDateBetween(eq(userEmail), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of(txComida, txPedidos));

        BudgetComparisonResponse response = localMonthlyService.compareBudgetWithExpenses(userEmail, month, year);

        assertNotNull(response);
        assertEquals(new BigDecimal("80.00"), response.totalSpent());
        assertEquals(1, response.items().size());
        assertEquals(new BigDecimal("80.00"), response.items().get(0).paidAmount());
    }

    @Test
    @DisplayName("Debería lanzar excepción al intentar registrar pago manual de categoría Comida")
    void testPayBudgetItemComidaThrowsException() {
        MonthlyBudgetService localMonthlyService = new MonthlyBudgetService(
                monthlyBudgetRepository,
                monthlyBudgetItemRepository,
                budgetModelRepository,
                budgetModelItemRepository,
                userRepository,
                categoryRepository,
                transactionRepository,
                transactionService
        );

        UUID itemId = UUID.randomUUID();
        Category categoryComida = Category.builder()
                .id(UUID.randomUUID())
                .name("Comida")
                .type(CategoryType.EXPENSE)
                .isUserCreated(false)
                .build();

        MonthlyBudgetItem itemComida = MonthlyBudgetItem.builder()
                .id(itemId)
                .name("Alimentacion")
                .category(categoryComida)
                .paid(false)
                .build();

        MonthlyBudgetPayRequest request = new MonthlyBudgetPayRequest(UUID.randomUUID(), new BigDecimal("100.00"), LocalDate.now());

        when(monthlyBudgetItemRepository.findByIdAndMonthlyBudgetUserEmail(itemId, userEmail))
                .thenReturn(Optional.of(itemComida));

        BusinessException exception = assertThrows(BusinessException.class, () -> {
            localMonthlyService.payBudgetItem(itemId, request, userEmail);
        });

        assertTrue(exception.getMessage().contains("La categoría 'Comida' no se puede marcar como pagada manualmente"));
    }

    @Test
    @DisplayName("Debería lanzar excepción al intentar desmarcar pago de categoría Comida")
    void testUnpayBudgetItemComidaThrowsException() {
        MonthlyBudgetService localMonthlyService = new MonthlyBudgetService(
                monthlyBudgetRepository,
                monthlyBudgetItemRepository,
                budgetModelRepository,
                budgetModelItemRepository,
                userRepository,
                categoryRepository,
                transactionRepository,
                transactionService
        );

        UUID itemId = UUID.randomUUID();
        Category categoryComida = Category.builder()
                .id(UUID.randomUUID())
                .name("Comida")
                .type(CategoryType.EXPENSE)
                .isUserCreated(false)
                .build();

        MonthlyBudgetItem itemComida = MonthlyBudgetItem.builder()
                .id(itemId)
                .name("Alimentacion")
                .category(categoryComida)
                .paid(true)
                .build();

        when(monthlyBudgetItemRepository.findByIdAndMonthlyBudgetUserEmail(itemId, userEmail))
                .thenReturn(Optional.of(itemComida));

        BusinessException exception = assertThrows(BusinessException.class, () -> {
            localMonthlyService.unpayBudgetItem(itemId, userEmail);
        });

        assertTrue(exception.getMessage().contains("La categoría 'Comida' se calcula automáticamente y no se puede desmarcar"));
    }
}

