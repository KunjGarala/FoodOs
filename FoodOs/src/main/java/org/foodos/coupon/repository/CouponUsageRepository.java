package org.foodos.coupon.repository;

import org.foodos.coupon.entity.CouponUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;

@Repository
public interface CouponUsageRepository extends JpaRepository<CouponUsage, Long> {

    long countByCouponIdAndIsDeletedFalse(Long couponId);

    long countByCouponIdAndCustomerIdAndIsDeletedFalse(Long couponId, Long customerId);

    boolean existsByCouponIdAndOrderIdAndIsDeletedFalse(Long couponId, Long orderId);

    Optional<CouponUsage> findByCouponIdAndOrderIdAndIsDeletedFalse(Long couponId, Long orderId);

    @Query("SELECT COUNT(cu) FROM CouponUsage cu WHERE cu.coupon.id = :couponId AND cu.order.id = :orderId AND cu.isDeleted = false")
    long countUsageForOrder(@Param("couponId") Long couponId, @Param("orderId") Long orderId);

    @Query("SELECT COALESCE(SUM(cu.discountApplied), 0) FROM CouponUsage cu WHERE cu.coupon.id = :couponId AND cu.isDeleted = false")
    BigDecimal sumDiscountByCouponId(@Param("couponId") Long couponId);
}
