package org.foodos.order.repository;

import org.foodos.order.entity.Order;
import org.foodos.order.entity.enums.OrderStatus;
import org.foodos.order.entity.enums.OrderType;
import org.foodos.restaurant.entity.Restaurant;
import org.foodos.restaurant.entity.RestaurantTable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Order Repository
 * Production-grade with custom queries, pagination, and performance optimizations
 */
@Repository
public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {

    // ===== BASIC FINDERS =====

    Optional<Order> findByOrderUuidAndIsDeletedFalse(String orderUuid);

    Optional<Order> findByOrderNumberAndIsDeletedFalse(String orderNumber);

    Optional<Order> findByIdAndIsDeletedFalse(Long id);

    // ===== RESTAURANT & TABLE QUERIES =====

    @Query("SELECT o FROM Order o WHERE o.restaurant.id = :restaurantId AND o.isDeleted = false")
    Page<Order> findByRestaurant(@Param("restaurantId") Long restaurantId, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.table.id = :tableId AND o.status NOT IN :excludeStatuses AND o.isDeleted = false")
    Optional<Order> findActiveOrderByTable(@Param("tableId") Long tableId, @Param("excludeStatuses") List<OrderStatus> excludeStatuses);

    @Query("SELECT o FROM Order o WHERE o.table.id = :tableId AND o.status = :status AND o.isDeleted = false")
    Optional<Order> findByTableAndStatus(@Param("tableId") Long tableId, @Param("status") OrderStatus status);

    // ===== STATUS QUERIES =====

    @Query("SELECT o FROM Order o WHERE o.restaurant.id = :restaurantId AND o.status = :status AND o.isDeleted = false")
    List<Order> findByRestaurantAndStatus(@Param("restaurantId") Long restaurantId, @Param("status") OrderStatus status);

    @Query("SELECT o FROM Order o WHERE o.restaurant.id = :restaurantId AND o.status IN :statuses AND o.isDeleted = false ORDER BY o.orderTime DESC")
    Page<Order> findByRestaurantAndStatusIn(@Param("restaurantId") Long restaurantId, @Param("statuses") List<OrderStatus> statuses, Pageable pageable);

    // ===== DATE RANGE QUERIES =====

    @Query("SELECT o FROM Order o WHERE o.restaurant.id = :restaurantId AND o.orderDate = :orderDate AND o.isDeleted = false ORDER BY o.orderTime DESC")
    List<Order> findByRestaurantAndOrderDate(@Param("restaurantId") Long restaurantId, @Param("orderDate") LocalDate orderDate);

    @Query("SELECT o FROM Order o WHERE o.restaurant.id = :restaurantId AND o.orderDate BETWEEN :startDate AND :endDate AND o.isDeleted = false ORDER BY o.orderTime DESC")
    Page<Order> findByRestaurantAndOrderDateBetween(@Param("restaurantId") Long restaurantId,
                                                      @Param("startDate") LocalDate startDate,
                                                      @Param("endDate") LocalDate endDate,
                                                      Pageable pageable);

    // ===== ORDER TYPE QUERIES =====

    @Query("SELECT o FROM Order o WHERE o.restaurant.id = :restaurantId AND o.orderType = :orderType AND o.orderDate = :orderDate AND o.isDeleted = false")
    List<Order> findByRestaurantAndOrderTypeAndOrderDate(@Param("restaurantId") Long restaurantId,
                                                           @Param("orderType") OrderType orderType,
                                                           @Param("orderDate") LocalDate orderDate);

    // ===== SEARCH QUERIES =====

    @Query("SELECT o FROM Order o WHERE o.restaurant.id = :restaurantId AND " +
           "(LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(o.customerName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(o.customerPhone) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) AND " +
           "o.isDeleted = false ORDER BY o.orderTime DESC")
    Page<Order> searchOrders(@Param("restaurantId") Long restaurantId, @Param("searchTerm") String searchTerm, Pageable pageable);

    // ===== FETCH WITH ASSOCIATIONS (Solve N+1 problem) =====

    @Query("SELECT DISTINCT o FROM Order o " +
           "LEFT JOIN FETCH o.items i " +
           "LEFT JOIN FETCH i.modifiers " +
           "WHERE o.orderUuid = :orderUuid AND o.isDeleted = false")
    Optional<Order> findByOrderUuidWithItems(@Param("orderUuid") String orderUuid);

    @Query("SELECT DISTINCT o FROM Order o " +
           "LEFT JOIN FETCH o.items " +
           "LEFT JOIN FETCH o.payments " +
           "LEFT JOIN FETCH o.kitchenOrderTickets " +
           "WHERE o.id = :orderId AND o.isDeleted = false")
    Optional<Order> findByIdWithFullDetails(@Param("orderId") Long orderId);

    // ===== STATISTICS QUERIES =====

    @Query("SELECT COUNT(o) FROM Order o WHERE o.restaurant.id = :restaurantId AND o.orderDate = :orderDate AND o.status <> 'CANCELLED' AND o.isDeleted = false")
    Long countOrdersByRestaurantAndDate(@Param("restaurantId") Long restaurantId, @Param("orderDate") LocalDate orderDate);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.restaurant.id = :restaurantId AND o.orderDate = :orderDate AND o.status IN ('PAID', 'COMPLETED') AND o.isDeleted = false")
    BigDecimal calculateTotalSalesByRestaurantAndDate(@Param("restaurantId") Long restaurantId, @Param("orderDate") LocalDate orderDate);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.restaurant.id = :restaurantId AND o.orderTime BETWEEN :startTime AND :endTime AND o.status IN ('PAID', 'COMPLETED') AND o.isDeleted = false")
    BigDecimal calculateTotalSalesByRestaurantAndDateTimeRange(@Param("restaurantId") Long restaurantId,
                                                                 @Param("startTime") LocalDateTime startTime,
                                                                 @Param("endTime") LocalDateTime endTime);

    @Query("SELECT AVG(o.totalAmount) FROM Order o WHERE o.restaurant.id = :restaurantId AND o.orderDate = :orderDate AND o.status IN ('PAID', 'COMPLETED') AND o.isDeleted = false")
    BigDecimal calculateAverageOrderValue(@Param("restaurantId") Long restaurantId, @Param("orderDate") LocalDate orderDate);

    // ===== ORDER NUMBER GENERATION =====

    @Query("SELECT MAX(CAST(SUBSTRING(o.orderNumber, LENGTH(:prefix) + 1) AS integer)) FROM Order o WHERE o.restaurant.id = :restaurantId AND o.orderNumber LIKE CONCAT(:prefix, '%') AND o.orderDate = :orderDate")
    Optional<Integer> findMaxOrderNumberForDate(@Param("restaurantId") Long restaurantId, @Param("prefix") String prefix, @Param("orderDate") LocalDate orderDate);

    // ===== PENDING PAYMENTS =====

    @Query("SELECT o FROM Order o WHERE o.restaurant.id = :restaurantId AND o.balanceAmount > 0 AND o.status NOT IN ('CANCELLED', 'VOID') AND o.isDeleted = false ORDER BY o.orderTime DESC")
    List<Order> findOrdersWithPendingPayments(@Param("restaurantId") Long restaurantId);

    // ===== ACTIVE ORDERS (Dashboard) =====

    @Query("SELECT o FROM Order o WHERE o.restaurant.id = :restaurantId AND o.status IN ('OPEN', 'KOT_SENT', 'IN_PROGRESS', 'READY', 'SERVED', 'BILLED') AND o.isDeleted = false ORDER BY o.orderTime ASC")
    List<Order> findActiveOrders(@Param("restaurantId") Long restaurantId);

    // ===== KITCHEN ORDERS =====

    @Query("SELECT o FROM Order o WHERE o.restaurant.id = :restaurantId AND o.status IN ('KOT_SENT', 'IN_PROGRESS', 'READY') AND o.isDeleted = false ORDER BY o.orderTime ASC")
    List<Order> findKitchenOrders(@Param("restaurantId") Long restaurantId);

    // ===== WAITER ORDERS =====

    @Query("SELECT o FROM Order o WHERE o.waiter.id = :waiterId AND o.orderDate = :orderDate AND o.status NOT IN ('COMPLETED', 'CANCELLED', 'VOID') AND o.isDeleted = false")
    List<Order> findActiveOrdersByWaiter(@Param("waiterId") Long waiterId, @Param("orderDate") LocalDate orderDate);

    // ===== BULK UPDATE =====

    @Modifying
    @Query("UPDATE Order o SET o.isSynced = true, o.syncedAt = :syncedAt WHERE o.id IN :orderIds")
    void markOrdersAsSynced(@Param("orderIds") List<Long> orderIds, @Param("syncedAt") LocalDateTime syncedAt);

    // ===== DELETE =====

    @Modifying
    @Query("UPDATE Order o SET o.isDeleted = true, o.deletedAt = :deletedAt WHERE o.id = :orderId")
    void softDeleteOrder(@Param("orderId") Long orderId, @Param("deletedAt") LocalDateTime deletedAt);

    // ===== EXISTS CHECKS =====

    boolean existsByOrderNumberAndIsDeletedFalse(String orderNumber);

    boolean existsByTableAndStatusNotInAndIsDeletedFalse(RestaurantTable table, List<OrderStatus> statuses);
}

