package org.foodos.order.entity;

import jakarta.persistence.*;
import lombok.*;
import org.foodos.order.entity.enums.SpicyLevel;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * KOT Item Entity
 * Individual items in a Kitchen Order Ticket
 */
@Entity
@Table(name = "kot_items", indexes = {
        @Index(name = "idx_kot_item_uuid", columnList = "kot_item_uuid"),
        @Index(name = "idx_kot_id", columnList = "kot_id"),
        @Index(name = "idx_order_item_id", columnList = "order_item_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KotItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "kot_item_uuid", unique = true, nullable = false, updatable = false, length = 36)
    @Builder.Default
    private String kotItemUuid = UUID.randomUUID().toString();

    // ===== RELATIONSHIPS =====

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kot_id", nullable = false)
    private KitchenOrderTicket kitchenOrderTicket;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id", nullable = false)
    private OrderItem orderItem;

    @Column(name = "description", columnDefinition = "TEXT")
    private String Description;

    // ===== ITEM DETAILS (For kitchen display) =====

    @Column(name = "product_name", nullable = false, length = 200)
    private String productName;

    @Column(name = "variation_name", length = 100)
    private String variationName;

    @Column(name = "quantity", nullable = false, precision = 10, scale = 3)
    private BigDecimal quantity;

    @Column(name = "modifiers_text", columnDefinition = "TEXT")
    private String modifiersText;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "special_instructions", columnDefinition = "TEXT")
    private String specialInstructions;

    // ===== SPICY LEVEL =====

    @Enumerated(EnumType.STRING)
    @Column(name = "spicy_level", length = 20)
    private SpicyLevel spicyLevel;

    // ===== NOTES =====

    @Column(name = "kitchen_notes", columnDefinition = "TEXT")
    private String kitchenNotes;

    @Column(name = "order_notes", columnDefinition = "TEXT")
    private String orderNotes;

    // ===== STATUS =====

    @Column(name = "is_cancelled", nullable = false)
    @Builder.Default
    private Boolean isCancelled = false;

    @Column(name = "is_ready", nullable = false)
    @Builder.Default
    private Boolean isReady = false;

    @Column(name = "is_complimentary", nullable = false)
    @Builder.Default
    private Boolean isComplimentary = false;

    // ===== DISPLAY =====

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(name = "is_highlighted", nullable = false)
    @Builder.Default
    private Boolean isHighlighted = false;

    // ===== TIMESTAMPS =====

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "ready_at")
    private LocalDateTime readyAt;

    // ===== LIFECYCLE CALLBACKS =====

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (kotItemUuid == null) {
            kotItemUuid = UUID.randomUUID().toString();
        }
    }

    // ===== BUSINESS LOGIC =====

    /**
     * Mark item as ready
     */
    public void markAsReady() {
        this.isReady = true;
        this.readyAt = LocalDateTime.now();
    }

    /**
     * Cancel item
     */
    public void cancel() {
        this.isCancelled = true;
    }
}

