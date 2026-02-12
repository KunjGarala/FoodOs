package org.foodos.order.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.order.dto.request.*;
import org.foodos.order.dto.response.OrderResponse;
import org.foodos.order.entity.enums.OrderStatus;
import org.foodos.order.service.OrderService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Order Controller
 * REST API for order management
 *
 * NOTE: This is a template controller showing best practices:
 * 1. Swagger/OpenAPI documentation
 * 2. Validation
 * 3. Security annotations
 * 4. Proper HTTP status codes
 * 5. RESTful design
 *
 * You need to:
 * - Add proper security context to get current user
 * - Add global exception handler
 * - Customize as per your authentication mechanism
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Tag(name = "Order Management", description = "APIs for managing restaurant orders")
public class OrderController {

    private final OrderService orderService;

    // ===== CREATE ORDER =====

    @Operation(
        summary = "Create a new order",
        description = "Creates a new order with items, calculates totals, and optionally sends KOT to kitchen"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Order created successfully",
            content = @Content(schema = @Schema(implementation = OrderResponse.class))),
        @ApiResponse(responseCode = "400", description = "Invalid request data"),
        @ApiResponse(responseCode = "404", description = "Restaurant, table, or product not found"),
        @ApiResponse(responseCode = "409", description = "Table already occupied")
    })
    @PostMapping
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'WAITER')")
    public ResponseEntity<OrderResponse> createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            @AuthenticationPrincipal UserAuthEntity currentUser) {

        log.info("REST: Creating order for restaurant: {}", request.getRestaurantId());
        OrderResponse response = orderService.createOrder(request, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ===== GET ORDER =====

    @Operation(summary = "Get order by UUID", description = "Retrieves complete order details by UUID")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Order found",
            content = @Content(schema = @Schema(implementation = OrderResponse.class))),
        @ApiResponse(responseCode = "404", description = "Order not found")
    })
    @GetMapping("/{orderUuid}")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'CHEF')")
    public ResponseEntity<OrderResponse> getOrder(
            @Parameter(description = "Order UUID", example = "550e8400-e29b-41d4-a716-446655440000")
            @PathVariable String orderUuid) {

        log.info("REST: Fetching order: {}", orderUuid);
        OrderResponse response = orderService.getOrderByUuid(orderUuid);
        return ResponseEntity.ok(response);
    }

    // ===== UPDATE ORDER =====

    @Operation(summary = "Update an order", description = "Updates order details, adds/removes items")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Order updated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request or order cannot be modified"),
        @ApiResponse(responseCode = "404", description = "Order not found")
    })
    @PutMapping("/{orderUuid}")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'WAITER')")
    public ResponseEntity<OrderResponse> updateOrder(
            @PathVariable String orderUuid,
            @Valid @RequestBody UpdateOrderRequest request,
            @AuthenticationPrincipal UserAuthEntity currentUser) {

        log.info("REST: Updating order: {}", orderUuid);
        OrderResponse response = orderService.updateOrder(orderUuid, request, currentUser.getId());
        return ResponseEntity.ok(response);
    }

    // ===== DELETE ORDER =====

    @Operation(summary = "Delete an order", description = "Soft deletes an order")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Order deleted successfully"),
        @ApiResponse(responseCode = "404", description = "Order not found"),
        @ApiResponse(responseCode = "409", description = "Order cannot be deleted in current status")
    })
    @DeleteMapping("/{orderUuid}")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'WAITER')")
    public ResponseEntity<Void> deleteOrder(@PathVariable String orderUuid,
                                            @AuthenticationPrincipal UserAuthEntity currentUser) {
        log.info("REST: Deleting order: {}", orderUuid);
        orderService.deleteOrder(orderUuid, currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    // ===== CHANGE ORDER STATUS =====

    @Operation(summary = "Change order status", description = "Transitions order to a new status")
    @PatchMapping("/{orderUuid}/status")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'CHEF')")
    public ResponseEntity<OrderResponse> changeOrderStatus(
            @PathVariable String orderUuid,
            @RequestParam OrderStatus newStatus,
            @AuthenticationPrincipal UserAuthEntity currentUser) {

        log.info("REST: Changing order {} status to: {}", orderUuid, newStatus);
        OrderResponse response = orderService.changeOrderStatus(orderUuid, newStatus, currentUser.getId());
        return ResponseEntity.ok(response);
    }

    // ===== CANCEL ORDER =====

    @Operation(summary = "Cancel an order", description = "Cancels an order with reason")
    @PostMapping("/{orderUuid}/cancel")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
    public ResponseEntity<OrderResponse> cancelOrder(
            @PathVariable String orderUuid,
            @RequestParam String cancellationReason,
            @AuthenticationPrincipal UserAuthEntity currentUser) {

        log.info("REST: Cancelling order: {}", orderUuid);
        OrderResponse response = orderService.cancelOrder(orderUuid, cancellationReason, currentUser.getId());
        return ResponseEntity.ok(response);
    }

    // ===== COMPLETE ORDER =====

    @Operation(summary = "Complete an order", description = "Marks order as completed")
    @PostMapping("/{orderUuid}/complete")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'CASHIER')")
    public ResponseEntity<OrderResponse> completeOrder(@PathVariable String orderUuid,
                                                       @AuthenticationPrincipal UserAuthEntity currentUser) {
        log.info("REST: Completing order: {}", orderUuid);
        OrderResponse response = orderService.completeOrder(orderUuid, currentUser.getId());
        return ResponseEntity.ok(response);
    }

    // ===== ORDER ITEMS =====

    @Operation(summary = "Add items to order", description = "Adds new items to an existing order")
    @PostMapping("/{orderUuid}/items")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'WAITER')")
    public ResponseEntity<OrderResponse> addItems(
            @PathVariable String orderUuid,
            @Valid @RequestBody List<OrderItemRequest> items,
            @AuthenticationPrincipal UserAuthEntity currentUser) {

        log.info("REST: Adding {} items to order: {}", items.size(), orderUuid);
        OrderResponse response = orderService.addItemsToOrder(orderUuid, items, currentUser.getId());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Remove item from order", description = "Removes an item from order")
    @DeleteMapping("/{orderUuid}/items/{itemUuid}")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'WAITER')")
    public ResponseEntity<OrderResponse> removeItem(
            @PathVariable String orderUuid,
            @PathVariable String itemUuid,
            @AuthenticationPrincipal UserAuthEntity currentUser) {

        log.info("REST: Removing item {} from order: {}", itemUuid, orderUuid);
        OrderResponse response = orderService.removeItemFromOrder(orderUuid, itemUuid, currentUser.getId());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Cancel order item", description = "Cancels an order item with reason")
    @PostMapping("/{orderUuid}/items/{itemUuid}/cancel")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'WAITER')")
    public ResponseEntity<OrderResponse> cancelItem(
            @PathVariable String orderUuid,
            @PathVariable String itemUuid,
            @Valid @RequestBody CancelOrderItemRequest request,
            @AuthenticationPrincipal UserAuthEntity currentUser) {

        log.info("REST: Cancelling item {} from order: {}", itemUuid, orderUuid);
        OrderResponse response = orderService.cancelOrderItem(orderUuid, itemUuid, request, currentUser.getId());
        return ResponseEntity.ok(response);
    }

    // ===== KITCHEN ORDER TICKETS =====

    @Operation(summary = "Send KOT to kitchen", description = "Sends selected items to kitchen as KOT")
    @PostMapping("/{orderUuid}/kot")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'WAITER')")
    public ResponseEntity<OrderResponse> sendKot(
            @PathVariable String orderUuid,
            @Valid @RequestBody SendKotRequest request,
            @AuthenticationPrincipal UserAuthEntity currentUser) {

        log.info("REST: Sending KOT for order: {}", orderUuid);
        OrderResponse response = orderService.sendKot(orderUuid, request, currentUser.getId());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Send all pending items to kitchen",
               description = "Sends all pending items in order to kitchen")
    @PostMapping("/{orderUuid}/kot/all")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'WAITER')")
    public ResponseEntity<OrderResponse> sendAllPendingItems(@PathVariable String orderUuid,
                                                             @AuthenticationPrincipal UserAuthEntity currentUser) {
        log.info("REST: Sending all pending items for order: {}", orderUuid);
        OrderResponse response = orderService.sendAllPendingItemsToKitchen(orderUuid, currentUser.getId());
        return ResponseEntity.ok(response);
    }

    // ===== PAYMENTS =====

    @Operation(summary = "Add payment to order", description = "Records a payment transaction for order")
    @PostMapping("/{orderUuid}/payments")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'CASHIER')")
    public ResponseEntity<OrderResponse> addPayment(
            @PathVariable String orderUuid,
            @Valid @RequestBody AddPaymentRequest request,
            @AuthenticationPrincipal UserAuthEntity currentUser) {

        log.info("REST: Adding payment to order: {}", orderUuid);
        OrderResponse response = orderService.addPayment(orderUuid, request, currentUser.getId());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Generate bill", description = "Generates bill for order")
    @PostMapping("/{orderUuid}/bill")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'CASHIER')")
    public ResponseEntity<OrderResponse> generateBill(@PathVariable String orderUuid,
                                                      @AuthenticationPrincipal UserAuthEntity currentUser) {
        log.info("REST: Generating bill for order: {}", orderUuid);
        OrderResponse response = orderService.generateBill(orderUuid, currentUser.getId());
        return ResponseEntity.ok(response);
    }

    // ===== QUERY OPERATIONS =====

    @Operation(summary = "List orders by restaurant",
               description = "Gets paginated list of orders for a restaurant")
    @GetMapping("/restaurant/{restaurantId}")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'CASHIER')")
    public ResponseEntity<Page<OrderResponse>> getOrdersByRestaurant(
            @PathVariable Long restaurantId,
            @PageableDefault(size = 20, sort = "orderTime", direction = Sort.Direction.DESC) Pageable pageable) {

        log.info("REST: Fetching orders for restaurant: {}", restaurantId);
        Page<OrderResponse> orders = orderService.getOrdersByRestaurant(restaurantId, pageable);
        return ResponseEntity.ok(orders);
    }

    @Operation(summary = "Get active orders", description = "Gets all active orders for restaurant (dashboard)")
    @GetMapping("/restaurant/{restaurantId}/active")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'WAITER')")
    public ResponseEntity<List<OrderResponse>> getActiveOrders(@PathVariable Long restaurantId) {
        log.info("REST: Fetching active orders for restaurant: {}", restaurantId);
        List<OrderResponse> orders = orderService.getActiveOrders(restaurantId);
        return ResponseEntity.ok(orders);
    }

    @Operation(summary = "Get kitchen orders", description = "Gets orders in kitchen for KDS")
    @GetMapping("/restaurant/{restaurantId}/kitchen")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'CHEF')")
    public ResponseEntity<List<OrderResponse>> getKitchenOrders(@PathVariable Long restaurantId) {
        log.info("REST: Fetching kitchen orders for restaurant: {}", restaurantId);
        List<OrderResponse> orders = orderService.getKitchenOrders(restaurantId);
        return ResponseEntity.ok(orders);
    }

    @Operation(summary = "Search orders", description = "Searches orders by number, customer name, or phone")
    @GetMapping("/search")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'WAITER')")
    public ResponseEntity<Page<OrderResponse>> searchOrders(
            @RequestParam Long restaurantId,
            @RequestParam String searchTerm,
            @PageableDefault(size = 20) Pageable pageable) {

        log.info("REST: Searching orders: {}", searchTerm);
        Page<OrderResponse> orders = orderService.searchOrders(restaurantId, searchTerm, pageable);
        return ResponseEntity.ok(orders);
    }

    @Operation(summary = "Get orders by date", description = "Gets all orders for a specific date")
    @GetMapping("/restaurant/{restaurantId}/date/{date}")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'CASHIER')")
    public ResponseEntity<List<OrderResponse>> getOrdersByDate(
            @PathVariable Long restaurantId,
            @PathVariable LocalDate date) {

        log.info("REST: Fetching orders for date: {}", date);
        List<OrderResponse> orders = orderService.getOrdersByRestaurantAndDate(restaurantId, date);
        return ResponseEntity.ok(orders);
    }

    @Operation(summary = "Get orders with pending payments",
               description = "Gets orders that have pending balance")
    @GetMapping("/restaurant/{restaurantId}/pending-payments")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'CASHIER')")
    public ResponseEntity<List<OrderResponse>> getOrdersWithPendingPayments(
            @PathVariable Long restaurantId) {

        log.info("REST: Fetching orders with pending payments");
        List<OrderResponse> orders = orderService.getOrdersWithPendingPayments(restaurantId);
        return ResponseEntity.ok(orders);
    }

    @Operation(summary = "Get active order by table", description = "Gets current active order for a table")
    @GetMapping("/table/{tableId}/active")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'WAITER')")
    public ResponseEntity<OrderResponse> getActiveOrderByTable(@PathVariable Long tableId) {
        log.info("REST: Fetching active order for table: {}", tableId);
        OrderResponse order = orderService.getActiveOrderByTable(tableId);
        return ResponseEntity.ok(order);
    }

    // ===== STATISTICS =====

    @Operation(summary = "Get total orders count", description = "Gets count of orders for a date")
    @GetMapping("/restaurant/{restaurantId}/stats/count")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
    public ResponseEntity<Long> getTotalOrdersCount(
            @PathVariable Long restaurantId,
            @RequestParam LocalDate date) {

        Long count = orderService.getTotalOrdersCount(restaurantId, date);
        return ResponseEntity.ok(count);
    }

    @Operation(summary = "Get total sales", description = "Gets total sales amount for a date")
    @GetMapping("/restaurant/{restaurantId}/stats/sales")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
    public ResponseEntity<BigDecimal> getTotalSales(
            @PathVariable Long restaurantId,
            @RequestParam LocalDate date) {

        BigDecimal sales = orderService.getTotalSales(restaurantId, date);
        return ResponseEntity.ok(sales);
    }

    @Operation(summary = "Get average order value", description = "Gets average order value for a date")
    @GetMapping("/restaurant/{restaurantId}/stats/average")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
    public ResponseEntity<BigDecimal> getAverageOrderValue(
            @PathVariable Long restaurantId,
            @RequestParam LocalDate date) {

        BigDecimal average = orderService.getAverageOrderValue(restaurantId, date);
        return ResponseEntity.ok(average);
    }
}

