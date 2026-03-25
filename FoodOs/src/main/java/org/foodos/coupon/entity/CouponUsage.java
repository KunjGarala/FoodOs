package org.foodos.coupon.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.common.entity.BaseSoftDeleteEntity;
import org.foodos.customer.entity.Customer;
import org.foodos.order.entity.Order;
import org.foodos.restaurant.entity.Restaurant;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.SQLDelete;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "coupon_usages",
        uniqueConstraints = @UniqueConstraint(name = "uk_coupon_order", columnNames = {"coupon_id", "order_id"}),
        indexes = {
                @Index(name = "idx_coupon_usage_coupon_id", columnList = "coupon_id"),
                @Index(name = "idx_coupon_usage_customer_id", columnList = "customer_id"),
                @Index(name = "idx_coupon_usage_order_id", columnList = "order_id"),
            @Index(name = "idx_coupon_usage_restaurant_id", columnList = "restaurant_id"),
            @Index(name = "idx_coupon_usage_used_by", columnList = "used_by")
        })
@SQLDelete(sql = "UPDATE coupon_usages SET is_deleted = true, deleted_at = now() WHERE id = ?")
@Filter(name = "deletedFilter", condition = "is_deleted = :isDeleted")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class CouponUsage extends BaseSoftDeleteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usage_uuid", nullable = false, updatable = false, unique = true, length = 36)
    @Builder.Default
    private String usageUuid = UUID.randomUUID().toString();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "coupon_id", nullable = false)
    private Coupon coupon;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "used_by")
    private UserAuthEntity usedBy;

    @Column(name = "used_at", nullable = false)
    private LocalDateTime usedAt;

    @Column(name = "discount_applied", precision = 12, scale = 2)
    private BigDecimal discountApplied;

    @PrePersist
    @Override
    protected void onCreate() {
        super.onCreate();
        if (usageUuid == null) {
            usageUuid = UUID.randomUUID().toString();
        }
        if (usedAt == null) {
            usedAt = LocalDateTime.now();
        }
    }
}
