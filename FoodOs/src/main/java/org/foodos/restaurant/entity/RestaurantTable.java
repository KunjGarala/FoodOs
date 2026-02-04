package org.foodos.restaurant.entity;

import jakarta.persistence.*;
import lombok.*;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.restaurant.entity.enums.TableStatus;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

import java.time.LocalDateTime;
import java.util.*;


@Entity
@Table(name = "restaurant_tables", indexes = {
        @Index(name = "idx_section", columnList = "section_name"),
        @Index(name = "idx_status", columnList = "status")
})
@SQLDelete(sql = "UPDATE restaurant_tables SET is_deleted = true WHERE id = ?")
@Filter(
        name = "deletedFilter",
        condition = "is_deleted = :isDeleted"
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
public class RestaurantTable {

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

    // Current active order on this table
//    @OneToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "current_order_id")
//    private Order currentOrder;

    // Current waiter assigned to this table
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_waiter_id")
    private UserAuthEntity currentWaiter;

    // All orders ever placed on this table
//    @OneToMany(mappedBy = "table", cascade = CascadeType.PERSIST)
//    @Builder.Default
//    private List<Order> orderHistory = new ArrayList<>();

    // Reservations for this table
    @OneToMany(mappedBy = "table", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Reservation> reservations = new ArrayList<>();

    @Column(name = "current_pax")
    private Integer currentPax; // Number of guests currently seated

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

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "is_merged", nullable = false)
    @Builder.Default
    private Boolean isMerged = false; // Indicates if the table is currently merged with others

    @Column(name = "merged_with_table_ids", columnDefinition = "TEXT")
    private String mergedWithTableIds; // Comma-separated list of table IDs this table is merged with

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (tableUuid == null) {
            tableUuid = UUID.randomUUID().toString();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}