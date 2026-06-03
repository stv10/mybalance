package com.mybalance.category;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {
    List<Category> findByUserEmailOrderByNameAsc(String email);
    Optional<Category> findByIdAndUserEmail(UUID id, String email);
    boolean existsByUserEmailAndNameAndType(String email, String name, CategoryType type);
    Optional<Category> findByUserEmailAndNameAndType(String email, String name, CategoryType type);
}
