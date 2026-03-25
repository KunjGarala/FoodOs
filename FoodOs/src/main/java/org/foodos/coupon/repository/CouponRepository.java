package org.foodos.coupon.repository;

import org.foodos.coupon.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {

    Optional<Coupon> findByCouponUuidAndIsDeletedFalse(String couponUuid);

    Optional<Coupon> findByCodeIgnoreCaseAndIsDeletedFalse(String code);

    boolean existsByCodeIgnoreCaseAndIsDeletedFalse(String code);

    Page<Coupon> findAllByIsDeletedFalse(Pageable pageable);

    @Query("SELECT c FROM Coupon c LEFT JOIN c.ownerRestaurant r WHERE c.isDeleted = false AND (r.restaurantUuid = :restaurantUuid OR c.scopeType = :globalScope)")
    Page<Coupon> findAllRelevantForRestaurant(@Param("restaurantUuid") String restaurantUuid, @Param("globalScope") org.foodos.coupon.entity.enums.CouponScopeType globalScope, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Coupon c WHERE LOWER(c.code) = LOWER(:code) AND c.isDeleted = false")
    Optional<Coupon> findByCodeIgnoreCaseForUpdate(@Param("code") String code);

    @Query("SELECT c FROM Coupon c WHERE c.isDeleted = false AND c.isActive = true AND c.startDate <= :now AND c.endDate >= :now")
    List<Coupon> findActiveCoupons(@Param("now") LocalDateTime now);
}
