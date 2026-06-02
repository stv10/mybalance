package com.mybalance.budget;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface BudgetModelRepository extends JpaRepository<BudgetModel, UUID> {
    Optional<BudgetModel> findByUserEmail(String email);
}
