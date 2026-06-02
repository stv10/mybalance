package com.mybalance.transaction;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    List<Transaction> findByAccountUserEmailOrderByDateDesc(String email);
    Optional<Transaction> findByIdAndAccountUserEmail(UUID id, String email);
    List<Transaction> findByAccountUserEmailAndDateBetween(String email, LocalDate startDate, LocalDate endDate);
}
