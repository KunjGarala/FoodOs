package org.foodos.order.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.auth.repository.UserRepository;
import org.foodos.order.dto.request.*;
import org.foodos.order.dto.response.OrderResponse;
import org.foodos.order.entity.*;
import org.foodos.order.entity.enums.KotStatus;
import org.foodos.order.entity.enums.OrderStatus;
import org.foodos.order.entity.enums.OrderType;
import org.foodos.order.entity.enums.PaymentStatus;
import org.foodos.order.mapper.OrderMapper;
import org.foodos.order.repository.*;
import org.foodos.product.entity.Modifier;
import org.foodos.product.entity.Product;
import org.foodos.product.entity.ProductVariation;
import org.foodos.product.repository.ModifierRepository;
import org.foodos.product.repository.ProductRepository;
import org.foodos.product.repository.ProductVariationRepository;
import org.foodos.restaurant.entity.Restaurant;
import org.foodos.restaurant.entity.RestaurantTable;
import org.foodos.restaurant.repository.RestaurantRepository;
import org.foodos.restaurant.repository.RestaurantTableRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
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
public class OrderServiceImpl implements org.foodos.order.service.OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final KitchenOrderTicketRepository kitchenOrderTicketRepository;
    private final KotItemRepository kotItemRepository;
    private final PaymentRepository paymentRepository;

    private final RestaurantRepository restaurantRepository;
    private final RestaurantTableRepository tableRepository;
    private final ProductRepository productRepository;
    private final ProductVariationRepository variationRepository;
    private final ModifierRepository modifierRepository;
    private final UserRepository userRepository;

    private final OrderMapper orderMapper;

    // ===== CREATE ORDER =====

    @Override
    public OrderResponse createOrder(CreateOrderRequest request, Long currentUserId) {
        log.info("Creating order for restaurant: {}", request.getRestaurantId());

        // 1. Validate and fetch restaurant
        Restaurant restaurant = restaurantRepository.findById(request.getRestaurantId())
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));

        // 2. Create order entity
        Order order = Order.builder()
                .restaurant(restaurant)
                .orderType(request.getOrderType())
                .numberOfGuests(request.getNumberOfGuests())
                .customerName(request.getCustomerName())
                .customerPhone(request.getCustomerPhone())
                .customerEmail(request.getCustomerEmail())
                .deliveryAddress(request.getDeliveryAddress())
                .orderNotes(request.getOrderNotes())
                .kitchenNotes(request.getKitchenNotes())
                .discountPercentage(request.getDiscountPercentage())
                .discountAmount(request.getDiscountAmount())
                .discountReason(request.getDiscountReason())
                .couponCode(request.getCouponCode())
                .taxPercentage(request.getTaxPercentage())
                .serviceChargePercentage(request.getServiceChargePercentage())
                .deliveryCharge(request.getDeliveryCharge() != null ? request.getDeliveryCharge() : BigDecimal.ZERO)
                .packingCharge(request.getPackingCharge() != null ? request.getPackingCharge() : BigDecimal.ZERO)
                .status(OrderStatus.DRAFT)
                .build();

        // 3. Handle table assignment (for dine-in)
        if (request.getTableId() != null) {
            RestaurantTable table = tableRepository.findById(request.getTableId())
                    .orElseThrow(() -> new RuntimeException("Table not found"));
            order.setTable(table);
        }

        // 4. Handle waiter assignment
        if (request.getWaiterId() != null) {
            UserAuthEntity waiter = userRepository.findById(request.getWaiterId())
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
            // TODO: Update table status to OCCUPIED
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

        // Create KOT
        KitchenOrderTicket kot = KitchenOrderTicket.builder()
                .restaurant(order.getRestaurant())
                .order(order)
                .kotNumber(kotNumber)
                .orderNumber(order.getOrderNumber())
                .tableNumber(order.getTable() != null ? order.getTable().getTableNumber() : null)
                .waiterName(order.getWaiter() != null ? order.getWaiter().getUsername() : null)
                .printerTarget(request.getPrinterTarget())
                .kitchenStation(request.getKitchenStation())
                .specialInstructions(request.getSpecialInstructions())
                .isUrgent(request.getIsUrgent())
                .priority(request.getPriority())
                .build();

        // Add items to KOT
        for (String itemUuid : request.getOrderItemUuids()) {
            OrderItem orderItem = order.getItems().stream()
                    .filter(item -> item.getOrderItemUuid().equals(itemUuid))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Order item not found"));

            KotItem kotItem = KotItem.builder()
                    .orderItem(orderItem)
                    .productName(orderItem.getProductName())
                    .variationName(orderItem.getVariationName())
                    .quantity(orderItem.getQuantity())
                    .modifiersText(orderItem.getModifiersText())
                    .notes(orderItem.getItemNotes())
                    .specialInstructions(orderItem.getSpecialInstructions())
                    .isComplimentary(orderItem.getIsComplimentary())
                    .build();

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

        // Create payment
        Payment payment = Payment.builder()
                .order(order)
                .paymentMethod(request.getPaymentMethod())
                .amount(request.getAmount())
                .transactionId(request.getTransactionId())
                .referenceNumber(request.getReferenceNumber())
                .cardLastFour(request.getCardLastFour())
                .cardType(request.getCardType())
                .upiId(request.getUpiId())
                .bankName(request.getBankName())
                .notes(request.getNotes())
                .collectedBy(collector)
                .status(PaymentStatus.COMPLETED)
                .build();

        order.addPayment(payment);
        order.calculateTotals();

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
                                 item.getKotStatus() == KotStatus.READY);

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
    public Page<OrderResponse> getOrdersByRestaurant(Long restaurantId, Pageable pageable) {
        Page<Order> orders = orderRepository.findByRestaurant(restaurantId, pageable);
        return orders.map(orderMapper::toOrderResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getOrdersByRestaurantAndStatus(Long restaurantId, OrderStatus status, Pageable pageable) {
        Page<Order> orders = orderRepository.findByRestaurantAndStatusIn(restaurantId, List.of(status), pageable);
        return orders.map(orderMapper::toOrderResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getActiveOrders(Long restaurantId) {
        List<Order> orders = orderRepository.findActiveOrders(restaurantId);
        return orderMapper.toOrderResponseList(orders);
    }

    // ===== HELPER METHODS =====

    private OrderItem createOrderItem(OrderItemRequest request, Order order) {
        // Fetch product
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // Fetch variation if specified
        ProductVariation variation = null;
        if (request.getVariationId() != null) {
            variation = variationRepository.findById(request.getVariationId())
                    .orElseThrow(() -> new RuntimeException("Product variation not found"));
        }

        // Determine unit price
        BigDecimal unitPrice = request.getUnitPrice() != null ?
                request.getUnitPrice() :
                (variation != null ? variation.getPrice() : product.getPrice());

        // Create order item
        OrderItem orderItem = OrderItem.builder()
                .product(product)
                .variation(variation)
                .productName(product.getName())
                .variationName(variation != null ? variation.getName() : null)
                .sku(product.getSku())
                .quantity(request.getQuantity())
                .unitPrice(unitPrice)
                .costPrice(product.getCostPrice())
                .discountPercentage(request.getDiscountPercentage())
                .discountAmount(request.getDiscountAmount())
                .itemNotes(request.getItemNotes())
                .isComplimentary(request.getIsComplimentary())
                .isHalfPortion(request.getIsHalfPortion())
                .kotStatus(KotStatus.PENDING)
                .build();

        // Add modifiers
        if (request.getModifiers() != null) {
            for (OrderItemModifierRequest modRequest : request.getModifiers()) {
                Modifier modifier = modifierRepository.findById(modRequest.getModifierId())
                        .orElseThrow(() -> new RuntimeException("Modifier not found"));

                OrderItemModifier itemModifier = OrderItemModifier.builder()
                        .modifier(modifier)
                        .modifierName(modifier.getName())
                        .modifierGroupName(modifier.getModifierGroup().getName())
                        .quantity(modRequest.getQuantity())
                        .unitPrice(modifier.getPriceAdd())
                        .build();

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

    // ===== STUB METHODS (TO BE IMPLEMENTED) =====

    @Override
    public void deleteOrder(String orderUuid, Long currentUserId) {
        // TODO: Implement soft delete
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @Override
    public OrderResponse changeOrderStatus(String orderUuid, OrderStatus newStatus, Long currentUserId) {
        // TODO: Implement status change
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @Override
    public OrderResponse cancelOrder(String orderUuid, String cancellationReason, Long currentUserId) {
        // TODO: Implement order cancellation
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @Override
    public OrderResponse completeOrder(String orderUuid, Long currentUserId) {
        // TODO: Implement order completion
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @Override
    public OrderResponse addItemsToOrder(String orderUuid, List<OrderItemRequest> items, Long currentUserId) {
        // TODO: Implement add items
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @Override
    public OrderResponse removeItemFromOrder(String orderUuid, String orderItemUuid, Long currentUserId) {
        // TODO: Implement remove item
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @Override
    public OrderResponse cancelOrderItem(String orderUuid, String orderItemUuid, CancelOrderItemRequest request, Long currentUserId) {
        // TODO: Implement cancel item
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByRestaurantAndDate(Long restaurantId, LocalDate orderDate) {
        List<Order> orders = orderRepository.findByRestaurantAndOrderDate(restaurantId, orderDate);
        return orderMapper.toOrderResponseList(orders);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByRestaurantDateAndType(Long restaurantId, LocalDate orderDate, OrderType orderType) {
        List<Order> orders = orderRepository.findByRestaurantAndOrderTypeAndOrderDate(restaurantId, orderType, orderDate);
        return orderMapper.toOrderResponseList(orders);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> searchOrders(Long restaurantId, String searchTerm, Pageable pageable) {
        Page<Order> orders = orderRepository.searchOrders(restaurantId, searchTerm, pageable);
        return orders.map(orderMapper::toOrderResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getKitchenOrders(Long restaurantId) {
        List<Order> orders = orderRepository.findKitchenOrders(restaurantId);
        return orderMapper.toOrderResponseList(orders);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersWithPendingPayments(Long restaurantId) {
        List<Order> orders = orderRepository.findOrdersWithPendingPayments(restaurantId);
        return orderMapper.toOrderResponseList(orders);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getActiveOrderByTable(Long tableId) {
        List<OrderStatus> excludeStatuses = List.of(OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.VOID);
        Order order = orderRepository.findActiveOrderByTable(tableId, excludeStatuses)
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
    public Long getTotalOrdersCount(Long restaurantId, LocalDate orderDate) {
        return orderRepository.countOrdersByRestaurantAndDate(restaurantId, orderDate);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getTotalSales(Long restaurantId, LocalDate orderDate) {
        return orderRepository.calculateTotalSalesByRestaurantAndDate(restaurantId, orderDate);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getAverageOrderValue(Long restaurantId, LocalDate orderDate) {
        return orderRepository.calculateAverageOrderValue(restaurantId, orderDate);
    }
}

