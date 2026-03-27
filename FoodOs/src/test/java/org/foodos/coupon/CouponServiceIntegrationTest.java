package org.foodos.coupon;

import org.foodos.coupon.dto.request.ApplyCouponRequest;
import org.foodos.coupon.dto.request.CreateCouponRequest;
import org.foodos.coupon.dto.request.ValidateCouponRequest;
import org.foodos.coupon.dto.response.CouponValidationResponse;
import org.foodos.coupon.entity.Coupon;
import org.foodos.coupon.entity.enums.CouponScopeType;
import org.foodos.coupon.entity.enums.DiscountType;
import org.foodos.coupon.repository.CouponRepository;
import org.foodos.coupon.service.CouponService;
import org.foodos.order.dto.response.OrderResponse;
import org.foodos.order.entity.Order;
import org.foodos.order.entity.OrderItem;
import org.foodos.order.entity.enums.OrderStatus;
import org.foodos.product.entity.Category;
import org.foodos.product.entity.Product;
import org.foodos.product.entity.enums.DietaryType;
import org.foodos.product.repository.CategoryRepo;
import org.foodos.product.repository.ProductRepo;
import org.foodos.restaurant.entity.Restaurant;
import org.foodos.restaurant.entity.enums.LicenseType;
import org.foodos.restaurant.repository.RestaurantRepo;
import org.foodos.order.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class CouponServiceIntegrationTest {

    @Autowired
    private CouponService couponService;

    @Autowired
    private RestaurantRepo restaurantRepo;

    @Autowired
    private CategoryRepo categoryRepo;

    @Autowired
    private ProductRepo productRepo;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CouponRepository couponRepository;

    private Restaurant restaurantA;
    private Restaurant restaurantB;
    private Product productA;

    @BeforeEach
    void setUp() {
        restaurantA = createRestaurant("Rest-A");
        restaurantB = createRestaurant("Rest-B");
        Category category = createCategory(restaurantA, "Mains");
        productA = createProduct(restaurantA, category, new BigDecimal("500.00"));
    }

    @Test
    void shouldApplyValidCoupon() {
        Order order = createOrder(restaurantA, productA, new BigDecimal("500.00"));

        CreateCouponRequest create = baseCouponRequest("SAVE10", CouponScopeType.GLOBAL_CHAIN);
        create.setOwnerRestaurantUuid(restaurantA.getRestaurantUuid());
        couponService.createCoupon(create, null);

        ApplyCouponRequest apply = new ApplyCouponRequest();
        apply.setCouponCode("save10");

        OrderResponse response = couponService.applyCoupon(order.getOrderUuid(), apply, null);

        assertEquals("SAVE10", response.getCouponCode());
        assertEquals(new BigDecimal("50.00"), response.getDiscountAmount());
    }

    @Test
    void shouldRejectExpiredCoupon() {
        Coupon expired = Coupon.builder()
                .code("OLD50")
                .name("Old Coupon")
                .description("Expired")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(new BigDecimal("20"))
                .maxDiscountAmount(new BigDecimal("300"))
                .minOrderAmount(new BigDecimal("100"))
                .startDate(LocalDateTime.now().minusDays(5))
                .endDate(LocalDateTime.now().minusDays(1))
                .usageLimitGlobal(5)
                .scopeType(CouponScopeType.GLOBAL_CHAIN)
                .ownerRestaurant(restaurantA)
                .isActive(true)
                .build();
        couponRepository.save(expired);

        ValidateCouponRequest validate = new ValidateCouponRequest();
        validate.setCouponCode("OLD50");
        validate.setRestaurantUuid(restaurantA.getRestaurantUuid());
        validate.setOrderAmount(new BigDecimal("500"));
        validate.setEvaluationTime(LocalDateTime.now());

        CouponValidationResponse response = couponService.validateCoupon(validate);
        assertFalse(response.isValid());
        assertEquals("Coupon expired", response.getReason());
    }

    @Test
    void shouldFailForWrongRestaurant() {
        Category categoryB = createCategory(restaurantB, "Mains-B");
        Product productB = createProduct(restaurantB, categoryB, new BigDecimal("600.00"));
        Order order = createOrder(restaurantB, productB, new BigDecimal("600.00"));

        CreateCouponRequest create = baseCouponRequest("RESTONLY", CouponScopeType.RESTAURANT_SPECIFIC);
        create.setRestaurantUuids(List.of(restaurantA.getRestaurantUuid()));
        couponService.createCoupon(create, null);

        ApplyCouponRequest apply = new ApplyCouponRequest();
        apply.setCouponCode("RESTONLY");

        assertThrows(IllegalStateException.class, () -> couponService.applyCoupon(order.getOrderUuid(), apply, null));
    }

    @Test
    void shouldRespectGlobalUsageLimit() {
        Order firstOrder = createOrder(restaurantA, productA, new BigDecimal("700.00"));
        Order secondOrder = createOrder(restaurantA, productA, new BigDecimal("700.00"));

        CreateCouponRequest create = baseCouponRequest("ONCE", CouponScopeType.GLOBAL_CHAIN);
        create.setOwnerRestaurantUuid(restaurantA.getRestaurantUuid());
        create.setUsageLimitGlobal(1);
        couponService.createCoupon(create, null);

        ApplyCouponRequest apply = new ApplyCouponRequest();
        apply.setCouponCode("ONCE");

        couponService.applyCoupon(firstOrder.getOrderUuid(), apply, null);
        assertThrows(IllegalStateException.class, () -> couponService.applyCoupon(secondOrder.getOrderUuid(), apply, null));
    }

    @Test
    void shouldRevalidateWhenSubtotalDrops() {
        Order order = createOrder(restaurantA, productA, new BigDecimal("500.00"));
        // add second item to raise subtotal above min order
        addItemToOrder(order, productA, new BigDecimal("200.00"));
        order.calculateTotals();
        orderRepository.save(order);

        CreateCouponRequest create = baseCouponRequest("MIN700", CouponScopeType.GLOBAL_CHAIN);
        create.setOwnerRestaurantUuid(restaurantA.getRestaurantUuid());
        create.setMinOrderAmount(new BigDecimal("700"));
        couponService.createCoupon(create, null);

        ApplyCouponRequest apply = new ApplyCouponRequest();
        apply.setCouponCode("MIN700");
        couponService.applyCoupon(order.getOrderUuid(), apply, null);

        // drop subtotal below minimum
        OrderItem itemToRemove = order.getItems().get(1);
        assertThrows(RuntimeException.class, () -> {
            orderRepository.flush();
            orderRepository.findById(order.getId()).ifPresent(o -> {});
            order.getItems().remove(itemToRemove);
            order.calculateTotals();
            couponService.revalidateAppliedCoupon(order);
        });
    }

    // ===== helper builders =====

    private CreateCouponRequest baseCouponRequest(String code, CouponScopeType scope) {
        CreateCouponRequest request = new CreateCouponRequest();
        request.setCode(code);
        request.setName(code + " name");
        request.setDescription("Test coupon");
        request.setDiscountType(DiscountType.PERCENTAGE);
        request.setDiscountValue(new BigDecimal("10"));
        request.setMaxDiscountAmount(new BigDecimal("200"));
        request.setMinOrderAmount(new BigDecimal("300"));
        request.setStartDate(LocalDateTime.now().minusDays(1));
        request.setEndDate(LocalDateTime.now().plusDays(2));
        request.setUsageLimitPerUser(5);
        request.setScopeType(scope);
        return request;
    }

    private Restaurant createRestaurant(String name) {
        Restaurant restaurant = Restaurant.builder()
                .name(name)
                .licenseType(LicenseType.TRIAL)
                .licenseExpiry(LocalDate.now().plusYears(1))
                .build();
        return restaurantRepo.save(restaurant);
    }

    private Category createCategory(Restaurant restaurant, String name) {
        Category category = Category.builder()
                .restaurant(restaurant)
                .name(name)
                .build();
        return categoryRepo.save(category);
    }

    private Product createProduct(Restaurant restaurant, Category category, BigDecimal price) {
        Product product = Product.builder()
                .restaurant(restaurant)
                .category(category)
                .name("Test Product")
                .sku("SKU-" + UUID.randomUUID())
                .basePrice(price)
                .costPrice(price)
                .dietaryType(DietaryType.VEG)
                .build();
        return productRepo.save(product);
    }

    private Order createOrder(Restaurant restaurant, Product product, BigDecimal lineTotal) {
        Order order = Order.builder()
                .restaurant(restaurant)
                .orderNumber("ORD-" + UUID.randomUUID())
                .orderDate(LocalDate.now())
                .orderTime(LocalDateTime.now())
                .status(OrderStatus.OPEN)
                .build();

        OrderItem item = OrderItem.builder()
                .order(order)
                .product(product)
                .productName(product.getName())
                .sku(product.getSku())
                .unitPrice(lineTotal)
                .quantity(BigDecimal.ONE)
                .lineTotal(lineTotal)
                .isCancelled(false)
                .build();

        order.addItem(item);
        order.calculateTotals();
        return orderRepository.save(order);
    }

    private void addItemToOrder(Order order, Product product, BigDecimal lineTotal) {
        OrderItem extra = OrderItem.builder()
                .order(order)
                .product(product)
                .productName(product.getName())
                .sku(product.getSku())
                .unitPrice(lineTotal)
                .quantity(BigDecimal.ONE)
                .lineTotal(lineTotal)
                .isCancelled(false)
                .build();
        order.addItem(extra);
    }
}
