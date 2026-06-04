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
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BotTransactionHandler {

    private static final Logger log = LoggerFactory.getLogger(BotTransactionHandler.class);

    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;

    @Transactional
    public Transaction handleTransaction(AiTransactionResult aiResult, User user, String originalText) {
        log.info("Procesando resultado de IA para el usuario: {} - Resultado: {}", user.getEmail(), aiResult);

        // 1. Validaciones iniciales críticas
        if (aiResult.amount() == null || aiResult.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("El monto de la transacción debe ser mayor que cero.");
        }

        CategoryType transactionType;
        try {
            transactionType = CategoryType.valueOf(aiResult.type().toUpperCase());
        } catch (Exception e) {
            throw new BusinessException("Tipo de transacción inválido: " + aiResult.type() + ". Debe ser INCOME o EXPENSE.");
        }

        // 2. Resolver Cuenta
        List<Account> accounts = accountRepository.findByUserEmailOrderByNameAsc(user.getEmail());
        if (accounts.isEmpty()) {
            throw new BusinessException("El usuario no tiene ninguna cuenta registrada.");
        }

        Account account = null;
        if (aiResult.accountName() != null && !aiResult.accountName().trim().isEmpty()) {
            String targetAccountName = aiResult.accountName().trim();
            account = accounts.stream()
                    .filter(acc -> acc.getName().equalsIgnoreCase(targetAccountName))
                    .findFirst()
                    .orElse(null);
        }

        if (account == null) {
            // Fallback: usar la primera cuenta obtenida desde el back
            account = accounts.get(0);
            log.info("Cuenta '{}' no encontrada o vacía. Usando primera cuenta como fallback: '{}'", 
                    aiResult.accountName(), account.getName());
        } else {
            log.info("Cuenta resuelta con éxito: '{}'", account.getName());
        }

        // 3. Buscar o Crear Categoría
        List<Category> categories = categoryRepository.findByUserEmailOrderByNameAsc(user.getEmail());
        String targetCategoryName = aiResult.categoryName() != null ? aiResult.categoryName().trim() : "Otros";
        
        Category category = categories.stream()
                .filter(cat -> cat.getName().equalsIgnoreCase(targetCategoryName) && cat.getType() == transactionType)
                .findFirst()
                .orElse(null);

        if (category == null) {
            log.info("Categoría '{}' de tipo '{}' no encontrada. Creándola automáticamente...", targetCategoryName, transactionType);
            category = Category.builder()
                    .user(user)
                    .name(targetCategoryName)
                    .type(transactionType)
                    .build();
            category = categoryRepository.save(category);
        } else {
            log.info("Categoría resuelta con éxito: '{}'", category.getName());
        }

        // 4. Actualizar Balance de la Cuenta
        if (transactionType == CategoryType.INCOME) {
            account.credit(aiResult.amount());
        } else {
            account.debit(aiResult.amount());
        }
        accountRepository.save(account);

        // Truncar descripción a 32 caracteres para usarla como título
        String title = originalText.trim();
        if (title.length() > 32) {
            title = title.substring(0, 32);
        }

        // Truncar notas a 256 caracteres
        String notes = originalText.trim();
        if (notes.length() > 256) {
            notes = notes.substring(0, 256);
        }

        // 5. Guardar la Transacción
        Transaction transaction = Transaction.builder()
                .account(account)
                .category(category)
                .type(transactionType)
                .amount(aiResult.amount())
                .description(title)
                .notes(notes)
                .date(LocalDate.now())
                .build();

        transaction = transactionRepository.save(transaction);
        log.info("Transacción registrada con éxito. ID: {}", transaction.getId());

        return transaction;
    }
}
