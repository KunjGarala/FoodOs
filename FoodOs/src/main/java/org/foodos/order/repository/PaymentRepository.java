package org.foodos.order.repository;

import org.foodos.order.entity.Payment;
import org.foodos.order.entity.enums.PaymentMethod;
import org.foodos.order.entity.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Payment Repository
 */
@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByPaymentUuidAndIsDeletedFalse(String paymentUuid);

    Optional<Payment> findByTransactionIdAndIsDeletedFalse(String transactionId);

    @Query("SELECT p FROM Payment p WHERE p.order.id = :orderId AND p.isDeleted = false ORDER BY p.paymentDate DESC")
    List<Payment> findByOrderId(@Param("orderId") Long orderId);

    @Query("SELECT p FROM Payment p WHERE p.order.id = :orderId AND p.status = 'COMPLETED' AND p.isDeleted = false")
    List<Payment> findCompletedPaymentsByOrderId(@Param("orderId") Long orderId);

    @Query("SELECT p FROM Payment p WHERE p.order.restaurant.id = :restaurantId AND DATE(p.paymentDate) = :paymentDate AND p.status = 'COMPLETED' AND p.isDeleted = false ORDER BY p.paymentDate DESC")
    List<Payment> findByRestaurantAndDate(@Param("restaurantId") Long restaurantId, @Param("paymentDate") LocalDate paymentDate);

    @Query("SELECT p FROM Payment p WHERE p.order.restaurant.id = :restaurantId AND p.paymentDate BETWEEN :startDate AND :endDate AND p.status = 'COMPLETED' AND p.isDeleted = false ORDER BY p.paymentDate DESC")
    Page<Payment> findByRestaurantAndDateRange(@Param("restaurantId") Long restaurantId,
                                                 @Param("startDate") LocalDateTime startDate,
                                                 @Param("endDate") LocalDateTime endDate,
                                                 Pageable pageable);

    @Query("SELECT p FROM Payment p WHERE p.order.restaurant.id = :restaurantId AND p.paymentMethod = :paymentMethod AND DATE(p.paymentDate) = :paymentDate AND p.status = 'COMPLETED' AND p.isDeleted = false")
    List<Payment> findByRestaurantAndPaymentMethodAndDate(@Param("restaurantId") Long restaurantId,
                                                            @Param("paymentMethod") PaymentMethod paymentMethod,
                                                            @Param("paymentDate") LocalDate paymentDate);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.order.restaurant.id = :restaurantId AND DATE(p.paymentDate) = :paymentDate AND p.status = 'COMPLETED' AND p.isDeleted = false")
    BigDecimal calculateTotalPaymentsByRestaurantAndDate(@Param("restaurantId") Long restaurantId, @Param("paymentDate") LocalDate paymentDate);

    @Query("SELECT p.paymentMethod, COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.order.restaurant.id = :restaurantId AND DATE(p.paymentDate) = :paymentDate AND p.status = 'COMPLETED' AND p.isDeleted = false GROUP BY p.paymentMethod")
    List<Object[]> calculatePaymentsSummaryByMethod(@Param("restaurantId") Long restaurantId, @Param("paymentDate") LocalDate paymentDate);

    @Query("SELECT p FROM Payment p WHERE p.collectedBy.id = :userId AND DATE(p.paymentDate) = :paymentDate AND p.status = 'COMPLETED' AND p.isDeleted = false")
    List<Payment> findByCollectorAndDate(@Param("userId") Long userId, @Param("paymentDate") LocalDate paymentDate);

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.order.restaurant.id = :restaurantId AND DATE(p.paymentDate) = :paymentDate AND p.status = 'COMPLETED' AND p.isDeleted = false")
    Long countPaymentsByRestaurantAndDate(@Param("restaurantId") Long restaurantId, @Param("paymentDate") LocalDate paymentDate);
}

