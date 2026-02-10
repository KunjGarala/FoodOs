package org.foodos.order.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.common.entity.BaseSoftDeleteEntity;
import org.foodos.order.entity.enums.KotStatus;
import org.foodos.product.entity.Product;
import org.foodos.product.entity.ProductVariation;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.SQLDelete;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Order Item Entity
 * Represents individual items in an order with KOT tracking
 */
@Entity
@Table(name = "order_items", indexes = {
        @Index(name = "idx_order_item_uuid", columnList = "order_item_uuid"),
        @Index(name = "idx_order_id", columnList = "order_id"),
        @Index(name = "idx_product_id", columnList = "product_id"),
        @Index(name = "idx_kot_status", columnList = "kot_status"),
        @Index(name = "idx_kot_id", columnList = "kot_id")
})
@SQLDelete(sql = "UPDATE order_items SET is_deleted = true, deleted_at = now() WHERE id = ?")
@Filter(name = "deletedFilter", condition = "is_deleted = :isDeleted")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class OrderItem extends BaseSoftDeleteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_item_uuid", unique = true, nullable = false, updatable = false, length = 36)
    @Builder.Default
    private String orderItemUuid = UUID.randomUUID().toString();

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    // ===== RELATIONSHIPS =====

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variation_id")
    private ProductVariation variation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kot_id")
    private KitchenOrderTicket kitchenOrderTicket;

    // Modifiers applied to this item
    @OneToMany(mappedBy = "orderItem", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<OrderItemModifier> modifiers = new ArrayList<>();

    // ===== PRODUCT DETAILS (Snapshot at order time) =====

    @Column(name = "product_name", nullable = false, length = 200)
    private String productName;

    @Column(name = "variation_name", length = 100)
    private String variationName;

    @Column(name = "sku", length = 50)
    private String sku;

    // ===== QUANTITY & PRICING =====

    @Column(name = "quantity", nullable = false, precision = 10, scale = 3)
    @Builder.Default
    private BigDecimal quantity = BigDecimal.ONE;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "cost_price", precision = 12, scale = 2)
    private BigDecimal costPrice;

    @Column(name = "discount_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "discount_percentage", precision = 5, scale = 2)
    private BigDecimal discountPercentage;

    @Column(name = "tax_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "tax_percentage", precision = 5, scale = 2)
    private BigDecimal taxPercentage;

    @Column(name = "line_total", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal lineTotal = BigDecimal.ZERO;

    // ===== SPECIAL INSTRUCTIONS =====

    @Column(name = "item_notes", columnDefinition = "TEXT")
    private String itemNotes;

    @Column(name = "special_instructions", columnDefinition = "TEXT")
    private String specialInstructions;

    // ===== KOT STATUS TRACKING =====

    @Enumerated(EnumType.STRING)
    @Column(name = "kot_status", nullable = false, length = 20)
    @Builder.Default
    private KotStatus kotStatus = KotStatus.PENDING;

    @Column(name = "kot_printed_at")
    private LocalDateTime kotPrintedAt;

    @Column(name = "preparation_started_at")
    private LocalDateTime preparationStartedAt;

    @Column(name = "ready_at")
    private LocalDateTime readyAt;

    @Column(name = "served_at")
    private LocalDateTime servedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "served_by")
    private UserAuthEntity servedBy;

    // ===== CANCELLATION =====

    @Column(name = "is_cancelled", nullable = false)
    @Builder.Default
    private Boolean isCancelled = false;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cancelled_by")
    private UserAuthEntity cancelledBy;

    @Column(name = "cancellation_reason", length = 200)
    private String cancellationReason;

    // ===== FLAGS =====

    @Column(name = "is_complimentary", nullable = false)
    @Builder.Default
    private Boolean isComplimentary = false;

    @Column(name = "is_half_portion", nullable = false)
    @Builder.Default
    private Boolean isHalfPortion = false;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    // ===== LIFECYCLE CALLBACKS =====

    @PrePersist
    protected void onCreate() {
        if (orderItemUuid == null) {
            orderItemUuid = UUID.randomUUID().toString();
        }
        super.onCreate();
    }

    // ===== BUSINESS LOGIC METHODS =====

    /**
     * Add modifier to item
     */
    public void addModifier(OrderItemModifier modifier) {
        modifiers.add(modifier);
        modifier.setOrderItem(this);
    }

    /**
     * Remove modifier from item
     */
    public void removeModifier(OrderItemModifier modifier) {
        modifiers.remove(modifier);
        modifier.setOrderItem(null);
    }

    /**
     * Calculate line total including modifiers, discount, and tax
     */
    public void calculateLineTotal() {
        // Calculate modifiers total
        BigDecimal modifiersTotal = modifiers.stream()
                .map(OrderItemModifier::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Base amount = (unit price + modifiers) * quantity
        BigDecimal baseAmount = unitPrice.add(modifiersTotal)
                .multiply(quantity)
                .setScale(2, RoundingMode.HALF_UP);

        // Apply item-level discount
        BigDecimal discountedAmount = baseAmount;
        if (discountPercentage != null && discountPercentage.compareTo(BigDecimal.ZERO) > 0) {
            this.discountAmount = baseAmount.multiply(discountPercentage)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            discountedAmount = baseAmount.subtract(discountAmount);
        } else if (discountAmount != null && discountAmount.compareTo(BigDecimal.ZERO) > 0) {
            discountedAmount = baseAmount.subtract(discountAmount);
        }

        // Calculate tax on discounted amount
        if (taxPercentage != null && taxPercentage.compareTo(BigDecimal.ZERO) > 0) {
            this.taxAmount = discountedAmount.multiply(taxPercentage)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }

        // Final line total
        this.lineTotal = discountedAmount.add(taxAmount);
    }

    /**
     * Cancel this item
     */
    public void cancel(UserAuthEntity cancelledBy, String reason) {
        if (isCancelled) {
            throw new IllegalStateException("Item already cancelled");
        }
        if (kotStatus == KotStatus.SERVED) {
            throw new IllegalStateException("Cannot cancel served item");
        }

        this.isCancelled = true;
        this.cancelledAt = LocalDateTime.now();
        this.cancelledBy = cancelledBy;
        this.cancellationReason = reason;
        this.kotStatus = KotStatus.CANCELLED;
    }

    /**
     * Mark item as ready for serving
     */
    public void markAsReady() {
        this.kotStatus = KotStatus.READY;
        this.readyAt = LocalDateTime.now();
    }

    /**
     * Mark item as served
     */
    public void markAsServed(UserAuthEntity servedBy) {
        this.kotStatus = KotStatus.SERVED;
        this.servedAt = LocalDateTime.now();
        this.servedBy = servedBy;
    }

    /**
     * Start preparation
     */
    public void startPreparation() {
        this.kotStatus = KotStatus.COOKING;
        this.preparationStartedAt = LocalDateTime.now();
    }

    /**
     * Get modifier text for display
     */
    public String getModifiersText() {
        if (modifiers.isEmpty()) {
            return "";
        }
        return modifiers.stream()
                .map(OrderItemModifier::getModifierName)
                .reduce((a, b) -> a + ", " + b)
                .orElse("");
    }

    /**
     * Check if item can be cancelled
     */
    public boolean canBeCancelled() {
        return !isCancelled && kotStatus != KotStatus.SERVED;
    }
}

