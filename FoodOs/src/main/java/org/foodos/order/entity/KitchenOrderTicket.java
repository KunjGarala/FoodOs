package org.foodos.order.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.foodos.common.entity.BaseSoftDeleteEntity;
import org.foodos.order.entity.enums.KotTicketStatus;
import org.foodos.order.entity.enums.KotType;
import org.foodos.restaurant.entity.Restaurant;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.SQLDelete;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Kitchen Order Ticket (KOT) Entity
 * Represents tickets sent to kitchen for order preparation
 */
@Entity
@Table(name = "kitchen_order_tickets", indexes = {
        @Index(name = "idx_kot_uuid", columnList = "kot_uuid"),
        @Index(name = "idx_kot_number", columnList = "kot_number"),
        @Index(name = "idx_kot_date", columnList = "kot_date"),
        @Index(name = "idx_order_id", columnList = "order_id"),
        @Index(name = "idx_status", columnList = "status"),
        @Index(name = "idx_kot_type", columnList = "kot_type"),
        @Index(name = "idx_printer_target", columnList = "printer_target")
})
@SQLDelete(sql = "UPDATE kitchen_order_tickets SET is_deleted = true, deleted_at = now() WHERE id = ?")
@Filter(name = "deletedFilter", condition = "is_deleted = :isDeleted")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class KitchenOrderTicket extends BaseSoftDeleteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "kot_uuid", unique = true, nullable = false, updatable = false, length = 36)
    @Builder.Default
    private String kotUuid = UUID.randomUUID().toString();

    // ===== RELATIONSHIPS =====

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    // KOT Items (detailed list for kitchen)
    @OneToMany(mappedBy = "kitchenOrderTicket", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("sortOrder ASC")
    @Builder.Default
    private List<KotItem> kotItems = new ArrayList<>();

    // ===== KOT DETAILS =====

    @Column(name = "kot_number", nullable = false, length = 50)
    private String kotNumber;

    @Column(name = "kot_date", nullable = false)
    private LocalDate kotDate;

    @Column(name = "kot_time", nullable = false)
    private LocalDateTime kotTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "kot_type", nullable = false, length = 20)
    @Builder.Default
    private KotType kotType = KotType.NEW;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private KotTicketStatus status = KotTicketStatus.PENDING;

    // ===== ORDER CONTEXT =====

    @Column(name = "order_number", length = 50)
    private String orderNumber;

    @Column(name = "table_number", length = 20)
    private String tableNumber;

    @Column(name = "waiter_name", length = 100)
    private String waiterName;

    // ===== KITCHEN ROUTING =====

    @Column(name = "printer_target", length = 50)
    private String printerTarget;

    @Column(name = "kitchen_station", length = 50)
    private String kitchenStation;

    // ===== NOTES =====

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "special_instructions", columnDefinition = "TEXT")
    private String specialInstructions;

    // ===== TIMESTAMPS =====

    @Column(name = "printed_at")
    private LocalDateTime printedAt;

    @Column(name = "acknowledged_at")
    private LocalDateTime acknowledgedAt;

    @Column(name = "preparation_started_at")
    private LocalDateTime preparationStartedAt;

    @Column(name = "ready_at")
    private LocalDateTime readyAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    // ===== PRIORITY =====

    @Column(name = "priority", nullable = false)
    @Builder.Default
    private Integer priority = 0; // Higher number = higher priority

    @Column(name = "is_urgent", nullable = false)
    @Builder.Default
    private Boolean isUrgent = false;

    // ===== LIFECYCLE CALLBACKS =====

    @PrePersist
    protected void onCreate() {
        if (kotUuid == null) {
            kotUuid = UUID.randomUUID().toString();
        }
        if (kotDate == null) {
            kotDate = LocalDate.now();
        }
        if (kotTime == null) {
            kotTime = LocalDateTime.now();
        }
        super.onCreate();
    }

    // ===== BUSINESS LOGIC METHODS =====

    /**
     * Add KOT item
     */
    public void addKotItem(KotItem item) {
        kotItems.add(item);
        item.setKitchenOrderTicket(this);
    }

    /**
     * Remove KOT item
     */
    public void removeKotItem(KotItem item) {
        kotItems.remove(item);
        item.setKitchenOrderTicket(null);
    }

    /**
     * Mark KOT as printed
     */
    public void markAsPrinted() {
        this.status = KotTicketStatus.SENT;
        this.printedAt = LocalDateTime.now();
    }

    /**
     * Acknowledge KOT receipt
     */
    public void acknowledge() {
        if (status == KotTicketStatus.SENT) {
            this.status = KotTicketStatus.ACKNOWLEDGED;
            this.acknowledgedAt = LocalDateTime.now();
        }
    }

    /**
     * Start preparation
     */
    public void startPreparation() {
        if (status == KotTicketStatus.ACKNOWLEDGED || status == KotTicketStatus.SENT) {
            this.status = KotTicketStatus.IN_PROGRESS;
            this.preparationStartedAt = LocalDateTime.now();
        }
    }

    /**
     * Mark all items as ready
     */
    public void markAsReady() {
        this.status = KotTicketStatus.READY;
        this.readyAt = LocalDateTime.now();
    }

    /**
     * Complete KOT
     */
    public void complete() {
        this.status = KotTicketStatus.COMPLETED;
        this.completedAt = LocalDateTime.now();
    }

    /**
     * Cancel KOT
     */
    public void cancel() {
        this.status = KotTicketStatus.CANCELLED;
        this.cancelledAt = LocalDateTime.now();
    }

    /**
     * Get total items count
     */
    public int getTotalItemsCount() {
        return kotItems.stream()
                .filter(item -> !item.getIsCancelled())
                .mapToInt(item -> item.getQuantity().intValue())
                .sum();
    }

    /**
     * Check if all items are ready
     */
    public boolean areAllItemsReady() {
        return kotItems.stream()
                .filter(item -> !item.getIsCancelled())
                .allMatch(item -> item.getIsReady());
    }
}

