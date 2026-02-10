package org.foodos.order.service;

import org.foodos.order.dto.request.*;
import org.foodos.order.dto.response.OrderResponse;
import org.foodos.order.entity.enums.OrderStatus;
import org.foodos.order.entity.enums.OrderType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Order Service Interface
 * Defines business operations for order management
 */
public interface OrderService {

    // ===== CRUD OPERATIONS =====

    /**
     * Create a new order
     */
    OrderResponse createOrder(CreateOrderRequest request, Long currentUserId);

    /**
     * Get order by UUID
     */
    OrderResponse getOrderByUuid(String orderUuid);

    /**
     * Get order by ID
     */
    OrderResponse getOrderById(Long orderId);

    /**
     * Update an existing order
     */
    OrderResponse updateOrder(String orderUuid, UpdateOrderRequest request, Long currentUserId);

    /**
     * Delete an order (soft delete)
     */
    void deleteOrder(String orderUuid, Long currentUserId);

    // ===== ORDER LIFECYCLE =====

    /**
     * Change order status
     */
    OrderResponse changeOrderStatus(String orderUuid, OrderStatus newStatus, Long currentUserId);

    /**
     * Cancel an order
     */
    OrderResponse cancelOrder(String orderUuid, String cancellationReason, Long currentUserId);

    /**
     * Complete an order
     */
    OrderResponse completeOrder(String orderUuid, Long currentUserId);

    // ===== ORDER ITEMS =====

    /**
     * Add items to existing order
     */
    OrderResponse addItemsToOrder(String orderUuid, List<OrderItemRequest> items, Long currentUserId);

    /**
     * Remove item from order
     */
    OrderResponse removeItemFromOrder(String orderUuid, String orderItemUuid, Long currentUserId);

    /**
     * Cancel an order item
     */
    OrderResponse cancelOrderItem(String orderUuid, String orderItemUuid, CancelOrderItemRequest request, Long currentUserId);

    // ===== KITCHEN ORDER TICKETS =====

    /**
     * Send KOT to kitchen
     */
    OrderResponse sendKot(String orderUuid, SendKotRequest request, Long currentUserId);

    /**
     * Send all pending items to kitchen
     */
    OrderResponse sendAllPendingItemsToKitchen(String orderUuid, Long currentUserId);

    // ===== PAYMENTS =====

    /**
     * Add payment to order
     */
    OrderResponse addPayment(String orderUuid, AddPaymentRequest request, Long currentUserId);

    /**
     * Generate bill for order
     */
    OrderResponse generateBill(String orderUuid, Long currentUserId);

    // ===== QUERY OPERATIONS =====

    /**
     * Get all orders for a restaurant with pagination
     */
    Page<OrderResponse> getOrdersByRestaurant(Long restaurantId, Pageable pageable);

    /**
     * Get orders by restaurant and status
     */
    Page<OrderResponse> getOrdersByRestaurantAndStatus(Long restaurantId, OrderStatus status, Pageable pageable);

    /**
     * Get orders by restaurant and date
     */
    List<OrderResponse> getOrdersByRestaurantAndDate(Long restaurantId, LocalDate orderDate);

    /**
     * Get orders by restaurant, date, and order type
     */
    List<OrderResponse> getOrdersByRestaurantDateAndType(Long restaurantId, LocalDate orderDate, OrderType orderType);

    /**
     * Search orders
     */
    Page<OrderResponse> searchOrders(Long restaurantId, String searchTerm, Pageable pageable);

    /**
     * Get active orders (for dashboard)
     */
    List<OrderResponse> getActiveOrders(Long restaurantId);

    /**
     * Get kitchen orders (for kitchen display)
     */
    List<OrderResponse> getKitchenOrders(Long restaurantId);

    /**
     * Get orders with pending payments
     */
    List<OrderResponse> getOrdersWithPendingPayments(Long restaurantId);

    /**
     * Get active order for a table
     */
    OrderResponse getActiveOrderByTable(Long tableId);

    /**
     * Get waiter's active orders
     */
    List<OrderResponse> getWaiterActiveOrders(Long waiterId, LocalDate orderDate);

    // ===== STATISTICS =====

    /**
     * Get total orders count for a date
     */
    Long getTotalOrdersCount(Long restaurantId, LocalDate orderDate);

    /**
     * Get total sales for a date
     */
    BigDecimal getTotalSales(Long restaurantId, LocalDate orderDate);

    /**
     * Get average order value
     */
    BigDecimal getAverageOrderValue(Long restaurantId, LocalDate orderDate);
}

