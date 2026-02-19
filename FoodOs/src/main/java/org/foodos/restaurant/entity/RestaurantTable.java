package org.foodos.restaurant.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.common.entity.BaseSoftDeleteEntity;
import org.foodos.order.entity.Order;
import org.foodos.restaurant.entity.enums.TableStatus;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Filter;

import java.time.LocalDateTime;
import java.util.*;


@Entity
@Table(name = "restaurant_tables", indexes = {
        @Index(name = "idx_table_section", columnList = "section_name"),
        @Index(name = "idx_table_status", columnList = "status")
})
@SQLDelete(sql = "UPDATE restaurant_tables SET is_deleted = true WHERE id = ?")
@Filter(
        name = "deletedFilter",
        condition = "is_deleted = :isDeleted"
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@SuperBuilder
public class RestaurantTable extends BaseSoftDeleteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "table_uuid", unique = true, nullable = false)
    @Builder.Default
    private String tableUuid = UUID.randomUUID().toString();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @Column(name = "table_number", nullable = false, length = 20)
    private String tableNumber;

    @Column(name = "section_name", length = 50)
    private String sectionName;

    @Column(nullable = false)
    @Builder.Default
    private Integer capacity = 4;

    @Column(name = "min_capacity")
    @Builder.Default
    private Integer minCapacity = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TableStatus status = TableStatus.VACANT;

    /**
     * The currently active order on this table.
     *
     * Ownership: RestaurantTable owns the FK (current_order_id).
     * No cascade — Order lifecycle is managed independently.
     * Set to null when the order is closed/completed.
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_order_id", referencedColumnName = "id")
    private Order currentOrder;

    /**
     * Current waiter assigned to this table.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_waiter_id")
    private UserAuthEntity currentWaiter;

    /**
     * All orders ever placed on this table (history).
     * Order owns the FK (table_id), so no cascade needed here.
     * CascadeType.PERSIST + MERGE ensures in-memory additions are saved.
     */
    @OneToMany(mappedBy = "table", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @Builder.Default
    private List<Order> orderHistory = new ArrayList<>();

    /**
     * Reservations for this table.
     */
    @OneToMany(mappedBy = "table", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Reservation> reservations = new ArrayList<>();

    @Column(name = "current_pax")
    private Integer currentPax;

    @Column(name = "seated_at")
    private LocalDateTime seatedAt;

    @Column(name = "position_x")
    private Integer positionX;

    @Column(name = "position_y")
    private Integer positionY;

    @Column(name = "table_shape", length = 20)
    @Builder.Default
    private String tableShape = "RECTANGLE";

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_merged", nullable = false)
    @Builder.Default
    private Boolean isMerged = false;

    @Column(name = "merged_with_table_ids", columnDefinition = "TEXT")
    private String mergedWithTableIds;

    // ===== HELPER METHODS =====

    /**
     * Assign an active order to this table and update table status.
     */
    public void assignOrder(Order order) {
        this.currentOrder = order;
        this.status = TableStatus.OCCUPIED;
        this.seatedAt = LocalDateTime.now();
    }

    /**
     * Clear the active order when it is closed/completed.
     */
    public void clearOrder() {
        this.currentOrder = null;
        this.currentPax = null;
        this.seatedAt = null;
        this.currentWaiter = null;
        this.status = TableStatus.VACANT;
    }

    /**
     * Check whether the table currently has an active order.
     */
    public boolean hasActiveOrder() {
        return currentOrder != null;
    }
}