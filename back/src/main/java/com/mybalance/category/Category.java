package com.mybalance.category;

import com.mybalance.auth.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CategoryType type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_category_id")
    private Category parent;

    @OneToMany(mappedBy = "parent")
    @Builder.Default
    private java.util.List<Category> subcategories = new java.util.ArrayList<>();

    @Column(name = "is_user_created", nullable = false)
    @Builder.Default
    private boolean isUserCreated = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public boolean isOrInheritsFrom(String targetName) {
        Category current = this;
        while (current != null) {
            if (current.getName().equalsIgnoreCase(targetName)) {
                return true;
            }
            current = current.getParent();
        }
        return false;
    }

    public String getBaseCategoryName() {
        if (isOrInheritsFrom("Vida")) {
            return "Vida";
        }
        if (isOrInheritsFrom("Ocio")) {
            return "Ocio";
        }
        if (isOrInheritsFrom("Inversion-Deuda")) {
            return "Inversion-Deuda";
        }
        return null;
    }
}
