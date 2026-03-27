package org.foodos.order.repository;

import org.foodos.order.entity.OrderItem;
import org.foodos.order.entity.enums.KotStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Pageable;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Order Item Repository
 */
@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    Optional<OrderItem> findByOrderItemUuidAndIsDeletedFalse(String orderItemUuid);

    @Query("SELECT oi FROM OrderItem oi WHERE oi.order.id = :orderId AND oi.isDeleted = false")
    List<OrderItem> findByOrderId(@Param("orderId") Long orderId);

    @Query("SELECT oi FROM OrderItem oi WHERE oi.order.id = :orderId AND oi.isCancelled = false AND oi.isDeleted = false")
    List<OrderItem> findActiveItemsByOrderId(@Param("orderId") Long orderId);

    @Query("SELECT oi FROM OrderItem oi WHERE oi.order.id = :orderId AND oi.kotStatus = :kotStatus AND oi.isCancelled = false AND oi.isDeleted = false")
    List<OrderItem> findByOrderIdAndKotStatus(@Param("orderId") Long orderId, @Param("kotStatus") KotStatus kotStatus);

    @Query("SELECT oi FROM OrderItem oi WHERE oi.product.id = :productId AND oi.order.orderDate >= :startDate AND oi.isCancelled = false AND oi.isDeleted = false")
    List<OrderItem> findRecentOrderItemsByProduct(@Param("productId") Long productId, @Param("startDate") LocalDate startDate);


    /**
     * Returns [productName, SUM(quantity), SUM(lineTotal)] for non-cancelled items
     * within the given date range, grouped by product name, ordered by quantity desc.
     */
    @Query("SELECT oi.productName, SUM(oi.quantity), SUM(oi.lineTotal) " +
            "FROM OrderItem oi " +
            "WHERE oi.order.restaurant.restaurantUuid = :restaurantUuid " +
            "  AND oi.order.orderDate BETWEEN :startDate AND :endDate " +
            "  AND oi.isCancelled = false " +
            "  AND oi.isDeleted = false " +
            "GROUP BY oi.productName " +
            "ORDER BY SUM(oi.quantity) DESC")
    List<Object[]> findTopSellingItems(
            @Param("restaurantUuid") String restaurantUuid,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable
    );

    /**
    * Returns today's orders for a restaurant so we can group by hour in Java.
    * (Reuses the existing query pattern — no new query needed for hourly data.)
    */
}

