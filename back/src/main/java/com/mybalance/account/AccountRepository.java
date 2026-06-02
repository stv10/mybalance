package com.mybalance.account;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AccountRepository extends JpaRepository<Account, UUID> {
    List<Account> findByUserEmailOrderByNameAsc(String email);
    Optional<Account> findByIdAndUserEmail(UUID id, String email);
    boolean existsByUserEmailAndNameIgnoreCase(String email, String name);
}
