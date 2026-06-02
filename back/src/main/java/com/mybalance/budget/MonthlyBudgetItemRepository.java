package com.mybalance.budget;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MonthlyBudgetItemRepository extends JpaRepository<MonthlyBudgetItem, UUID> {
    List<MonthlyBudgetItem> findByMonthlyBudgetId(UUID monthlyBudgetId);
    void deleteByMonthlyBudgetId(UUID monthlyBudgetId);
    Optional<MonthlyBudgetItem> findByIdAndMonthlyBudgetUserEmail(UUID id, String email);
    List<MonthlyBudgetItem> findByPaidFalseAndDueDate(LocalDate dueDate);
}
