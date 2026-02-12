package org.foodos.order.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.common.entity.BaseSoftDeleteEntity;
import org.foodos.order.entity.enums.OrderStatus;
import org.foodos.order.entity.enums.OrderType;
import org.foodos.restaurant.entity.Restaurant;
import org.foodos.restaurant.entity.RestaurantTable;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.SQLDelete;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Order Entity - Aggregate Root
 * Production-grade with optimistic locking, auditing, and business logic
 */
@Entity
@Table(name = "orders", indexes = {
        @Index(name = "idx_order_uuid", columnList = "order_uuid"),
        @Index(name = "idx_order_number", columnList = "order_number"),
        @Index(name = "idx_order_date", columnList = "order_date"),
        @Index(name = "idx_order_status", columnList = "status"),
        @Index(name = "idx_order_type", columnList = "order_type"),
        @Index(name = "idx_order_restaurant_id", columnList = "restaurant_id"),
        @Index(name = "idx_order_table_id", columnList = "table_id"),
        @Index(name = "idx_order_waiter_id", columnList = "waiter_id"),
        @Index(name = "idx_order_customer_phone", columnList = "customer_phone")
})
@SQLDelete(sql = "UPDATE orders SET is_deleted = true, deleted_at = now() WHERE id = ? AND version = ?")
@Filter(name = "deletedFilter", condition = "is_deleted = :isDeleted")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Order extends BaseSoftDeleteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_uuid", unique = true, nullable = false, updatable = false, length = 36)
    @Builder.Default
    private String orderUuid = UUID.randomUUID().toString();

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    // ===== RELATIONSHIPS =====

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id")
    private RestaurantTable table;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "waiter_id")
    private UserAuthEntity waiter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cashier_id")
    private UserAuthEntity cashier;

    // Order Items (Cascade ALL for true aggregate)
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @BatchSize(size = 25)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    // Kitchen Order Tickets
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @BatchSize(size = 10)
    @Builder.Default
    private List<KitchenOrderTicket> kitchenOrderTickets = new ArrayList<>();

    // Payments for this order
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @BatchSize(size = 10)
    @Builder.Default
    private List<Payment> payments = new ArrayList<>();

    // ===== ORDER DETAILS =====

    @Column(name = "order_number", unique = true, nullable = false, length = 50)
    private String orderNumber;

    @Column(name = "order_date", nullable = false)
    private LocalDate orderDate;

    @Column(name = "order_time", nullable = false)
    private LocalDateTime orderTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_type", nullable = false, length = 20)
    @Builder.Default
    private OrderType orderType = OrderType.DINE_IN;

    @Column(name = "number_of_guests")
    private Integer numberOfGuests;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private OrderStatus status = OrderStatus.DRAFT;

    // ===== FINANCIAL DETAILS =====

    @Column(name = "subtotal", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal subtotal = BigDecimal.ZERO;

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

    @Column(name = "service_charge", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal serviceCharge = BigDecimal.ZERO;

    @Column(name = "service_charge_percentage", precision = 5, scale = 2)
    private BigDecimal serviceChargePercentage;

    @Column(name = "delivery_charge", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal deliveryCharge = BigDecimal.ZERO;

    @Column(name = "packing_charge", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal packingCharge = BigDecimal.ZERO;

    @Column(name = "tip_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal tipAmount = BigDecimal.ZERO;

    @Column(name = "round_off", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal roundOff = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "paid_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "balance_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal balanceAmount = BigDecimal.ZERO;

    // ===== DISCOUNT & COUPON =====

    @Column(name = "coupon_code", length = 50)
    private String couponCode;

    @Column(name = "discount_reason", length = 200)
    private String discountReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "discount_approved_by")
    private UserAuthEntity discountApprovedBy;

    // ===== CUSTOMER DETAILS =====

    @Column(name = "customer_name", length = 100)
    private String customerName;

    @Column(name = "customer_phone", length = 15)
    private String customerPhone;

    @Column(name = "customer_email", length = 100)
    private String customerEmail;

    @Column(name = "delivery_address", columnDefinition = "TEXT")
    private String deliveryAddress;

    // ===== NOTES & SPECIAL INSTRUCTIONS =====

    @Column(name = "order_notes", columnDefinition = "TEXT")
    private String orderNotes;

    @Column(name = "kitchen_notes", columnDefinition = "TEXT")
    private String kitchenNotes;

    // ===== TIMESTAMPS =====

    @Column(name = "billed_at")
    private LocalDateTime billedAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cancelled_by")
    private UserAuthEntity cancelledBy;

    // ===== SYNC FLAGS =====

    @Column(name = "is_synced", nullable = false)
    @Builder.Default
    private Boolean isSynced = false;

    @Column(name = "synced_at")
    private LocalDateTime syncedAt;

    @Column(name = "is_printed", nullable = false)
    @Builder.Default
    private Boolean isPrinted = false;

    @Column(name = "printed_at")
    private LocalDateTime printedAt;

    // ===== LIFECYCLE CALLBACKS =====

    @PrePersist
    @Override
    protected void onCreate() {
        super.onCreate();
        if (orderUuid == null) {
            orderUuid = UUID.randomUUID().toString();
        }
        if (orderDate == null) {
            orderDate = LocalDate.now();
        }
        if (orderTime == null) {
            orderTime = LocalDateTime.now();
        }
    }

    // ===== AGGREGATE PATTERN METHODS =====

    /**
     * Add item to order
     */
    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }

    /**
     * Remove item from order
     */
    public void removeItem(OrderItem item) {
        items.remove(item);
        item.setOrder(null);
    }

    /**
     * Add payment to order
     */
    public void addPayment(Payment payment) {
        payments.add(payment);
        payment.setOrder(this);
        updatePaidAmount();
    }

    /**
     * Add kitchen order ticket
     */
    public void addKitchenOrderTicket(KitchenOrderTicket kot) {
        kitchenOrderTickets.add(kot);
        kot.setOrder(this);
    }

    /**
     * Calculate all order totals
     */
    public void calculateTotals() {
        // Initialize null values to ZERO
        if (this.discountAmount == null) this.discountAmount = BigDecimal.ZERO;
        if (this.taxAmount == null) this.taxAmount = BigDecimal.ZERO;
        if (this.serviceCharge == null) this.serviceCharge = BigDecimal.ZERO;
        if (this.deliveryCharge == null) this.deliveryCharge = BigDecimal.ZERO;
        if (this.packingCharge == null) this.packingCharge = BigDecimal.ZERO;
        if (this.tipAmount == null) this.tipAmount = BigDecimal.ZERO;
        if (this.roundOff == null) this.roundOff = BigDecimal.ZERO;
        if (this.paidAmount == null) this.paidAmount = BigDecimal.ZERO;

        // Calculate subtotal from items
        this.subtotal = items.stream()
                .filter(item -> !item.getIsCancelled())
                .map(OrderItem::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        // Apply discount
        if (discountPercentage != null && discountPercentage.compareTo(BigDecimal.ZERO) > 0) {
            this.discountAmount = subtotal.multiply(discountPercentage)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }

        BigDecimal amountAfterDiscount = subtotal.subtract(discountAmount);

        // Calculate tax
        if (taxPercentage != null && taxPercentage.compareTo(BigDecimal.ZERO) > 0) {
            this.taxAmount = amountAfterDiscount.multiply(taxPercentage)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }

        // Calculate service charge
        if (serviceChargePercentage != null && serviceChargePercentage.compareTo(BigDecimal.ZERO) > 0) {
            this.serviceCharge = amountAfterDiscount.multiply(serviceChargePercentage)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }

        // Calculate total before round-off
        BigDecimal totalBeforeRoundOff = amountAfterDiscount
                .add(taxAmount)
                .add(serviceCharge)
                .add(deliveryCharge)
                .add(packingCharge)
                .add(tipAmount);

        // Apply round-off to nearest whole number
        BigDecimal rounded = totalBeforeRoundOff.setScale(0, RoundingMode.HALF_UP);
        this.roundOff = rounded.subtract(totalBeforeRoundOff);
        this.totalAmount = rounded;

        // Update balance
        this.balanceAmount = totalAmount.subtract(paidAmount);
    }

    /**
     * Update paid amount from payments
     */
    private void updatePaidAmount() {
        this.paidAmount = payments.stream()
                .filter(payment -> payment.getStatus() == org.foodos.order.entity.enums.PaymentStatus.COMPLETED)
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        this.balanceAmount = totalAmount.subtract(paidAmount);
    }

    /**
     * Check if order is fully paid
     */
    public boolean isFullyPaid() {
        return balanceAmount.compareTo(BigDecimal.ZERO) <= 0;
    }

    /**
     * Check if order can be modified
     */
    public boolean canBeModified() {
        return !status.isTerminal() && status != OrderStatus.BILLED;
    }

    /**
     * Transition to new status with validation
     */
    public void transitionTo(OrderStatus newStatus) {
        if (!status.canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                    String.format("Cannot transition from %s to %s", status, newStatus)
            );
        }

        this.status = newStatus;

        // Update timestamps based on status
        switch (newStatus) {
            case BILLED -> this.billedAt = LocalDateTime.now();
            case PAID -> this.paidAt = LocalDateTime.now();
            case COMPLETED -> this.completedAt = LocalDateTime.now();
            case CANCELLED, VOID -> this.cancelledAt = LocalDateTime.now();
        }
    }

    /**
     * Get active (non-cancelled) items
     */
    public List<OrderItem> getActiveItems() {
        return items.stream()
                .filter(item -> !item.getIsCancelled())
                .toList();
    }

    /**
     * Get total item count
     */
    public int getItemCount() {
        return (int) items.stream()
                .filter(item -> !item.getIsCancelled())
                .count();
    }

    /**
     * Check if order has any KOT sent
     */
    public boolean hasKotSent() {
        return !kitchenOrderTickets.isEmpty();
    }

    /**
     * Cancel the order
     */
    public void cancel(String reason) {
        if (!canBeCancelled()) {
            throw new IllegalStateException("Order cannot be cancelled in its current state: " + status);
        }
        this.cancellationReason = reason;
        transitionTo(OrderStatus.CANCELLED);
    }

    /**
     * Check if the order can be cancelled.
     */
    public boolean canBeCancelled() {
        // Example logic: Can cancel if not yet completed, paid, or already cancelled.
        return status != OrderStatus.COMPLETED && status != OrderStatus.PAID && status != OrderStatus.CANCELLED;
    }

    /**
     * Complete the order
     */
    public void complete() {
        if (status != OrderStatus.PAID) {
            throw new IllegalStateException("Order must be paid before it can be completed.");
        }
        transitionTo(OrderStatus.COMPLETED);
    }

    /**
     * Check if the order can be deleted.
     */
    public boolean canBeDeleted() {
        // Example logic: Can only delete draft or cancelled orders.
        return status == OrderStatus.DRAFT || status == OrderStatus.CANCELLED;
    }
}
