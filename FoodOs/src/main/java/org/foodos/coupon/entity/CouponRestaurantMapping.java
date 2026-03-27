package org.foodos.coupon.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.foodos.common.entity.BaseSoftDeleteEntity;
import org.foodos.restaurant.entity.Restaurant;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.SQLDelete;

@Entity
@Table(name = "coupon_restaurant_mappings",
        uniqueConstraints = @UniqueConstraint(name = "uk_coupon_restaurant", columnNames = {"coupon_id", "restaurant_id"}),
        indexes = {
                @Index(name = "idx_coupon_restaurant_coupon_id", columnList = "coupon_id"),
                @Index(name = "idx_coupon_restaurant_restaurant_id", columnList = "restaurant_id")
        })
@SQLDelete(sql = "UPDATE coupon_restaurant_mappings SET is_deleted = true, deleted_at = now() WHERE id = ?")
@Filter(name = "deletedFilter", condition = "is_deleted = :isDeleted")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class CouponRestaurantMapping extends BaseSoftDeleteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "coupon_id", nullable = false)
    private Coupon coupon;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;
}
