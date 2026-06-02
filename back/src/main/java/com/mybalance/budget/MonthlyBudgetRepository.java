package com.mybalance.budget;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MonthlyBudgetRepository extends JpaRepository<MonthlyBudget, UUID> {
    List<MonthlyBudget> findByUserEmailOrderByYearDescMonthDesc(String email);
    Optional<MonthlyBudget> findByUserEmailAndMonthAndYear(String email, Integer month, Integer year);
    Optional<MonthlyBudget> findByIdAndUserEmail(UUID id, String email);
}

