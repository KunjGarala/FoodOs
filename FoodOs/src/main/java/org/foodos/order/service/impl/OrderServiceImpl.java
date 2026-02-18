package org.foodos.order.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.auth.entity.UserRole;
import org.foodos.auth.repository.UserAuthRepository;
import org.foodos.order.dto.request.*;
import org.foodos.order.dto.response.KotResponse;
import org.foodos.order.dto.response.OrderResponse;
import org.foodos.order.entity.*;
import org.foodos.order.entity.enums.*;
import org.foodos.order.mapper.OrderMapper;
import org.foodos.order.repository.*;
import org.foodos.order.service.OrderService;
import org.foodos.product.entity.Modifier;
import org.foodos.product.entity.Product;
import org.foodos.product.entity.ProductVariation;
import org.foodos.product.repository.ModifierRepo;
import org.foodos.product.repository.ProductRepo;
import org.foodos.product.repository.ProductVariationRepo;
import org.foodos.restaurant.entity.Restaurant;
import org.foodos.restaurant.entity.RestaurantTable;
import org.foodos.restaurant.entity.enums.TableStatus;
import org.foodos.restaurant.repository.RestaurantRepo;
import org.foodos.restaurant.repository.RestaurantTableRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Order Service Implementation
 * Complete business logic for order management
 *
 * NOTE: This is a starter implementation. You'll need to:
 * 1. Add proper error handling
 * 2. Create custom exceptions
 * 3. Add validation logic
 * 4. Implement remaining methods
 * 5. Add event publishing
 * 6. Add caching where appropriate
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final KitchenOrderTicketRepository kitchenOrderTicketRepository;
    private final KotItemRepository kotItemRepository;
    private final PaymentRepository paymentRepository;

    private final RestaurantRepo restaurantRepository;
    private final RestaurantTableRepository tableRepository;
    private final ProductRepo productRepository;
    private final ProductVariationRepo variationRepository;
    private final ModifierRepo modifierRepository;
    private final UserAuthRepository userRepository;

    private final OrderMapper orderMapper;

    // ===== CREATE ORDER =====

    @Override
    public OrderResponse createOrder(CreateOrderRequest request, Long currentUserId) {
        log.info("Creating order for restaurant: {}", request.getRestaurantUuid());

        // 1. Validate and fetch restaurant
        Restaurant restaurant = restaurantRepository.findByRestaurantUuidAndIsDeletedFalse(request.getRestaurantUuid())
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));

        // 2. Create order entity using mapper
        Order order = orderMapper.toOrder(request);
        order.setRestaurant(restaurant);

        // 3. Handle table assignment (for dine-in)
        if (request.getTableUuid() != null) {
            RestaurantTable table = tableRepository.findByTableUuidAndIsDeletedFalse(request.getTableUuid())
                    .orElseThrow(() -> new RuntimeException("Table not found"));
            order.setTable(table);
        }

        // 4. Handle waiter assignment
        if (request.getWaiterUuid() != null) {
            UserAuthEntity waiter = userRepository.findByUserUuidAndIsDeletedFalse(request.getWaiterUuid())
                    .orElseThrow(() -> new RuntimeException("Waiter not found"));
            order.setWaiter(waiter);
        }

        // 5. Generate order number
        String orderNumber = generateOrderNumber(restaurant.getId(), LocalDate.now());
        order.setOrderNumber(orderNumber);

        // 6. Add order items
        for (OrderItemRequest itemRequest : request.getItems()) {
            OrderItem orderItem = createOrderItem(itemRequest, order);
            order.addItem(orderItem);
        }

        // 7. Calculate totals
        order.calculateTotals();

        // 8. Change status to OPEN
        order.setStatus(OrderStatus.OPEN);

        // 9. Save order
        order = orderRepository.save(order);
        log.info("Order created successfully: {}", order.getOrderUuid());

        // 10. Send KOT if requested
        if (Boolean.TRUE.equals(request.getSendKotImmediately())) {
            sendAllPendingItemsToKitchen(order.getOrderUuid(), currentUserId);
        }

        // 11. Update table status if dine-in
        if (order.getTable() != null) {
            RestaurantTable table = order.getTable();
            table.setStatus(TableStatus.OCCUPIED);
            table.setSeatedAt(LocalDateTime.now());
            table.setCurrentOrderUuid(order.getOrderUuid());
            tableRepository.save(table);
            log.info("Table {} marked as OCCUPIED", table.getTableNumber());
        }

        return orderMapper.toOrderResponse(order);
    }

    // ===== GET ORDER =====

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderByUuid(String orderUuid) {
        log.info("Fetching order: {}", orderUuid);

        Order order = orderRepository.findByOrderUuidWithItems(orderUuid)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderUuid));

        return orderMapper.toOrderResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long orderId) {
        Order order = orderRepository.findByIdWithFullDetails(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        return orderMapper.toOrderResponse(order);
    }

    // ===== UPDATE ORDER =====

    @Override
    public OrderResponse updateOrder(String orderUuid, UpdateOrderRequest request, Long currentUserId) {
        log.info("Updating order: {}", orderUuid);

        Order order = orderRepository.findByOrderUuidWithItems(orderUuid)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Check if order can be modified
        if (!order.canBeModified()) {
            throw new RuntimeException("Order cannot be modified in current status: " + order.getStatus());
        }

        // Update basic details
        if (request.getNumberOfGuests() != null) {
            order.setNumberOfGuests(request.getNumberOfGuests());
        }
        if (request.getCustomerName() != null) {
            order.setCustomerName(request.getCustomerName());
        }
        if (request.getCustomerPhone() != null) {
            order.setCustomerPhone(request.getCustomerPhone());
        }
        if (request.getOrderNotes() != null) {
            order.setOrderNotes(request.getOrderNotes());
        }

        // Add new items
        if (request.getItemsToAdd() != null && !request.getItemsToAdd().isEmpty()) {
            for (OrderItemRequest itemRequest : request.getItemsToAdd()) {
                OrderItem newItem = createOrderItem(itemRequest, order);
                order.addItem(newItem);
            }
        }

        // Remove items
        if (request.getItemUuidsToRemove() != null && !request.getItemUuidsToRemove().isEmpty()) {
            for (String itemUuid : request.getItemUuidsToRemove()) {
                OrderItem itemToRemove = order.getItems().stream()
                        .filter(item -> item.getOrderItemUuid().equals(itemUuid))
                        .findFirst()
                        .orElseThrow(() -> new RuntimeException("Order item not found"));
                order.removeItem(itemToRemove);
            }
        }

        // Update discounts
        if (request.getDiscountPercentage() != null) {
            order.setDiscountPercentage(request.getDiscountPercentage());
        }
        if (request.getDiscountAmount() != null) {
            order.setDiscountAmount(request.getDiscountAmount());
        }
        if (request.getTipAmount() != null) {
            order.setTipAmount(request.getTipAmount());
        }

        // Recalculate totals
        order.calculateTotals();

        order = orderRepository.save(order);
        log.info("Order updated successfully: {}", orderUuid);

        return orderMapper.toOrderResponse(order);
    }

    // ===== SEND KOT =====

    @Override
    public OrderResponse sendKot(String orderUuid, SendKotRequest request, Long currentUserId) {
        log.info("Sending KOT for order: {}", orderUuid);

        Order order = orderRepository.findByOrderUuidWithItems(orderUuid)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Generate KOT number
        String kotNumber = generateKotNumber(order.getRestaurant().getId(), LocalDate.now());

        // Create KOT using mapper
        KitchenOrderTicket kot = orderMapper.toKitchenOrderTicket(request);
        kot.setRestaurant(order.getRestaurant());
        kot.setOrder(order);
        kot.setKotNumber(kotNumber);
        kot.setOrderNumber(order.getOrderNumber());
        kot.setTableNumber(order.getTable() != null ? order.getTable().getTableNumber() : null);
        kot.setWaiterName(order.getWaiter() != null ? order.getWaiter().getUsername() : null);

        // Add items to KOT
        for (String itemUuid : request.getOrderItemUuids()) {
            log.info("Looking for itemUuid: [{}]", itemUuid);
            log.info("Available order items:");
            order.getItems().forEach(item -> log.info("  - OrderItemUuid: [{}], Match: {}",
                    item.getOrderItemUuid(),
                    item.getOrderItemUuid() != null
                            && item.getOrderItemUuid().trim().equalsIgnoreCase(itemUuid.trim())));

            OrderItem orderItem = order.getItems().stream()
                    .filter(item -> item.getOrderItemUuid() != null &&
                            item.getOrderItemUuid().trim().equalsIgnoreCase(itemUuid.trim()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Order item not found: " + itemUuid));

            // Create KOT item using mapper
            KotItem kotItem = orderMapper.toKotItem(orderItem);
            kot.addKotItem(kotItem);

            // Update order item status
            orderItem.setKotStatus(KotStatus.FIRED);
            orderItem.setKotPrintedAt(LocalDateTime.now());
            orderItem.setKitchenOrderTicket(kot);
        }

        // Save KOT
        kot.markAsPrinted();
        kitchenOrderTicketRepository.save(kot);
        order.addKitchenOrderTicket(kot);

        // Update order status
        if (order.getStatus() == OrderStatus.OPEN) {
            order.transitionTo(OrderStatus.KOT_SENT);
        }

        orderRepository.save(order);
        log.info("KOT sent successfully: {}", kot.getKotNumber());

        return orderMapper.toOrderResponse(order);
    }

    @Override
    public OrderResponse sendAllPendingItemsToKitchen(String orderUuid, Long currentUserId) {
        Order order = orderRepository.findByOrderUuidWithItems(orderUuid)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        List<String> pendingItemUuids = order.getItems().stream()
                .filter(item -> item.getKotStatus() == KotStatus.PENDING)
                .map(OrderItem::getOrderItemUuid)
                .toList();

        if (pendingItemUuids.isEmpty()) {
            throw new RuntimeException("No pending items to send to kitchen");
        }

        SendKotRequest request = SendKotRequest.builder()
                .orderItemUuids(pendingItemUuids)
                .build();

        return sendKot(orderUuid, request, currentUserId);
    }

    // ===== PAYMENTS =====

    @Override
    public OrderResponse addPayment(String orderUuid, AddPaymentRequest request, Long currentUserId) {
        log.info("Adding payment to order: {}", orderUuid);

        Order order = orderRepository.findByOrderUuidAndIsDeletedFalse(orderUuid)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Validate payment amount
        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Payment amount must be greater than zero");
        }

        // Get current user
        UserAuthEntity collector = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Create payment using mapper
        Payment payment = orderMapper.toPayment(request);
        payment.setOrder(order);
        payment.setCollectedBy(collector);

        order.addPayment(payment);
        order.calculateTotals();
        order.setStatus(OrderStatus.PAID);
        // Check if fully paid
        if (order.isFullyPaid() && order.getStatus() == OrderStatus.BILLED) {
            order.transitionTo(OrderStatus.PAID);
        }

        orderRepository.save(order);
        log.info("Payment added successfully");

        return orderMapper.toOrderResponse(order);
    }

    @Override
    public OrderResponse generateBill(String orderUuid, Long currentUserId) {
        log.info("Generating bill for order: {}", orderUuid);

        Order order = orderRepository.findByOrderUuidAndIsDeletedFalse(orderUuid)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Ensure all items are served or ready
        boolean allItemsReady = order.getActiveItems().stream()
                .allMatch(item -> item.getKotStatus() == KotStatus.SERVED ||
                        item.getKotStatus() == KotStatus.READY ||
                        item.getKotStatus() == KotStatus.FIRED);

        if (!allItemsReady) {
            throw new RuntimeException("Cannot generate bill. Some items are not ready/served");
        }

        // Transition to BILLED
        order.transitionTo(OrderStatus.BILLED);
        order = orderRepository.save(order);

        log.info("Bill generated successfully");
        return orderMapper.toOrderResponse(order);
    }

    // ===== QUERY OPERATIONS =====

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getOrdersByRestaurant(String restaurantUuid, Pageable pageable) {
        Page<Order> orders = orderRepository.findByRestaurantUuid(restaurantUuid, pageable);
        return orders.map(orderMapper::toOrderResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getOrdersByRestaurantAndStatus(String restaurantUuid, OrderStatus status,
            Pageable pageable) {
        Page<Order> orders = orderRepository.findByRestaurantUuidAndStatusIn(restaurantUuid, List.of(status), pageable);
        return orders.map(orderMapper::toOrderResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getActiveOrders(String restaurantUuid) {
        List<Order> orders = orderRepository.findActiveOrdersByRestaurantUuid(restaurantUuid);
        return orderMapper.toOrderResponseList(orders);
    }

    // ===== HELPER METHODS =====

    private OrderItem createOrderItem(OrderItemRequest request, Order order) {
        // Fetch product
        Product product = productRepository.findByProductUuidAndIsDeletedFalse(request.getProductUuid())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // Fetch variation if specified
        ProductVariation variation = null;
        if (request.getVariationUuid() != null) {
            variation = variationRepository.findByVariationUuidAndIsDeletedFalse(request.getVariationUuid())
                    .orElseThrow(() -> new RuntimeException("Product variation not found"));
        }

        // Determine unit price
        BigDecimal unitPrice = request.getUnitPrice() != null ? request.getUnitPrice()
                : (variation != null ? variation.getPrice() : product.getBasePrice());

        // Create order item using mapper
        OrderItem orderItem = orderMapper.toOrderItem(request);
        orderItem.setProduct(product);
        orderItem.setVariation(variation);
        orderItem.setProductName(product.getName());
        orderItem.setVariationName(variation != null ? variation.getName() : null);
        orderItem.setSku(product.getSku());
        orderItem.setUnitPrice(unitPrice);
        orderItem.setCostPrice(product.getCostPrice());

        // Add modifiers
        if (request.getModifiers() != null) {
            for (OrderItemModifierRequest modRequest : request.getModifiers()) {
                Modifier modifier = modifierRepository.findByModifierUuidAndIsDeletedFalse(modRequest.getModifierUuid())
                        .orElseThrow(() -> new RuntimeException("Modifier not found"));

                OrderItemModifier itemModifier = orderMapper.toOrderItemModifier(modRequest);
                itemModifier.setModifier(modifier);
                itemModifier.setModifierName(modifier.getName());
                itemModifier.setModifierGroupName(modifier.getModifierGroup().getName());
                itemModifier.setQuantity(modRequest.getQuantity());
                itemModifier.setUnitPrice(modifier.getPriceAdd());

                orderItem.addModifier(itemModifier);
            }
        }

        // Calculate line total
        orderItem.calculateLineTotal();

        return orderItem;
    }

    private String generateOrderNumber(Long restaurantId, LocalDate orderDate) {
        String prefix = String.format("ORD-%s-", orderDate.toString().replace("-", ""));
        Integer maxNumber = orderRepository.findMaxOrderNumberForDate(restaurantId, prefix, orderDate)
                .orElse(0);
        return prefix + String.format("%04d", maxNumber + 1);
    }

    private String generateKotNumber(Long restaurantId, LocalDate kotDate) {
        String prefix = String.format("KOT-%s-", kotDate.toString().replace("-", ""));
        Integer maxNumber = kitchenOrderTicketRepository.findMaxKotNumberForDate(restaurantId, prefix, kotDate)
                .orElse(0);
        return prefix + String.format("%04d", maxNumber + 1);
    }

    // ===== ORDER LIFECYCLE OPERATIONS =====

    @Override
    public void deleteOrder(String orderUuid, Long currentUserId) {
        log.info("Deleting order: {}", orderUuid);
        Order order = orderRepository.findByOrderUuidAndIsDeletedFalse(orderUuid)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.canBeDeleted()) {
            throw new RuntimeException("Order cannot be deleted in its current state: " + order.getStatus());
        }
        orderRepository.delete(order);
        log.info("Order {} soft-deleted successfully", orderUuid);
    }

    @Override
    public OrderResponse changeOrderStatus(String orderUuid, OrderStatus newStatus, Long currentUserId) {
        log.info("Changing status of order {} to {}", orderUuid, newStatus);
        Order order = orderRepository.findByOrderUuidAndIsDeletedFalse(orderUuid)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // You might want to add more sophisticated status transition logic here
        order.transitionTo(newStatus);

        order = orderRepository.save(order);
        log.info("Successfully changed status of order {} to {}", orderUuid, newStatus);
        return orderMapper.toOrderResponse(order);
    }

    @Override
    public OrderResponse cancelOrder(String orderUuid, String cancellationReason, Long currentUserId) {
        log.info("Cancelling order: {}", orderUuid);
        Order order = orderRepository.findByOrderUuidWithItems(orderUuid)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        order.cancel(cancellationReason);

        // Update table status back to VACANT if this was a dine-in order
        if (order.getTable() != null) {
            RestaurantTable table = order.getTable();
            table.setStatus(TableStatus.VACANT);
            table.setSeatedAt(null);
            table.setCurrentOrderUuid(null);
            table.setCurrentPax(null);
            tableRepository.save(table);
            log.info("Table {} marked as VACANT", table.getTableNumber());
        }

        order = orderRepository.save(order);
        log.info("Order {} cancelled successfully", orderUuid);
        return orderMapper.toOrderResponse(order);
    }

    @Override
    public OrderResponse completeOrder(String orderUuid, Long currentUserId) {
        log.info("Completing order: {}", orderUuid);
        Order order = orderRepository.findByOrderUuidAndIsDeletedFalse(orderUuid)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        order.complete();

        // Update table status back to VACANT if this was a dine-in order
        if (order.getTable() != null) {
            RestaurantTable table = order.getTable();
            table.setStatus(TableStatus.VACANT);
            table.setSeatedAt(null);
            table.setCurrentOrderUuid(null);
            table.setCurrentPax(null);
            tableRepository.save(table);
            log.info("Table {} marked as VACANT", table.getTableNumber());
        }

        order = orderRepository.save(order);
        log.info("Order {} completed successfully", orderUuid);
        return orderMapper.toOrderResponse(order);
    }

    @Override
    public OrderResponse addItemsToOrder(String orderUuid, List<OrderItemRequest> items, Long currentUserId) {
        log.info("Adding {} items to order {}", items.size(), orderUuid);
        Order order = orderRepository.findByOrderUuidWithItems(orderUuid)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.canBeModified()) {
            throw new RuntimeException("Order cannot be modified in current status: " + order.getStatus());
        }
        if(order.getStatus().equals(OrderStatus.DRAFT)){
            order.setStatus(OrderStatus.OPEN);
        }
        for (OrderItemRequest itemRequest : items) {
            OrderItem orderItem = createOrderItem(itemRequest, order);
            order.addItem(orderItem);
        }

        order.calculateTotals();
        order = orderRepository.save(order);
        log.info("Successfully added items to order {}", orderUuid);
        return orderMapper.toOrderResponse(order);
    }

    @Override
    public OrderResponse removeItemFromOrder(String orderUuid, String orderItemUuid, Long currentUserId) {
        log.info("Removing item {} from order {}", orderItemUuid, orderUuid);
        Order order = orderRepository.findByOrderUuidWithItems(orderUuid)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.canBeModified()) {
            throw new RuntimeException("Order cannot be modified in current status: " + order.getStatus());
        }

        OrderItem itemToRemove = order.getItems().stream()
                .filter(item -> item.getOrderItemUuid().equals(orderItemUuid))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Order item not found"));

        if (itemToRemove.getKotStatus() != KotStatus.PENDING) {
            throw new RuntimeException("Cannot remove an item that has already been sent to the kitchen.");
        }

        order.removeItem(itemToRemove);
        order.calculateTotals();
        order = orderRepository.save(order);
        log.info("Successfully removed item {} from order {}", orderItemUuid, orderUuid);
        return orderMapper.toOrderResponse(order);
    }

    @Override
    public OrderResponse cancelOrderItem(String orderUuid, String orderItemUuid, CancelOrderItemRequest request,
            Long currentUserId) {
        log.info("Cancelling item {} from order {}", orderItemUuid, orderUuid);
        Order order = orderRepository.findByOrderUuidWithItems(orderUuid)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        OrderItem itemToCancel = order.getItems().stream()
                .filter(item -> item.getOrderItemUuid().equals(orderItemUuid))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Order item not found"));

        itemToCancel.cancel(request.getReason(), request.getNotes());

        order.calculateTotals();
        order = orderRepository.save(order);
        log.info("Successfully cancelled item {} from order {}", orderItemUuid, orderUuid);
        return orderMapper.toOrderResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByRestaurantAndDate(String restaurantUuid, LocalDate orderDate) {
        List<Order> orders = orderRepository.findByRestaurantUuidAndOrderDate(restaurantUuid, orderDate);
        return orderMapper.toOrderResponseList(orders);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByRestaurantDateAndType(String restaurantUuid, LocalDate orderDate,
            OrderType orderType) {
        List<Order> orders = orderRepository.findByRestaurantUuidAndOrderTypeAndOrderDate(restaurantUuid, orderType,
                orderDate);
        return orderMapper.toOrderResponseList(orders);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> searchOrders(String restaurantUuid, String searchTerm, Pageable pageable) {
        Page<Order> orders = orderRepository.searchOrdersByRestaurantUuid(restaurantUuid, searchTerm, pageable);
        return orders.map(orderMapper::toOrderResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<KotResponse> getKitchenOrders(String restaurantUuid, UserAuthEntity user) {
        UserRole role = user.getRole();

        if (role.equals(UserRole.CHEF)) {
            List<KotTicketStatus> kotStatus = List.of(KotTicketStatus.SENT, KotTicketStatus.ACKNOWLEDGED, KotTicketStatus.IN_PROGRESS);
            List<KitchenOrderTicket> orders = kitchenOrderTicketRepository.findByRestaurantAndStatusIn(restaurantUuid ,kotStatus);

            return orderMapper.toKotResponseList(orders);
        } else if (role.equals(UserRole.WAITER)) {
            List<KotTicketStatus> kotStatus = List.of(KotTicketStatus.SENT, KotTicketStatus.ACKNOWLEDGED, KotTicketStatus.IN_PROGRESS , KotTicketStatus.READY);
            List<KitchenOrderTicket> orders = kitchenOrderTicketRepository.findByRestaurantAndStatusIn(restaurantUuid ,kotStatus);

            return orderMapper.toKotResponseList(orders);
        }
        List<KotTicketStatus> kotStatus = List.of(KotTicketStatus.SENT, KotTicketStatus.ACKNOWLEDGED, KotTicketStatus.IN_PROGRESS , KotTicketStatus.READY ,  KotTicketStatus.COMPLETED , KotTicketStatus.COMPLETED);
        List<KitchenOrderTicket> orders = kitchenOrderTicketRepository.findByRestaurantAndStatusIn(restaurantUuid ,kotStatus);

        return orderMapper.toKotResponseList(orders);


    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersWithPendingPayments(String restaurantUuid) {
        List<Order> orders = orderRepository.findOrdersWithPendingPaymentsByRestaurantUuid(restaurantUuid);
        return orderMapper.toOrderResponseList(orders);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getActiveOrderByTable(String tableUuid) {
        List<OrderStatus> excludeStatuses = List.of(OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.VOID);
        Order order = orderRepository.findActiveOrderByTableUuid(tableUuid, excludeStatuses)
                .orElseThrow(() -> new RuntimeException("No active order found for table"));
        return orderMapper.toOrderResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getWaiterActiveOrders(Long waiterId, LocalDate orderDate) {
        List<Order> orders = orderRepository.findActiveOrdersByWaiter(waiterId, orderDate);
        return orderMapper.toOrderResponseList(orders);
    }

    @Override
    @Transactional(readOnly = true)
    public Long getTotalOrdersCount(String restaurantUuid, LocalDate orderDate) {
        return orderRepository.countOrdersByRestaurantUuidAndDate(restaurantUuid, orderDate);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getTotalSales(String restaurantUuid, LocalDate orderDate) {
        return orderRepository.calculateTotalSalesByRestaurantUuidAndDate(restaurantUuid, orderDate);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getAverageOrderValue(String restaurantUuid, LocalDate orderDate) {
        return orderRepository.calculateAverageOrderValueByRestaurantUuid(restaurantUuid, orderDate);
    }

    @Override
    public Order createEmptyOrder(CreateOrderRequest orderRequest, Long userId) {
        log.info("Creating empty order for restaurant: {}", orderRequest.getRestaurantUuid());

        // 1. Validate and fetch restaurant
        Restaurant restaurant = restaurantRepository
                .findByRestaurantUuidAndIsDeletedFalse(orderRequest.getRestaurantUuid())
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));

        // 2. Create order entity using mapper
        Order order = orderMapper.toOrder(orderRequest);
        order.setRestaurant(restaurant);

        // 3. Handle table assignment (for dine-in)
        if (orderRequest.getTableUuid() != null) {
            RestaurantTable table = tableRepository.findByTableUuidAndIsDeletedFalse(orderRequest.getTableUuid())
                    .orElseThrow(() -> new RuntimeException("Table not found"));
            order.setTable(table);
        }

        // 4. Handle waiter assignment
        if (orderRequest.getWaiterUuid() != null) {
            UserAuthEntity waiter = userRepository.findByUserUuidAndIsDeletedFalse(orderRequest.getWaiterUuid())
                    .orElseThrow(() -> new RuntimeException("Waiter not found"));
            order.setWaiter(waiter);
        }

        // 5. Generate order number
        String orderNumber = generateOrderNumber(restaurant.getId(), LocalDate.now());
        order.setOrderNumber(orderNumber);

        // 6. Set status to DRAFT
        order.setStatus(OrderStatus.DRAFT);

        // 7. Save order
        order = orderRepository.save(order);
        log.info("Empty order created successfully: {}", order.getOrderUuid());

        return order;
    }

    @Override
    public KotResponse updateKotStatus(String kotUuid, String newStatus) {
        log.info("Updating KOT status for KOT: {}", kotUuid);

        KitchenOrderTicket kot = kitchenOrderTicketRepository.findByKotUuidAndIsDeletedFalse(kotUuid)
                .orElseThrow(() -> new RuntimeException("KOT not found"));

        List<OrderItem> items = kot.getKotItems().stream()
                .map(KotItem::getOrderItem)
                .toList();


        KotTicketStatus status;
        try {
            status = KotTicketStatus.valueOf(newStatus.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid KOT status: " + newStatus);
        }

        if(status.equals(KotTicketStatus.READY)){
            items.forEach(item -> item.setKotStatus(KotStatus.READY));
        }else if(status.equals(KotTicketStatus.COMPLETED)){
            items.forEach(item -> item.setKotStatus(KotStatus.SERVED));
        }

        kot.setStatus(status);
        kot = kitchenOrderTicketRepository.save(kot);
        log.info("KOT status updated successfully: {}", kot.getKotNumber());

        return orderMapper.toKotResponse(kot);
    }
}
