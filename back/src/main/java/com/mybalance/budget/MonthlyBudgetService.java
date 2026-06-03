package com.mybalance.budget;

import com.mybalance.auth.User;
import com.mybalance.auth.UserRepository;
import com.mybalance.budget.dto.*;
import com.mybalance.category.Category;
import com.mybalance.category.CategoryRepository;
import com.mybalance.category.CategoryType;
import com.mybalance.shared.exception.BusinessException;
import com.mybalance.shared.exception.ResourceNotFoundException;
import com.mybalance.transaction.Transaction;
import com.mybalance.transaction.TransactionRepository;
import com.mybalance.transaction.TransactionService;
import com.mybalance.transaction.dto.TransactionRequest;
import com.mybalance.transaction.dto.TransactionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MonthlyBudgetService {

    private final MonthlyBudgetRepository monthlyBudgetRepository;
    private final MonthlyBudgetItemRepository monthlyBudgetItemRepository;
    private final BudgetModelRepository budgetModelRepository;
    private final BudgetModelItemRepository budgetModelItemRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionService transactionService;

    @Transactional
    public MonthlyBudget getOrCreateMonthlyBudget(String email, Integer month, Integer year) {
        Optional<MonthlyBudget> existing = monthlyBudgetRepository.findByUserEmailAndMonthAndYear(email, month, year);
        if (existing.isPresent()) {
            return existing.get();
        }

        // Lazy initialization: si no existe, buscar plantilla
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", email));

        Optional<BudgetModel> budgetModelOpt = budgetModelRepository.findByUserEmail(email);

        if (budgetModelOpt.isPresent()) {
            BudgetModel model = budgetModelOpt.get();
            MonthlyBudget monthlyBudget = MonthlyBudget.builder()
                    .user(user)
                    .month(month)
                    .year(year)
                    .totalLimit(model.getTotalLimit())
                    .percentVida(model.getPercentVida())
                    .percentOcio(model.getPercentOcio())
                    .percentInversionDeuda(model.getPercentInversionDeuda())
                    .build();

            monthlyBudget = monthlyBudgetRepository.save(monthlyBudget);

            // Copiar ítems de la plantilla
            List<BudgetModelItem> modelItems = budgetModelItemRepository.findByBudgetModelId(model.getId());
            for (BudgetModelItem modelItem : modelItems) {
                Integer dueDay = modelItem.getDueDay();
                LocalDate dueDate = null;
                if (dueDay != null) {
                    int lastDayOfMonth = java.time.YearMonth.of(year, month).lengthOfMonth();
                    int resolvedDay = Math.min(dueDay, lastDayOfMonth);
                    dueDate = LocalDate.of(year, month, resolvedDay);
                }

                MonthlyBudgetItem monthlyItem = MonthlyBudgetItem.builder()
                        .monthlyBudget(monthlyBudget)
                        .name(modelItem.getName())
                        .category(modelItem.getCategory())
                        .amountLimit(modelItem.getAmountLimit())
                        .dueDay(dueDay)
                        .dueDate(dueDate)
                        .paid(false)
                        .build();
                monthlyBudgetItemRepository.save(monthlyItem);
            }

            return monthlyBudget;
        } else {
            // Si no tiene plantilla, instanciar un presupuesto en cero por defecto para evitar errores
            MonthlyBudget monthlyBudget = MonthlyBudget.builder()
                    .user(user)
                    .month(month)
                    .year(year)
                    .totalLimit(BigDecimal.ZERO)
                    .percentVida(BigDecimal.ZERO)
                    .percentOcio(BigDecimal.ZERO)
                    .percentInversionDeuda(BigDecimal.ZERO)
                    .build();

            return monthlyBudgetRepository.save(monthlyBudget);
        }
    }

    @Transactional
    public BudgetComparisonResponse regenerateMonthlyBudget(String email, Integer month, Integer year) {
        MonthlyBudget monthlyBudget = monthlyBudgetRepository.findByUserEmailAndMonthAndYear(email, month, year)
                .orElseThrow(() -> new ResourceNotFoundException("MonthlyBudget", month + "/" + year));

        BudgetModel model = budgetModelRepository.findByUserEmail(email)
                .orElseThrow(() -> new BusinessException("No tienes una plantilla de presupuesto configurada para regenerar."));

        // 1. Actualizar límites del presupuesto mensual con los de la plantilla
        monthlyBudget.setTotalLimit(model.getTotalLimit());
        monthlyBudget.setPercentVida(model.getPercentVida());
        monthlyBudget.setPercentOcio(model.getPercentOcio());
        monthlyBudget.setPercentInversionDeuda(model.getPercentInversionDeuda());
        monthlyBudgetRepository.save(monthlyBudget);

        // 2. Obtener ítems mensuales existentes
        List<MonthlyBudgetItem> existingItems = monthlyBudgetItemRepository.findByMonthlyBudgetId(monthlyBudget.getId());
        
        // 3. Desmarcar y eliminar transacciones de los ítems pagados
        for (MonthlyBudgetItem item : existingItems) {
            if (item.isPaid() && item.getTransaction() != null) {
                UUID transactionId = item.getTransaction().getId();
                // Limpiar relación
                item.setPaid(false);
                item.setTransaction(null);
                monthlyBudgetItemRepository.saveAndFlush(item);
                // Eliminar transacción
                transactionService.deleteTransaction(transactionId, email);
            }
        }

        // 4. Eliminar ítems mensuales
        monthlyBudgetItemRepository.deleteAll(existingItems);
        monthlyBudgetItemRepository.flush();

        // 5. Copiar ítems de la plantilla
        List<BudgetModelItem> modelItems = budgetModelItemRepository.findByBudgetModelId(model.getId());
        for (BudgetModelItem modelItem : modelItems) {
            Integer dueDay = modelItem.getDueDay();
            LocalDate dueDate = null;
            if (dueDay != null) {
                int lastDayOfMonth = java.time.YearMonth.of(year, month).lengthOfMonth();
                int resolvedDay = Math.min(dueDay, lastDayOfMonth);
                dueDate = LocalDate.of(year, month, resolvedDay);
            }

            MonthlyBudgetItem monthlyItem = MonthlyBudgetItem.builder()
                    .monthlyBudget(monthlyBudget)
                    .name(modelItem.getName())
                    .category(modelItem.getCategory())
                    .amountLimit(modelItem.getAmountLimit())
                    .dueDay(dueDay)
                    .dueDate(dueDate)
                    .paid(false)
                    .build();
            monthlyBudgetItemRepository.save(monthlyItem);
        }

        return compareBudgetWithExpenses(email, month, year);
    }


    @Transactional
    public BudgetModelResponse updateMonthlyBudget(UUID id, BudgetModelRequest request, String email) {
        MonthlyBudget monthlyBudget = monthlyBudgetRepository.findByIdAndUserEmail(id, email)
                .orElseThrow(() -> new ResourceNotFoundException("MonthlyBudget", id.toString()));

        // Validar que la suma de los porcentajes sea exactamente 100%
        BigDecimal sumPercent = request.percentVida().add(request.percentOcio()).add(request.percentInversionDeuda());
        if (sumPercent.compareTo(BigDecimal.valueOf(100)) != 0) {
            throw new BusinessException("La suma de los porcentajes asignados a las categorías base debe ser exactamente 100%. Actualmente es: " + sumPercent + "%");
        }

        monthlyBudget.setTotalLimit(request.totalLimit());
        monthlyBudget.setPercentVida(request.percentVida());
        monthlyBudget.setPercentOcio(request.percentOcio());
        monthlyBudget.setPercentInversionDeuda(request.percentInversionDeuda());
        monthlyBudget = monthlyBudgetRepository.save(monthlyBudget);

        // Limpiar los ítems antiguos para este mes específico
        // Nota: para ítems ya pagados, podríamos dejarlos o lanzar un error si se eliminan.
        // Pero por simplicidad y robustez, podemos borrar los ítems no pagados o borrarlos todos y revertir sus transacciones si es necesario.
        // Por seguridad, si el usuario tiene ítems ya marcados como pagados, evitamos eliminarlos de golpe o permitimos guardado completo.
        // Haremos una limpieza simple eliminando ítems que no tengan transacciones asociadas, y re-creando los nuevos.
        List<MonthlyBudgetItem> existingItems = monthlyBudgetItemRepository.findByMonthlyBudgetId(monthlyBudget.getId());
        for (MonthlyBudgetItem item : existingItems) {
            if (item.isPaid() && item.getTransaction() != null) {
                // Si ya está pagado, no queremos perder la relación ni duplicar. Podemos conservarlo o lanzar error.
                // En un flujo limpio, el usuario modifica el molde. Si modifica el del mes directamente, mejor limpiar y recrear,
                // pero si ya hay pagos, impedimos modificar para proteger la integridad, o dejamos los pagados intactos.
                throw new BusinessException("No se puede reconfigurar los ítems del mes porque ya tienes ítems marcados como pagados. Cancela sus pagos primero.");
            }
        }
        
        monthlyBudgetItemRepository.deleteAll(existingItems);
        monthlyBudgetItemRepository.flush();

        List<MonthlyBudgetItem> newItems = new ArrayList<>();
        if (request.items() != null) {
            for (BudgetItemRequest itemReq : request.items()) {
                Category category = categoryRepository.findByIdAndUserEmail(itemReq.categoryId(), email)
                        .orElseThrow(() -> new ResourceNotFoundException("Category", itemReq.categoryId().toString()));

                boolean isValidCategory = category.getType() == CategoryType.EXPENSE &&
                        (category.isOrInheritsFrom("Vida") ||
                         category.isOrInheritsFrom("Ocio") ||
                         category.isOrInheritsFrom("Inversion-Deuda"));

                if (!isValidCategory) {
                    throw new BusinessException("El ítem de presupuesto '" + itemReq.name() + "' únicamente se puede asociar a una categoría de Gastos que pertenezca a Vida, Ocio o Inversion-Deuda.");
                }

                Integer dueDay = itemReq.dueDay();
                LocalDate dueDate = null;
                if (dueDay != null) {
                    int lastDayOfMonth = java.time.YearMonth.of(monthlyBudget.getYear(), monthlyBudget.getMonth()).lengthOfMonth();
                    int resolvedDay = Math.min(dueDay, lastDayOfMonth);
                    dueDate = LocalDate.of(monthlyBudget.getYear(), monthlyBudget.getMonth(), resolvedDay);
                }

                MonthlyBudgetItem item = MonthlyBudgetItem.builder()
                        .monthlyBudget(monthlyBudget)
                        .name(itemReq.name().trim())
                        .category(category)
                        .amountLimit(itemReq.amountLimit())
                        .dueDay(dueDay)
                        .dueDate(dueDate)
                        .paid(false)
                        .build();

                newItems.add(monthlyBudgetItemRepository.save(item));
            }
        }

        List<BudgetItemResponse> itemsResponse = newItems.stream()
                .sorted(Comparator.comparing(MonthlyBudgetItem::getDueDay, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(item -> new BudgetItemResponse(
                        item.getId(),
                        item.getName(),
                        item.getCategory().getId(),
                        item.getCategory().getName(),
                        item.getCategory().getBaseCategoryName(),
                        item.getAmountLimit(),
                        item.getDueDay()))
                .collect(Collectors.toList());

        return new BudgetModelResponse(
                monthlyBudget.getId(),
                monthlyBudget.getTotalLimit(),
                monthlyBudget.getPercentVida(),
                monthlyBudget.getPercentOcio(),
                monthlyBudget.getPercentInversionDeuda(),
                itemsResponse
        );
    }

    @Transactional
    public BudgetComparisonResponse compareBudgetWithExpenses(String email, Integer month, Integer year) {
        MonthlyBudget monthlyBudget = getOrCreateMonthlyBudget(email, month, year);

        List<MonthlyBudgetItem> items = monthlyBudgetItemRepository.findByMonthlyBudgetId(monthlyBudget.getId());

        // Calcular el gasto acumulado de comida si existe el ítem
        BigDecimal comidaSpent = BigDecimal.ZERO;
        Optional<MonthlyBudgetItem> comidaItemOpt = items.stream()
                .filter(i -> i.getCategory().getName().equalsIgnoreCase("Comida"))
                .findFirst();
        
        if (comidaItemOpt.isPresent()) {
            LocalDate startDate = LocalDate.of(year, month, 1);
            LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
            List<Transaction> transactions = transactionRepository.findByAccountUserEmailAndDateBetween(email, startDate, endDate);
            comidaSpent = transactions.stream()
                    .filter(tx -> tx.getType() == CategoryType.EXPENSE && tx.getCategory().isOrInheritsFrom("Comida"))
                    .map(Transaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        final BigDecimal finalComidaSpent = comidaSpent;

        // Calcular gastos reales basados en transacciones pagadas (o comida dinámico)
        BigDecimal totalSpent = items.stream()
                .map(item -> {
                    if (item.getCategory().getName().equalsIgnoreCase("Comida")) {
                        return finalComidaSpent;
                    } else if (item.isPaid() && item.getTransaction() != null) {
                        return item.getTransaction().getAmount();
                    }
                    return BigDecimal.ZERO;
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<MonthlyBudgetItemResponse> itemsResponse = items.stream()
                .sorted(Comparator.comparing(MonthlyBudgetItem::getDueDay, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(item -> mapItemToResponse(item, finalComidaSpent))
                .collect(Collectors.toList());

        return new BudgetComparisonResponse(
                monthlyBudget.getId(),
                monthlyBudget.getTotalLimit(),
                totalSpent,
                monthlyBudget.getPercentVida(),
                monthlyBudget.getPercentOcio(),
                monthlyBudget.getPercentInversionDeuda(),
                itemsResponse
        );
    }

    @Transactional
    public BudgetComparisonResponse payBudgetItem(UUID itemId, MonthlyBudgetPayRequest request, String email) {
        MonthlyBudgetItem item = monthlyBudgetItemRepository.findByIdAndMonthlyBudgetUserEmail(itemId, email)
                .orElseThrow(() -> new ResourceNotFoundException("MonthlyBudgetItem", itemId.toString()));

        if (item.getCategory().getName().equalsIgnoreCase("Comida")) {
            throw new BusinessException("La categoría 'Comida' no se puede marcar como pagada manualmente, se calcula automáticamente según tus transacciones del mes.");
        }

        if (item.isPaid()) {
            throw new BusinessException("El ítem de presupuesto '" + item.getName() + "' ya se encuentra marcado como pagado.");
        }

        // Crear la transacción usando TransactionService
        TransactionRequest txRequest = new TransactionRequest(
                request.accountId(),
                item.getCategory().getId(),
                CategoryType.EXPENSE,
                request.amount(),
                "Pago de presupuesto: " + item.getName(),
                request.date()
        );

        TransactionResponse txResponse = transactionService.createTransaction(txRequest, email);

        // Buscar la transacción creada para asociarla
        Transaction transaction = transactionRepository.findById(txResponse.id())
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", txResponse.id().toString()));

        item.setPaid(true);
        item.setTransaction(transaction);
        monthlyBudgetItemRepository.save(item);

        MonthlyBudget mb = item.getMonthlyBudget();
        return compareBudgetWithExpenses(email, mb.getMonth(), mb.getYear());
    }

    @Transactional
    public BudgetComparisonResponse unpayBudgetItem(UUID itemId, String email) {
        MonthlyBudgetItem item = monthlyBudgetItemRepository.findByIdAndMonthlyBudgetUserEmail(itemId, email)
                .orElseThrow(() -> new ResourceNotFoundException("MonthlyBudgetItem", itemId.toString()));

        if (item.getCategory().getName().equalsIgnoreCase("Comida")) {
            throw new BusinessException("La categoría 'Comida' se calcula automáticamente y no se puede desmarcar.");
        }

        if (!item.isPaid() || item.getTransaction() == null) {
            throw new BusinessException("El ítem de presupuesto '" + item.getName() + "' no ha sido pagado.");
        }

        Transaction transaction = item.getTransaction();

        // Limpiar la relación antes de eliminar la transacción para evitar fallas de FK
        item.setPaid(false);
        item.setTransaction(null);
        monthlyBudgetItemRepository.saveAndFlush(item);

        // Eliminar la transacción, lo cual restaura automáticamente el balance de la cuenta
        transactionService.deleteTransaction(transaction.getId(), email);

        MonthlyBudget mb = item.getMonthlyBudget();
        return compareBudgetWithExpenses(email, mb.getMonth(), mb.getYear());
    }

    private MonthlyBudgetItemResponse mapItemToResponse(MonthlyBudgetItem item, BigDecimal comidaSpent) {
        UUID txId = null;
        BigDecimal paidAmount = null;
        String accountName = null;

        if (item.getCategory().getName().equalsIgnoreCase("Comida")) {
            paidAmount = comidaSpent;
        } else if (item.isPaid() && item.getTransaction() != null) {
            txId = item.getTransaction().getId();
            paidAmount = item.getTransaction().getAmount();
            accountName = item.getTransaction().getAccount().getName();
        }

        return new MonthlyBudgetItemResponse(
                item.getId(),
                item.getName(),
                item.getCategory().getId(),
                item.getCategory().getName(),
                item.getCategory().getBaseCategoryName(),
                item.getAmountLimit(),
                item.isPaid(),
                txId,
                paidAmount,
                accountName,
                item.getDueDay(),
                item.getDueDate()
        );
    }
}
