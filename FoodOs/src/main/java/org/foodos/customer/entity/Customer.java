package org.foodos.customer.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.foodos.common.entity.BaseSoftDeleteEntity;
import org.foodos.restaurant.entity.Restaurant;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.SQLDelete;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Customer Entity — Built from order data.
 * A customer is uniquely identified by (phone + restaurant).
 * Aggregated stats (totalOrders, totalSpent, etc.) are updated
 * each time an order is completed for this customer.
 */
@Entity
@Table(name = "customers", indexes = {
        @Index(name = "idx_customer_uuid", columnList = "customer_uuid"),
        @Index(name = "idx_customer_phone_restaurant", columnList = "phone, restaurant_id", unique = true),
        @Index(name = "idx_customer_restaurant_id", columnList = "restaurant_id"),
        @Index(name = "idx_customer_name", columnList = "name"),
        @Index(name = "idx_customer_email", columnList = "email")
})
@SQLDelete(sql = "UPDATE customers SET is_deleted = true, deleted_at = now() WHERE id = ?")
@Filter(name = "deletedFilter", condition = "is_deleted = :isDeleted")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Customer extends BaseSoftDeleteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_uuid", unique = true, nullable = false, updatable = false, length = 36)
    @Builder.Default
    private String customerUuid = UUID.randomUUID().toString();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "phone", nullable = false, length = 15)
    private String phone;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    // ===== CRM-SPECIFIC FIELDS =====

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "tags", length = 500)
    private String tags;

    // ===== AGGREGATED STATS (updated on order completion) =====

    @Column(name = "total_orders", nullable = false)
    @Builder.Default
    private Integer totalOrders = 0;

    @Column(name = "total_spent", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalSpent = BigDecimal.ZERO;

    @Column(name = "average_order_value", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal averageOrderValue = BigDecimal.ZERO;

    @Column(name = "last_order_date")
    private LocalDate lastOrderDate;

    @Column(name = "first_order_date")
    private LocalDate firstOrderDate;

    @Column(name = "last_order_type", length = 20)
    private String lastOrderType;

    // ===== LIFECYCLE =====

    @PrePersist
    @Override
    protected void onCreate() {
        super.onCreate();
        if (customerUuid == null) {
            customerUuid = UUID.randomUUID().toString();
        }
    }

    // ===== HELPER METHODS =====

    public void incrementStats(BigDecimal orderTotal, LocalDate orderDate, String orderType) {
        this.totalOrders = (this.totalOrders == null ? 0 : this.totalOrders) + 1;
        this.totalSpent = (this.totalSpent == null ? BigDecimal.ZERO : this.totalSpent).add(orderTotal);
        if (this.totalOrders > 0) {
            this.averageOrderValue = this.totalSpent.divide(
                    BigDecimal.valueOf(this.totalOrders), 2, java.math.RoundingMode.HALF_UP);
        }
        if (this.firstOrderDate == null || orderDate.isBefore(this.firstOrderDate)) {
            this.firstOrderDate = orderDate;
        }
        if (this.lastOrderDate == null || orderDate.isAfter(this.lastOrderDate)) {
            this.lastOrderDate = orderDate;
            this.lastOrderType = orderType;
        }
    }
}
