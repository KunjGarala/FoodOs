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
import org.foodos.coupon.entity.enums.CouponScopeType;
import org.foodos.coupon.entity.enums.DiscountType;
import org.foodos.restaurant.entity.Restaurant;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.SQLDelete;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;

@Entity
@Table(name = "coupons",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_coupon_code", columnNames = "code"),
                @UniqueConstraint(name = "uk_coupon_uuid", columnNames = "coupon_uuid")
        },
        indexes = {
                @Index(name = "idx_coupon_code", columnList = "code"),
                @Index(name = "idx_coupon_scope", columnList = "scope_type"),
                @Index(name = "idx_coupon_active", columnList = "is_active"),
                @Index(name = "idx_coupon_start_end", columnList = "start_date,end_date")
        })
@SQLDelete(sql = "UPDATE coupons SET is_deleted = true, deleted_at = now() WHERE id = ? AND version = ?")
@Filter(name = "deletedFilter", condition = "is_deleted = :isDeleted")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Coupon extends BaseSoftDeleteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "coupon_uuid", unique = true, nullable = false, updatable = false, length = 36)
    @Builder.Default
    private String couponUuid = UUID.randomUUID().toString();

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 20)
    private DiscountType discountType;

    @Column(name = "discount_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountValue;

    @Column(name = "max_discount_amount", precision = 12, scale = 2)
    private BigDecimal maxDiscountAmount;

    @Column(name = "min_order_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal minOrderAmount = BigDecimal.ZERO;

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate;

    @Column(name = "usage_limit_global")
    private Integer usageLimitGlobal;

    @Column(name = "usage_limit_per_user")
    private Integer usageLimitPerUser;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "allow_stacking", nullable = false)
    @Builder.Default
    private Boolean allowStacking = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "scope_type", nullable = false, length = 30)
    private CouponScopeType scopeType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_restaurant_id")
    private Restaurant ownerRestaurant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private UserAuthEntity createdBy;

    @PrePersist
    @Override
    protected void onCreate() {
        super.onCreate();
        if (couponUuid == null) {
            couponUuid = UUID.randomUUID().toString();
        }
        normalizeCode();
    }

    @PreUpdate
    @Override
    protected void onUpdate() {
        super.onUpdate();
        normalizeCode();
    }

    private void normalizeCode() {
        if (code != null) {
            code = code.trim().toUpperCase(Locale.ROOT);
        }
    }
}
