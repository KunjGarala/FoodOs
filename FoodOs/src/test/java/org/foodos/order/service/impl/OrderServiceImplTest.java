package org.foodos.order.service.impl;

import org.foodos.auth.repository.UserAuthRepository;
import org.foodos.common.security.RestaurantAccessGuard;
import org.foodos.config.websocket.WebSocketEventService;
import org.foodos.coupon.service.CouponService;
import org.foodos.customer.service.CustomerCrmService;
import org.foodos.order.dto.response.OrderResponse;
import org.foodos.order.entity.Order;
import org.foodos.order.entity.enums.OrderStatus;
import org.foodos.order.mapper.OrderMapper;
import org.foodos.order.repository.KitchenOrderTicketRepository;
import org.foodos.order.repository.KotItemRepository;
import org.foodos.order.repository.OrderItemRepository;
import org.foodos.order.repository.OrderRepository;
import org.foodos.order.repository.PaymentRepository;
import org.foodos.product.repository.ModifierRepo;
import org.foodos.product.repository.ProductRepo;
import org.foodos.product.repository.ProductVariationRepo;
import org.foodos.restaurant.entity.Restaurant;
import org.foodos.restaurant.repository.RestaurantRepo;
import org.foodos.restaurant.repository.RestaurantTableRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

    @Mock private OrderRepository orderRepository;
    @Mock private OrderItemRepository orderItemRepository;
    @Mock private KitchenOrderTicketRepository kitchenOrderTicketRepository;
    @Mock private KotItemRepository kotItemRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private RestaurantRepo restaurantRepository;
    @Mock private RestaurantTableRepository tableRepository;
    @Mock private ProductRepo productRepository;
    @Mock private ProductVariationRepo variationRepository;
    @Mock private ModifierRepo modifierRepository;
    @Mock private UserAuthRepository userRepository;
    @Mock private OrderMapper orderMapper;
    @Mock private WebSocketEventService webSocketEventService;
    @Mock private CustomerCrmService customerCrmService;
    @Mock private CouponService couponService;
    @Mock private RestaurantAccessGuard restaurantAccessGuard;

    @InjectMocks private OrderServiceImpl orderService;

    @Test
    void generateBillReturnsExistingBillWhenOrderIsAlreadyBilled() {
        String orderUuid = "order-uuid";
        Order order = org.mockito.Mockito.mock(Order.class);
        Restaurant restaurant = org.mockito.Mockito.mock(Restaurant.class);
        OrderResponse existingBill = new OrderResponse();

        when(orderRepository.findByOrderUuidAndIsDeletedFalse(orderUuid)).thenReturn(Optional.of(order));
        when(order.getRestaurant()).thenReturn(restaurant);
        when(restaurant.getRestaurantUuid()).thenReturn("restaurant-uuid");
        when(order.getStatus()).thenReturn(OrderStatus.BILLED);
        when(orderMapper.toOrderResponse(order)).thenReturn(existingBill);

        OrderResponse response = orderService.generateBill(orderUuid, 1L);

        assertSame(existingBill, response);
        verify(order, never()).transitionTo(OrderStatus.BILLED);
        verify(orderRepository, never()).save(order);
        verify(webSocketEventService, never()).broadcastOrderUpdate(
                org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.any());
    }
}