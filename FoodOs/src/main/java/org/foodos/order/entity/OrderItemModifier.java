package org.foodos.order.entity;

import jakarta.persistence.*;
import lombok.*;
import org.foodos.product.entity.Modifier;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Order Item Modifier Entity
 * Tracks modifiers applied to order items (e.g., extra cheese, no onions)
 */
@Entity
@Table(name = "order_item_modifiers", indexes = {
        @Index(name = "idx_order_item_modifier_uuid", columnList = "order_item_modifier_uuid"),
        @Index(name = "idx_order_item_id", columnList = "order_item_id"),
        @Index(name = "idx_modifier_id", columnList = "modifier_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItemModifier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_item_modifier_uuid", unique = true, nullable = false, updatable = false, length = 36)
    @Builder.Default
    private String orderItemModifierUuid = UUID.randomUUID().toString();

    // ===== RELATIONSHIPS =====

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id", nullable = false)
    private OrderItem orderItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modifier_id", nullable = false)
    private Modifier modifier;

    // ===== MODIFIER DETAILS (Snapshot at order time) =====

    @Column(name = "modifier_name", nullable = false, length = 100)
    private String modifierName;

    @Column(name = "modifier_group_name", length = 100)
    private String modifierGroupName;

    // ===== QUANTITY & PRICING =====

    @Column(name = "quantity", nullable = false, precision = 10, scale = 3)
    @Builder.Default
    private BigDecimal quantity = BigDecimal.ONE;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal unitPrice = BigDecimal.ZERO;

    @Column(name = "line_total", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal lineTotal = BigDecimal.ZERO;

    // ===== TIMESTAMPS =====

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // ===== LIFECYCLE CALLBACKS =====

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (orderItemModifierUuid == null) {
            orderItemModifierUuid = UUID.randomUUID().toString();
        }
        calculateLineTotal();
    }

    // ===== BUSINESS LOGIC =====

    /**
     * Calculate line total
     */
    public void calculateLineTotal() {
        this.lineTotal = unitPrice.multiply(quantity)
                .setScale(2, RoundingMode.HALF_UP);
    }
}

