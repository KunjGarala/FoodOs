package org.foodos.coupon.repository;

import org.foodos.coupon.entity.CouponRestaurantMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CouponRestaurantMappingRepository extends JpaRepository<CouponRestaurantMapping, Long> {

    boolean existsByCouponIdAndRestaurantIdAndIsDeletedFalse(Long couponId, Long restaurantId);

    List<CouponRestaurantMapping> findByCouponIdAndIsDeletedFalse(Long couponId);

    @Query("SELECT crm.restaurant.id FROM CouponRestaurantMapping crm WHERE crm.coupon.id = :couponId AND crm.isDeleted = false")
    List<Long> findRestaurantIdsByCouponId(@Param("couponId") Long couponId);

    @Modifying
    @Query("UPDATE CouponRestaurantMapping crm SET crm.isDeleted = true, crm.deletedAt = CURRENT_TIMESTAMP WHERE crm.coupon.id = :couponId")
    void softDeleteByCouponId(@Param("couponId") Long couponId);
}
