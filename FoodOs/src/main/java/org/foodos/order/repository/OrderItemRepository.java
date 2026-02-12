package org.foodos.order.repository;

import org.foodos.order.entity.OrderItem;
import org.foodos.order.entity.enums.KotStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

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
}

