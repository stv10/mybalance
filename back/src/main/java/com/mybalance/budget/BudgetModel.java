package com.mybalance.budget;

import com.mybalance.auth.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "budget_models")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BudgetModel {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "total_limit", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalLimit;

    @Column(name = "percent_vida", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal percentVida = BigDecimal.ZERO;

    @Column(name = "percent_ocio", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal percentOcio = BigDecimal.ZERO;

    @Column(name = "percent_inversion_deuda", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal percentInversionDeuda = BigDecimal.ZERO;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
