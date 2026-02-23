package org.foodos.order.service;

import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.order.dto.request.*;
import org.foodos.order.dto.response.KotResponse;
import org.foodos.order.dto.response.OrderResponse;
import org.foodos.order.entity.Order;
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
    Page<OrderResponse> getOrdersByRestaurant(String restaurantUuid, Pageable pageable);

    /**
     * Get orders by restaurant and status
     */
    Page<OrderResponse> getOrdersByRestaurantAndStatus(String restaurantUuid, OrderStatus status, Pageable pageable);

    /**
     * Get orders by restaurant and date
     */
    List<OrderResponse> getOrdersByRestaurantAndDate(String restaurantUuid, LocalDate orderDate);

    /**
     * Get orders by restaurant, date, and order type
     */
    List<OrderResponse> getOrdersByRestaurantDateAndType(String restaurantUuid, LocalDate orderDate, OrderType orderType);

    /**
     * Search orders
     */
    Page<OrderResponse> searchOrders(String restaurantUuid, String searchTerm, Pageable pageable);

    /**
     * Get active orders (for dashboard)
     */
    List<OrderResponse> getActiveOrders(String restaurantUuid);

    /**
     * Get kitchen orders (for kitchen display)
     */
    List<KotResponse> getKitchenOrders(String restaurantUuid , UserAuthEntity user);

    /**
     * Get orders with pending payments
     */
    List<OrderResponse> getOrdersWithPendingPayments(String restaurantUuid);

    /**
     * Get active order for a table
     */
    OrderResponse getActiveOrderByTable(String tableUuid);

    /**
     * Get waiter's active orders
     */
    List<OrderResponse> getWaiterActiveOrders(Long waiterId, LocalDate orderDate);

    // ===== STATISTICS =====

    /**
     * Get total orders count for a date
     */
    Long getTotalOrdersCount(String restaurantUuid, LocalDate orderDate);

    /**
     * Get total sales for a date
     */
    BigDecimal getTotalSales(String restaurantUuid, LocalDate orderDate);

    /**
     * Get average order value
     */
    BigDecimal getAverageOrderValue(String restaurantUuid, LocalDate orderDate);

    Order createEmptyOrder(CreateOrderRequest orderRequest, Long userId);

    KotResponse updateKotStatus(String kotUuid, String newStatus);

    Order getOrderEntityByUuid(String currentOrderId);
}

