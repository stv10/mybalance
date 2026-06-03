package com.mybalance.budget;

import com.mybalance.auth.User;
import com.mybalance.auth.UserRepository;
import com.mybalance.budget.dto.BudgetModelRequest;
import com.mybalance.budget.dto.BudgetModelResponse;
import com.mybalance.budget.dto.BudgetItemRequest;
import com.mybalance.budget.dto.BudgetItemResponse;
import com.mybalance.category.Category;
import com.mybalance.category.CategoryRepository;
import com.mybalance.category.CategoryType;
import com.mybalance.shared.exception.BusinessException;
import com.mybalance.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BudgetModelService {

    private final BudgetModelRepository budgetModelRepository;
    private final BudgetModelItemRepository budgetModelItemRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public BudgetModelResponse getBudgetModel(String email) {
        return budgetModelRepository.findByUserEmail(email)
                .map(this::mapToResponse)
                .orElseGet(() -> new BudgetModelResponse(null, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, new ArrayList<>()));
    }

    @Transactional
    public BudgetModelResponse saveBudgetModel(BudgetModelRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", email));

        // Validar que la suma de los porcentajes sea exactamente 100%
        BigDecimal sumPercent = request.percentVida().add(request.percentOcio()).add(request.percentInversionDeuda());
        if (sumPercent.compareTo(BigDecimal.valueOf(100)) != 0) {
            throw new BusinessException("La suma de los porcentajes asignados a las categorías base debe ser exactamente 100%. Actualmente es: " + sumPercent + "%");
        }

        // Obtener o crear el modelo base del presupuesto
        BudgetModel budgetModel = budgetModelRepository.findByUserEmail(email)
                .orElseGet(() -> BudgetModel.builder().user(user).build());

        budgetModel.setTotalLimit(request.totalLimit());
        budgetModel.setPercentVida(request.percentVida());
        budgetModel.setPercentOcio(request.percentOcio());
        budgetModel.setPercentInversionDeuda(request.percentInversionDeuda());
        budgetModel = budgetModelRepository.save(budgetModel);

        // Limpiar los ítems de presupuesto existentes en la plantilla
        budgetModelItemRepository.deleteByBudgetModelId(budgetModel.getId());
        budgetModelItemRepository.flush();

        List<BudgetModelItem> newItems = new ArrayList<>();
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

                BudgetModelItem item = BudgetModelItem.builder()
                        .budgetModel(budgetModel)
                        .name(itemReq.name().trim())
                        .category(category)
                        .amountLimit(itemReq.amountLimit())
                        .dueDay(itemReq.dueDay())
                        .build();

                newItems.add(budgetModelItemRepository.save(item));
            }
        }

        return new BudgetModelResponse(
                budgetModel.getId(),
                budgetModel.getTotalLimit(),
                budgetModel.getPercentVida(),
                budgetModel.getPercentOcio(),
                budgetModel.getPercentInversionDeuda(),
                newItems.stream()
                        .sorted(Comparator.comparing(BudgetModelItem::getDueDay, Comparator.nullsLast(Comparator.naturalOrder())))
                        .map(this::mapItemToResponse)
                        .collect(Collectors.toList())
        );
    }

    private BudgetModelResponse mapToResponse(BudgetModel budgetModel) {
        List<BudgetItemResponse> items = budgetModelItemRepository
                .findByBudgetModelId(budgetModel.getId()).stream()
                .sorted(Comparator.comparing(BudgetModelItem::getDueDay, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::mapItemToResponse)
                .collect(Collectors.toList());

        return new BudgetModelResponse(
                budgetModel.getId(),
                budgetModel.getTotalLimit(),
                budgetModel.getPercentVida(),
                budgetModel.getPercentOcio(),
                budgetModel.getPercentInversionDeuda(),
                items
        );
    }

    private BudgetItemResponse mapItemToResponse(BudgetModelItem item) {
        return new BudgetItemResponse(
                item.getId(),
                item.getName(),
                item.getCategory().getId(),
                item.getCategory().getName(),
                item.getCategory().getBaseCategoryName(),
                item.getAmountLimit(),
                item.getDueDay()
        );
    }
}
