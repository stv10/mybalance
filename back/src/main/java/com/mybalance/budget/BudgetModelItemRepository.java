package com.mybalance.budget;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface BudgetModelItemRepository extends JpaRepository<BudgetModelItem, UUID> {
    List<BudgetModelItem> findByBudgetModelId(UUID budgetModelId);
    void deleteByBudgetModelId(UUID budgetModelId);
}
