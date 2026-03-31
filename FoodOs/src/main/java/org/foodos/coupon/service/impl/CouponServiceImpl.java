package org.foodos.coupon.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.auth.repository.UserAuthRepository;
import org.foodos.coupon.dto.request.ApplyCouponRequest;
import org.foodos.coupon.dto.request.CreateCouponRequest;
import org.foodos.coupon.dto.request.SuggestCouponRequest;
import org.foodos.coupon.dto.request.ValidateCouponRequest;
import org.foodos.coupon.dto.request.UpdateCouponRequest;
import org.foodos.coupon.dto.response.CouponResponse;
import org.foodos.coupon.dto.response.CouponValidationResponse;
import org.foodos.coupon.dto.response.CouponUsageSummaryResponse;
import org.foodos.coupon.entity.Coupon;
import org.foodos.coupon.entity.CouponRestaurantMapping;
import org.foodos.coupon.entity.CouponUsage;
import org.foodos.coupon.entity.enums.CouponScopeType;
import org.foodos.coupon.entity.enums.DiscountType;
import org.foodos.coupon.repository.CouponRepository;
import org.foodos.coupon.repository.CouponRestaurantMappingRepository;
import org.foodos.coupon.repository.CouponUsageRepository;
import org.foodos.coupon.service.CouponService;
import org.foodos.customer.entity.Customer;
import org.foodos.customer.repository.CustomerRepository;
import org.foodos.order.dto.response.OrderResponse;
import org.foodos.order.entity.Order;
import org.foodos.order.mapper.OrderMapper;
import org.foodos.order.repository.OrderRepository;
import org.foodos.restaurant.entity.Restaurant;
import org.foodos.restaurant.repository.RestaurantRepo;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CouponServiceImpl implements CouponService {

    private final CouponRepository couponRepository;
    private final CouponRestaurantMappingRepository mappingRepository;
    private final CouponUsageRepository usageRepository;
    private final RestaurantRepo restaurantRepo;
    private final CustomerRepository customerRepository;
    private final UserAuthRepository userAuthRepository;
    private final OrderRepository orderRepository;
    private final OrderMapper orderMapper;

    @Override
    @CacheEvict(value = "couponByCode", key = "#request.code.toUpperCase()")
    public CouponResponse createCoupon(CreateCouponRequest request, Long creatorUserId) {
        validateCreateRequest(request);

        if (couponRepository.existsByCodeIgnoreCaseAndIsDeletedFalse(request.getCode())) {
            throw new IllegalArgumentException("Coupon code already exists");
        }

        Restaurant ownerRestaurant = resolveOwnerRestaurant(request);
        UserAuthEntity creator = creatorUserId != null
                ? userAuthRepository.findById(creatorUserId).orElse(null)
                : null;

        Coupon coupon = Coupon.builder()
                .code(request.getCode())
                .name(request.getName())
                .description(request.getDescription())
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .minOrderAmount(defaultZero(request.getMinOrderAmount()))
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .usageLimitGlobal(request.getUsageLimitGlobal())
                .usageLimitPerUser(request.getUsageLimitPerUser())
                .isActive(request.getActive() == null || Boolean.TRUE.equals(request.getActive()))
                .allowStacking(Boolean.TRUE.equals(request.getAllowStacking()))
                .scopeType(request.getScopeType())
                .ownerRestaurant(ownerRestaurant)
                .createdBy(creator)
                .build();

        coupon = couponRepository.save(coupon);

        if (coupon.getScopeType() == CouponScopeType.RESTAURANT_SPECIFIC) {
            attachRestaurants(request.getRestaurantUuids(), coupon);
        }

        return buildCouponResponse(coupon, request.getRestaurantUuids());
    }

    @Override
    @Transactional(readOnly = true)
    public CouponValidationResponse validateCoupon(ValidateCouponRequest request) {
        LocalDateTime evalTime = request.getEvaluationTime() != null ? request.getEvaluationTime() : LocalDateTime.now();
        Coupon coupon = findActiveCouponCached(request.getCouponCode())
                .orElseThrow(() -> new IllegalArgumentException("Invalid coupon code"));

        Restaurant restaurant = restaurantRepo.findByRestaurantUuidAndIsDeletedFalse(request.getRestaurantUuid())
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found"));

        Customer customer = resolveCustomer(request.getCustomerUuid(), restaurant, null, null);

        ValidationResult result = validateAndCompute(coupon, restaurant, request.getOrderAmount(), customer, null, evalTime);
        return toValidationResponse(result, coupon);
    }

    @Override
    public OrderResponse applyCoupon(String orderUuid, ApplyCouponRequest request, Long currentUserId) {
        String normalizedCode = normalizeCode(request.getCouponCode());
        Order order = orderRepository.findByOrderUuidWithItems(orderUuid)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        ensureOrderMutable(order);

        Coupon coupon = couponRepository.findByCodeIgnoreCaseForUpdate(normalizedCode)
                .orElseThrow(() -> new IllegalArgumentException("Invalid coupon code"));

        if (order.getCoupon() != null && !order.getCoupon().getId().equals(coupon.getId())) {
            if (!Boolean.TRUE.equals(coupon.getAllowStacking()) && !Boolean.TRUE.equals(order.getCoupon().getAllowStacking())) {
                throw new IllegalStateException("Only one coupon can be applied to an order");
            }
        }

        Customer customer = resolveCustomer(request.getCustomerUuid(), order.getRestaurant(), order.getCustomerPhone(), order.getCustomerEmail());
        BigDecimal subtotal = calculateCurrentSubtotal(order);

        ValidationResult validationResult = validateAndCompute(coupon, order.getRestaurant(), subtotal, customer, order,
            LocalDateTime.now());

        if (!validationResult.valid) {
            throw new IllegalStateException(validationResult.reason != null ? validationResult.reason : "Coupon is not applicable");
        }

        applyDiscountToOrder(order, coupon, validationResult);
        order.calculateTotals();
        orderRepository.save(order);

        upsertCouponUsage(order, coupon, customer, validationResult.computedDiscount, currentUserId);

        log.info("Coupon {} applied to order {} with discount {}", coupon.getCode(), order.getOrderUuid(), validationResult.computedDiscount);
        return orderMapper.toOrderResponse(order);
    }

    @Override
    public OrderResponse removeCoupon(String orderUuid, Long currentUserId) {
        Order order = orderRepository.findByOrderUuidWithItems(orderUuid)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        ensureOrderMutable(order);

        if (order.getCoupon() == null) {
            return orderMapper.toOrderResponse(order);
        }

        detachCoupon(order, "Coupon removed by user");
        order.calculateTotals();
        orderRepository.save(order);

        return orderMapper.toOrderResponse(order);
    }

    @Override
    public void revalidateAppliedCoupon(Order order) {
        if (order.getCoupon() == null) {
            return;
        }

        Coupon coupon = couponRepository.findById(order.getCoupon().getId())
                .orElse(null);

        if (coupon == null || Boolean.TRUE.equals(coupon.getIsDeleted())) {
            detachCoupon(order, "Coupon deleted");
            throw new IllegalStateException("Coupon is no longer available");
        }

        BigDecimal subtotal = calculateCurrentSubtotal(order);
        ValidationResult validationResult = validateAndCompute(coupon, order.getRestaurant(), subtotal, null, order,
            LocalDateTime.now());

        if (!validationResult.valid) {
            detachCoupon(order, validationResult.reason);
            throw new IllegalStateException("Coupon removed: " + validationResult.reason);
        }

        applyDiscountToOrder(order, coupon, validationResult);
        order.calculateTotals();
        orderRepository.save(order);
        upsertCouponUsage(order, coupon, null, validationResult.computedDiscount, null);
    }

    @Override
    @Transactional(readOnly = true)
    public CouponUsageSummaryResponse getUsageSummary(String couponUuid) {
        Coupon coupon = couponRepository.findByCouponUuidAndIsDeletedFalse(couponUuid)
                .orElseThrow(() -> new IllegalArgumentException("Coupon not found"));
        long totalUses = usageRepository.countByCouponIdAndIsDeletedFalse(coupon.getId());
        BigDecimal totalDiscount = usageRepository.sumDiscountByCouponId(coupon.getId());

        return CouponUsageSummaryResponse.builder()
                .couponUuid(coupon.getCouponUuid())
                .couponCode(coupon.getCode())
                .totalUses(totalUses)
                .totalDiscountGiven(totalDiscount)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public CouponValidationResponse suggestBestCoupon(SuggestCouponRequest request) {
        Restaurant restaurant = restaurantRepo.findByRestaurantUuidAndIsDeletedFalse(request.getRestaurantUuid())
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found"));

        Customer customer = resolveCustomer(request.getCustomerUuid(), restaurant, null, null);
        LocalDateTime now = LocalDateTime.now();

        CouponValidationResponse best = null;
        BigDecimal bestDiscount = BigDecimal.ZERO;

        for (Coupon coupon : couponRepository.findActiveCoupons(now)) {
            ValidationResult res = validateAndCompute(coupon, restaurant, request.getOrderAmount(), customer, null, now);
            if (res.valid && res.computedDiscount != null && res.computedDiscount.compareTo(bestDiscount) > 0) {
                bestDiscount = res.computedDiscount;
                best = toValidationResponse(res, coupon);
            }
        }

        if (best == null) {
            return CouponValidationResponse.builder()
                    .valid(false)
                    .reason("No applicable coupons found")
                    .build();
        }
        return best;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CouponResponse> getAllCoupons(String restaurantUuid, Pageable pageable) {
        Page<Coupon> coupons;
        if (StringUtils.hasText(restaurantUuid)) {
            coupons = couponRepository.findAllRelevantForRestaurant(restaurantUuid, CouponScopeType.GLOBAL_CHAIN, pageable);
        } else {
            coupons = couponRepository.findAllByIsDeletedFalse(pageable);
        }
        return coupons.map(c -> buildCouponResponse(c, getMappedRestaurants(c)));
    }

    private List<String> getMappedRestaurants(Coupon coupon) {
        if (coupon.getScopeType() != CouponScopeType.RESTAURANT_SPECIFIC) return List.of();
        return mappingRepository.findByCouponIdAndIsDeletedFalse(coupon.getId()).stream()
            .map(m -> m.getRestaurant() != null ? m.getRestaurant().getRestaurantUuid() : null)
            .filter(uuid -> uuid != null)
            .toList();
    }
    
    @Override
    @Transactional(readOnly = true)
    public CouponResponse getCouponByUuid(String couponUuid) {
        Coupon coupon = couponRepository.findByCouponUuidAndIsDeletedFalse(couponUuid)
                .orElseThrow(() -> new IllegalArgumentException("Coupon not found"));
        return buildCouponResponse(coupon, getMappedRestaurants(coupon));
    }

    @Override
    @CacheEvict(value = "couponByCode", allEntries = true)
    public CouponResponse updateCoupon(String couponUuid, UpdateCouponRequest request) {
        Coupon coupon = couponRepository.findByCouponUuidAndIsDeletedFalse(couponUuid)
                .orElseThrow(() -> new IllegalArgumentException("Coupon not found"));
        
        if (request.getEndDate() != null && request.getStartDate() != null && request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("End date must be after start date");
        }
        
        coupon.setName(request.getName());
        coupon.setDescription(request.getDescription());
        coupon.setDiscountType(request.getDiscountType());
        coupon.setDiscountValue(request.getDiscountValue());
        coupon.setMaxDiscountAmount(request.getMaxDiscountAmount());
        coupon.setMinOrderAmount(defaultZero(request.getMinOrderAmount()));
        coupon.setStartDate(request.getStartDate());
        coupon.setEndDate(request.getEndDate());
        coupon.setUsageLimitGlobal(request.getUsageLimitGlobal());
        coupon.setUsageLimitPerUser(request.getUsageLimitPerUser());
        coupon.setIsActive(request.getIsActive() == null || request.getIsActive());
        coupon.setAllowStacking(Boolean.TRUE.equals(request.getAllowStacking()));
        coupon.setScopeType(request.getScopeType());
        
        coupon = couponRepository.save(coupon);
        return buildCouponResponse(coupon, getMappedRestaurants(coupon));
    }

    @Override
    @CacheEvict(value = "couponByCode", allEntries = true)
    public void deleteCoupon(String couponUuid) {
        Coupon coupon = couponRepository.findByCouponUuidAndIsDeletedFalse(couponUuid)
                .orElseThrow(() -> new IllegalArgumentException("Coupon not found"));
        couponRepository.delete(coupon);
    }

    @Override
    @CacheEvict(value = "couponByCode", allEntries = true)
    public CouponResponse toggleCouponStatus(String couponUuid, boolean isActive) {
        Coupon coupon = couponRepository.findByCouponUuidAndIsDeletedFalse(couponUuid)
                .orElseThrow(() -> new IllegalArgumentException("Coupon not found"));
        coupon.setIsActive(isActive);
        coupon = couponRepository.save(coupon);
        return buildCouponResponse(coupon, getMappedRestaurants(coupon));
    }

    // ===== INTERNAL HELPERS =====

    private void validateCreateRequest(CreateCouponRequest request) {
        if (request.getEndDate() != null && request.getStartDate() != null && request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("End date must be after start date");
        }
        if (request.getScopeType() == CouponScopeType.RESTAURANT_SPECIFIC && (request.getRestaurantUuids() == null || request.getRestaurantUuids().isEmpty())) {
            throw new IllegalArgumentException("Restaurant-specific coupons must include at least one restaurant");
        }
        if (request.getScopeType() == CouponScopeType.GLOBAL_CHAIN && !StringUtils.hasText(request.getOwnerRestaurantUuid())) {
            throw new IllegalArgumentException("Global coupons must specify an owner restaurant uuid");
        }
    }

    private Restaurant resolveOwnerRestaurant(CreateCouponRequest request) {
        if (request.getScopeType() == CouponScopeType.GLOBAL_CHAIN) {
            return restaurantRepo.findByRestaurantUuidAndIsDeletedFalse(request.getOwnerRestaurantUuid())
                    .orElseThrow(() -> new IllegalArgumentException("Owner restaurant not found"));
        }
        if (request.getRestaurantUuids() != null && !request.getRestaurantUuids().isEmpty()) {
            return restaurantRepo.findByRestaurantUuidAndIsDeletedFalse(request.getRestaurantUuids().get(0))
                    .orElse(null);
        }
        return null;
    }

    private void attachRestaurants(List<String> restaurantUuids, Coupon coupon) {
        if (restaurantUuids == null || restaurantUuids.isEmpty()) {
            return;
        }
        List<CouponRestaurantMapping> mappings = new ArrayList<>();
        for (String uuid : restaurantUuids) {
            Restaurant restaurant = restaurantRepo.findByRestaurantUuidAndIsDeletedFalse(uuid)
                    .orElseThrow(() -> new IllegalArgumentException("Restaurant not found: " + uuid));
            mappings.add(CouponRestaurantMapping.builder()
                    .coupon(coupon)
                    .restaurant(restaurant)
                    .build());
        }
        mappingRepository.saveAll(mappings);
    }

    @Cacheable(value = "couponByCode", key = "#code.toUpperCase()")
    @Transactional(readOnly = true)
    public Optional<Coupon> findActiveCouponCached(String code) {
        return couponRepository.findByCodeIgnoreCaseAndIsDeletedFalse(code)
                .filter(c -> Boolean.TRUE.equals(c.getIsActive()));
    }

    private ValidationResult validateAndCompute(Coupon coupon,
                                               Restaurant restaurant,
                                               BigDecimal orderAmount,
                                               Customer customer,
                                               Order order,
                                               LocalDateTime evaluationTime) {
        ValidationResult result = new ValidationResult();
        result.coupon = coupon;
        result.valid = true;
        result.reason = null;

        if (!Boolean.TRUE.equals(coupon.getIsActive())) {
            return result.invalid("Coupon is inactive");
        }

        LocalDateTime now = evaluationTime != null ? evaluationTime : LocalDateTime.now();
        if (now.isBefore(coupon.getStartDate())) {
            return result.invalid("Coupon not started yet");
        }
        LocalDateTime inclusiveEnd = normalizeEndBoundary(coupon.getEndDate());
        if (now.isAfter(inclusiveEnd)) {
            return result.invalid("Coupon expired");
        }

        if (coupon.getScopeType() == CouponScopeType.RESTAURANT_SPECIFIC) {
            boolean mapped = mappingRepository.existsByCouponIdAndRestaurantIdAndIsDeletedFalse(coupon.getId(), restaurant.getId());
            if (!mapped) {
                return result.invalid("Coupon not applicable for this restaurant");
            }
            if (Boolean.TRUE.equals(restaurant.getIsDeleted()) || Boolean.FALSE.equals(restaurant.getIsActive())) {
                return result.invalid("Restaurant is inactive for this coupon");
            }
        } else {
            Restaurant orderRoot = restaurant.getRootRestaurant();
            Restaurant ownerRoot = coupon.getOwnerRestaurant() != null ? coupon.getOwnerRestaurant().getRootRestaurant() : null;
            if (ownerRoot != null && !ownerRoot.getId().equals(orderRoot.getId())) {
                return result.invalid("Coupon restricted to chain");
            }
        }

        BigDecimal minimum = defaultZero(coupon.getMinOrderAmount());
        if (orderAmount == null || orderAmount.compareTo(minimum) < 0) {
            return result.invalid("Order amount below minimum for coupon");
        }

        long existingForOrder = order != null ? usageRepository.countUsageForOrder(coupon.getId(), order.getId()) : 0L;
        long usedGlobally = usageRepository.countByCouponIdAndIsDeletedFalse(coupon.getId()) - existingForOrder;
        if (coupon.getUsageLimitGlobal() != null && usedGlobally >= coupon.getUsageLimitGlobal()) {
            return result.invalid("Coupon usage limit reached");
        }
        result.remainingGlobalUses = coupon.getUsageLimitGlobal() != null
                ? Math.max(0, coupon.getUsageLimitGlobal() - (int) usedGlobally - 1)
                : null;

        if (coupon.getUsageLimitPerUser() != null && customer != null) {
            long usedByCustomer = usageRepository.countByCouponIdAndCustomerIdAndIsDeletedFalse(coupon.getId(), customer.getId()) - existingForOrder;
            if (usedByCustomer >= coupon.getUsageLimitPerUser()) {
                return result.invalid("Coupon usage limit reached for customer");
            }
            result.remainingUserUses = Math.max(0, coupon.getUsageLimitPerUser() - (int) usedByCustomer - 1);
        }

        BigDecimal discount = computeDiscount(coupon, orderAmount);
        result.computedDiscount = discount;
        return result;
    }

    private BigDecimal computeDiscount(Coupon coupon, BigDecimal orderAmount) {
        BigDecimal discount;
        if (coupon.getDiscountType() == DiscountType.PERCENTAGE) {
            discount = orderAmount.multiply(coupon.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else {
            discount = coupon.getDiscountValue();
        }

        if (coupon.getMaxDiscountAmount() != null && coupon.getMaxDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
            discount = discount.min(coupon.getMaxDiscountAmount());
        }

        if (discount.compareTo(BigDecimal.ZERO) < 0) {
            discount = BigDecimal.ZERO;
        }
        return discount.setScale(2, RoundingMode.HALF_UP);
    }

    private void applyDiscountToOrder(Order order, Coupon coupon, ValidationResult validationResult) {
        if (coupon.getDiscountType() == DiscountType.PERCENTAGE) {
            order.setDiscountPercentage(coupon.getDiscountValue());
        } else {
            order.setDiscountPercentage(null);
        }
        order.setDiscountAmount(validationResult.computedDiscount);
        order.setCouponCode(coupon.getCode());
        order.setCoupon(coupon);
    }

    private void upsertCouponUsage(Order order, Coupon coupon, Customer customer, BigDecimal discountApplied, Long appliedByUserId) {
        Optional<CouponUsage> existing = usageRepository.findByCouponIdAndOrderId(coupon.getId(), order.getId());
        CouponUsage usage = existing.orElseGet(() -> CouponUsage.builder()
                .coupon(coupon)
                .order(order)
                .restaurant(order.getRestaurant())
                .customer(customer)
                .build());

        usage.setIsDeleted(false);
        usage.setDeletedAt(null);
        usage.setDiscountApplied(discountApplied);
        if (appliedByUserId != null) {
            userAuthRepository.findById(appliedByUserId).ifPresent(usage::setUsedBy);
        }
        usageRepository.save(usage);
    }

    private void detachCoupon(Order order, String reason) {
        usageRepository.findByCouponIdAndOrderIdAndIsDeletedFalse(order.getCoupon().getId(), order.getId())
                .ifPresent(usageRepository::delete);
        order.setCoupon(null);
        order.setCouponCode(null);
        order.setDiscountAmount(BigDecimal.ZERO);
        order.setDiscountPercentage(null);
        order.calculateTotals();
        log.info("Coupon detached from order {}: {}", order.getOrderUuid(), reason);
    }

    private CouponResponse buildCouponResponse(Coupon coupon, List<String> restaurantUuids) {
        return CouponResponse.builder()
                .couponUuid(coupon.getCouponUuid())
                .code(coupon.getCode())
                .name(coupon.getName())
                .description(coupon.getDescription())
                .discountType(coupon.getDiscountType())
                .discountValue(coupon.getDiscountValue())
                .maxDiscountAmount(coupon.getMaxDiscountAmount())
                .minOrderAmount(coupon.getMinOrderAmount())
                .startDate(coupon.getStartDate())
                .endDate(coupon.getEndDate())
                .usageLimitGlobal(coupon.getUsageLimitGlobal())
                .usageLimitPerUser(coupon.getUsageLimitPerUser())
                .active(coupon.getIsActive())
                .allowStacking(coupon.getAllowStacking())
                .scopeType(coupon.getScopeType())
                .ownerRestaurantUuid(coupon.getOwnerRestaurant() != null ? coupon.getOwnerRestaurant().getRestaurantUuid() : null)
                .restaurantUuids(restaurantUuids)
                .build();
    }

    private CouponValidationResponse toValidationResponse(ValidationResult result, Coupon coupon) {
        return CouponValidationResponse.builder()
                .valid(result.valid)
                .reason(result.reason)
                .couponCode(coupon.getCode())
                .couponName(coupon.getName())
                .discountType(coupon.getDiscountType())
                .discountValue(coupon.getDiscountValue())
                .maxDiscountAmount(coupon.getMaxDiscountAmount())
                .minOrderAmount(coupon.getMinOrderAmount())
                .computedDiscount(result.computedDiscount)
                .remainingGlobalUses(result.remainingGlobalUses)
                .remainingUserUses(result.remainingUserUses)
                .startDate(coupon.getStartDate())
                .endDate(coupon.getEndDate())
                .build();
    }

    private String normalizeCode(String code) {
        if (code == null) {
            throw new IllegalArgumentException("Coupon code is required");
        }
        return code.trim().toUpperCase(Locale.ROOT);
    }

    private void ensureOrderMutable(Order order) {
        if (!order.canBeModified()) {
            throw new IllegalStateException("Order cannot be modified in current status: " + order.getStatus());
        }
    }

    private BigDecimal calculateCurrentSubtotal(Order order) {
        return order.getActiveItems().stream()
                .map(item -> item.getLineTotal())
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private Customer resolveCustomer(String customerUuid, Restaurant restaurant, String phone, String email) {
        if (StringUtils.hasText(customerUuid)) {
            return customerRepository.findByCustomerUuidAndIsDeletedFalse(customerUuid)
                    .orElse(null);
        }
        if (StringUtils.hasText(phone)) {
            return customerRepository.findByPhoneAndRestaurantIdAndIsDeletedFalse(phone, restaurant.getId())
                    .orElse(null);
        }
        if (StringUtils.hasText(email)) {
            return customerRepository.findByEmailIgnoreCaseAndRestaurantIdAndIsDeletedFalse(email, restaurant.getId())
                    .orElse(null);
        }
        return null;
    }

    private BigDecimal defaultZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    /**
     * Treat endDate as inclusive through the end of the specified minute.
     * Many coupons are entered with a date-only value (00:00 time); this bumps
     * midnight boundaries to 23:59:59.999 to avoid premature expiry.
     */
    private LocalDateTime normalizeEndBoundary(LocalDateTime endDate) {
        if (endDate == null) return LocalDateTime.MAX;
        if (endDate.toLocalTime().equals(LocalTime.MIDNIGHT)) {
            return endDate.with(LocalTime.MAX);
        }
        return endDate;
    }

    private static class ValidationResult {
        private boolean valid;
        private String reason;
        private Coupon coupon;
        private BigDecimal computedDiscount;
        private Integer remainingGlobalUses;
        private Integer remainingUserUses;

        ValidationResult invalid(String reason) {
            this.valid = false;
            this.reason = reason;
            this.computedDiscount = BigDecimal.ZERO;
            return this;
        }
    }
}
