package org.foodos.customer.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.customer.dto.request.UpdateCustomerRequest;
import org.foodos.customer.dto.response.*;
import org.foodos.customer.entity.Customer;
import org.foodos.customer.repository.CustomerRepository;
import org.foodos.customer.service.CustomerCrmService;
import org.foodos.order.entity.Order;
import org.foodos.order.repository.OrderItemRepository;
import org.foodos.order.repository.OrderRepository;
import org.foodos.restaurant.entity.Restaurant;
import org.foodos.restaurant.repository.RestaurantRepo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Customer CRM Service Implementation
 *
 * Aggregates customer data from orders and provides CRM features.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerCrmServiceImpl implements CustomerCrmService {

    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final RestaurantRepo restaurantRepository;

    // ===== LIST & SEARCH =====

    @Override
    @Transactional(readOnly = true)
    public Page<CustomerSummaryResponse> getCustomersByRestaurant(String restaurantUuid, Pageable pageable) {
        log.debug("Fetching customers for restaurant: {}", restaurantUuid);
        Page<Customer> customers = customerRepository.findAllByRestaurantUuid(restaurantUuid, pageable);
        return customers.map(this::toSummaryResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CustomerSummaryResponse> searchCustomers(String restaurantUuid, String searchTerm, Pageable pageable) {
        log.debug("Searching customers for restaurant: {} with term: {}", restaurantUuid, searchTerm);
        Page<Customer> customers = customerRepository.searchCustomers(restaurantUuid, searchTerm, pageable);
        return customers.map(this::toSummaryResponse);
    }

    // ===== DETAIL =====

    @Override
    @Transactional(readOnly = true)
    public CustomerDetailResponse getCustomerDetail(String customerUuid) {
        log.debug("Fetching customer detail: {}", customerUuid);
        Customer customer = customerRepository.findByCustomerUuidAndIsDeletedFalse(customerUuid)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + customerUuid));

        // Get recent orders for this customer by phone + restaurant
        String restaurantUuid = customer.getRestaurant().getRestaurantUuid();
        Page<Order> recentOrders = orderRepository.searchOrdersByRestaurantUuid(
                restaurantUuid, customer.getPhone(), PageRequest.of(0, 20));

        List<CustomerOrderResponse> orderHistory = recentOrders.getContent().stream()
                .map(this::toCustomerOrderResponse)
                .collect(Collectors.toList());

        // Get favorite items from order items
        List<FavoriteItemResponse> favoriteItems = findFavoriteItems(customer);

        return CustomerDetailResponse.builder()
                .customerUuid(customer.getCustomerUuid())
                .name(customer.getName())
                .phone(customer.getPhone())
                .email(customer.getEmail())
                .address(customer.getAddress())
                .notes(customer.getNotes())
                .tags(customer.getTags())
                .totalOrders(customer.getTotalOrders())
                .totalSpent(customer.getTotalSpent())
                .averageOrderValue(customer.getAverageOrderValue())
                .lastOrderDate(customer.getLastOrderDate())
                .firstOrderDate(customer.getFirstOrderDate())
                .lastOrderType(customer.getLastOrderType())
                .createdAt(customer.getCreatedAt())
                .recentOrders(orderHistory)
                .favoriteItems(favoriteItems)
                .build();
    }

    // ===== UPDATE =====

    @Override
    @Transactional
    public CustomerSummaryResponse updateCustomer(String customerUuid, UpdateCustomerRequest request) {
        log.info("Updating customer CRM data: {}", customerUuid);
        Customer customer = customerRepository.findByCustomerUuidAndIsDeletedFalse(customerUuid)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + customerUuid));

        if (request.getName() != null) customer.setName(request.getName());
        if (request.getEmail() != null) customer.setEmail(request.getEmail());
        if (request.getAddress() != null) customer.setAddress(request.getAddress());
        if (request.getNotes() != null) customer.setNotes(request.getNotes());
        if (request.getTags() != null) customer.setTags(request.getTags());

        customer = customerRepository.save(customer);
        return toSummaryResponse(customer);
    }

    // ===== STATS =====

    @Override
    @Transactional(readOnly = true)
    public CrmStatsResponse getCrmStats(String restaurantUuid) {
        log.debug("Fetching CRM stats for restaurant: {}", restaurantUuid);
        Long totalCustomers = customerRepository.countByRestaurantUuid(restaurantUuid);
        Long returningCustomers = customerRepository.countReturningCustomers(restaurantUuid);
        Long newCustomers = totalCustomers - returningCustomers;

        BigDecimal returnRate = BigDecimal.ZERO;
        if (totalCustomers > 0) {
            returnRate = BigDecimal.valueOf(returningCustomers)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(totalCustomers), 2, RoundingMode.HALF_UP);
        }

        return CrmStatsResponse.builder()
                .totalCustomers(totalCustomers)
                .returningCustomers(returningCustomers)
                .newCustomers(newCustomers)
                .returnRate(returnRate)
                .build();
    }

    // ===== TOP CUSTOMERS =====

    @Override
    @Transactional(readOnly = true)
    public Page<CustomerSummaryResponse> getTopCustomersBySpending(String restaurantUuid, Pageable pageable) {
        return customerRepository.findTopBySpending(restaurantUuid, pageable).map(this::toSummaryResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CustomerSummaryResponse> getTopCustomersByVisits(String restaurantUuid, Pageable pageable) {
        return customerRepository.findTopByVisits(restaurantUuid, pageable).map(this::toSummaryResponse);
    }

    // ===== SYNC FROM ORDER =====

    @Override
    @Transactional
    public void syncCustomerFromOrder(Long restaurantId, String customerName, String customerPhone,
                                       String customerEmail, String deliveryAddress,
                                       BigDecimal orderTotal, LocalDate orderDate, String orderType) {
        String normalizedName = normalize(customerName);
        String normalizedPhone = normalize(customerPhone);
        String normalizedEmail = normalizeEmail(customerEmail);
        String normalizedAddress = normalize(deliveryAddress);
        LocalDate effectiveOrderDate = orderDate != null ? orderDate : LocalDate.now();

        Optional<Customer> existingOpt = findCustomerByIdentifiers(restaurantId, normalizedPhone, normalizedEmail);

        if (existingOpt.isPresent()) {
            Customer customer = existingOpt.get();
            applyCustomerDetails(customer, normalizedName, normalizedPhone, normalizedEmail, normalizedAddress);
            if (orderTotal != null && orderTotal.compareTo(BigDecimal.ZERO) > 0) {
                customer.incrementStats(orderTotal, effectiveOrderDate, orderType);
            } else {
                touchCustomerActivity(customer, effectiveOrderDate, orderType);
            }
            customerRepository.save(customer);
            log.info("Updated existing customer CRM record for restaurant: {}", restaurantId);
            return;
        }

        if (!StringUtils.hasText(normalizedPhone)) {
            log.debug("Skipping CRM customer creation for restaurant {} because no phone was provided", restaurantId);
            return;
        }

        Customer customer = buildNewCustomer(restaurantId, normalizedName, normalizedPhone, normalizedEmail,
                normalizedAddress, orderTotal, effectiveOrderDate, orderType);

        customerRepository.save(customer);
        log.info("Created new customer CRM record: {} for restaurant: {}", normalizedPhone, restaurantId);
    }

    @Override
    @Transactional
    public void syncCustomerProfileFromOrder(Long restaurantId, String previousCustomerPhone, String previousCustomerEmail,
                                             String customerName, String customerPhone, String customerEmail,
                                             String deliveryAddress, LocalDate orderDate, String orderType) {
        String normalizedName = normalize(customerName);
        String normalizedPhone = normalize(customerPhone);
        String normalizedEmail = normalizeEmail(customerEmail);
        String normalizedAddress = normalize(deliveryAddress);
        String normalizedPreviousPhone = normalize(previousCustomerPhone);
        String normalizedPreviousEmail = normalizeEmail(previousCustomerEmail);
        LocalDate effectiveOrderDate = orderDate != null ? orderDate : LocalDate.now();

        Optional<Customer> currentMatch = findCustomerByIdentifiers(restaurantId, normalizedPhone, normalizedEmail);
        Optional<Customer> previousMatch = findCustomerByIdentifiers(
                restaurantId, normalizedPreviousPhone, normalizedPreviousEmail);

        Customer customer = currentMatch.orElseGet(() -> previousMatch.orElse(null));

        if (customer != null) {
            applyCustomerDetails(customer, normalizedName, normalizedPhone, normalizedEmail, normalizedAddress);
            touchCustomerActivity(customer, effectiveOrderDate, orderType);
            customerRepository.save(customer);
            removeDisposablePreviousMatch(currentMatch, previousMatch);
            log.info("Synced customer profile from POS order flow for restaurant: {}", restaurantId);
            return;
        }

        if (!StringUtils.hasText(normalizedPhone)) {
            log.debug(
                    "Skipping POS customer profile creation for restaurant {} because no phone matched and no phone was provided",
                    restaurantId);
            return;
        }

        Customer newCustomer = buildNewCustomer(restaurantId, normalizedName, normalizedPhone, normalizedEmail,
                normalizedAddress, BigDecimal.ZERO, effectiveOrderDate, orderType);
        customerRepository.save(newCustomer);
        log.info("Created customer CRM profile from POS order flow: {} for restaurant: {}", normalizedPhone, restaurantId);
    }

    // ===== PRIVATE HELPERS =====

    private CustomerSummaryResponse toSummaryResponse(Customer customer) {
        return CustomerSummaryResponse.builder()
                .customerUuid(customer.getCustomerUuid())
                .name(customer.getName())
                .phone(customer.getPhone())
                .email(customer.getEmail())
                .totalOrders(customer.getTotalOrders())
                .totalSpent(customer.getTotalSpent())
                .averageOrderValue(customer.getAverageOrderValue())
                .lastOrderDate(customer.getLastOrderDate())
                .firstOrderDate(customer.getFirstOrderDate())
                .lastOrderType(customer.getLastOrderType())
                .tags(customer.getTags())
                .createdAt(customer.getCreatedAt())
                .build();
    }

    private CustomerOrderResponse toCustomerOrderResponse(Order order) {
        return CustomerOrderResponse.builder()
                .orderUuid(order.getOrderUuid())
                .orderNumber(order.getOrderNumber())
                .orderDate(order.getOrderDate())
                .orderTime(order.getOrderTime())
                .orderType(order.getOrderType() != null ? order.getOrderType().name() : null)
                .status(order.getStatus() != null ? order.getStatus().name() : null)
                .totalAmount(order.getTotalAmount())
                .itemCount(order.getItemCount())
                .tableNumber(order.getTable() != null ? order.getTable().getTableNumber() : null)
                .build();
    }

    /**
     * Find the customer's most frequently ordered items using native query on order_items
     * joined through orders matching this customer's phone number.
     */
    private List<FavoriteItemResponse> findFavoriteItems(Customer customer) {
        try {
            // Search orders by the customer's phone to find favorite items
            Page<Order> orders = orderRepository.searchOrdersByRestaurantUuid(
                    customer.getRestaurant().getRestaurantUuid(),
                    customer.getPhone(),
                    PageRequest.of(0, 100));

            // Aggregate items by product name
            return orders.getContent().stream()
                    .flatMap(order -> order.getItems().stream())
                    .filter(item -> !item.getIsCancelled())
                    .collect(Collectors.groupingBy(
                            item -> item.getProductName(),
                            Collectors.counting()))
                    .entrySet().stream()
                    .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                    .limit(5)
                    .map(entry -> FavoriteItemResponse.builder()
                            .productName(entry.getKey())
                            .timesOrdered(entry.getValue())
                            .build())
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("Could not fetch favorite items for customer: {}", customer.getCustomerUuid(), e);
            return List.of();
        }
    }

    private Optional<Customer> findCustomerByIdentifiers(Long restaurantId, String customerPhone, String customerEmail) {
        if (StringUtils.hasText(customerPhone)) {
            Optional<Customer> customerByPhone = customerRepository.findByPhoneAndRestaurantIdAndIsDeletedFalse(
                    customerPhone, restaurantId);
            if (customerByPhone.isPresent()) {
                return customerByPhone;
            }
        }

        if (StringUtils.hasText(customerEmail)) {
            return customerRepository.findByEmailIgnoreCaseAndRestaurantIdAndIsDeletedFalse(customerEmail, restaurantId);
        }

        return Optional.empty();
    }

    private Customer buildNewCustomer(Long restaurantId, String customerName, String customerPhone, String customerEmail,
                                      String deliveryAddress, BigDecimal orderTotal, LocalDate orderDate,
                                      String orderType) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new RuntimeException("Restaurant not found: " + restaurantId));

        Customer customer = Customer.builder()
                .restaurant(restaurant)
                .name(defaultCustomerName(customerName))
                .phone(customerPhone)
                .email(customerEmail)
                .address(deliveryAddress)
                .build();

        initializeOrderSnapshot(customer, orderTotal, orderDate, orderType);
        return customer;
    }

    private void initializeOrderSnapshot(Customer customer, BigDecimal orderTotal, LocalDate orderDate, String orderType) {
        BigDecimal safeOrderTotal = orderTotal != null ? orderTotal : BigDecimal.ZERO;
        boolean hasCountableOrder = safeOrderTotal.compareTo(BigDecimal.ZERO) > 0;

        customer.setTotalOrders(hasCountableOrder ? 1 : 0);
        customer.setTotalSpent(hasCountableOrder ? safeOrderTotal : BigDecimal.ZERO);
        customer.setAverageOrderValue(hasCountableOrder ? safeOrderTotal : BigDecimal.ZERO);

        if (orderDate != null) {
            customer.setFirstOrderDate(orderDate);
            customer.setLastOrderDate(orderDate);
        }

        customer.setLastOrderType(orderType);
    }

    private void touchCustomerActivity(Customer customer, LocalDate orderDate, String orderType) {
        if (orderDate == null) {
            return;
        }

        if (customer.getFirstOrderDate() == null || orderDate.isBefore(customer.getFirstOrderDate())) {
            customer.setFirstOrderDate(orderDate);
        }

        if (customer.getLastOrderDate() == null || !orderDate.isBefore(customer.getLastOrderDate())) {
            customer.setLastOrderDate(orderDate);
            if (StringUtils.hasText(orderType)) {
                customer.setLastOrderType(orderType);
            }
        }
    }

    private void applyCustomerDetails(Customer customer, String customerName, String customerPhone, String customerEmail,
                                      String deliveryAddress) {
        if (StringUtils.hasText(customerName)) {
            customer.setName(customerName);
        } else if (!StringUtils.hasText(customer.getName())) {
            customer.setName("Unknown");
        }

        if (StringUtils.hasText(customerPhone)) {
            customer.setPhone(customerPhone);
        }

        if (StringUtils.hasText(customerEmail)) {
            customer.setEmail(customerEmail);
        }

        if (StringUtils.hasText(deliveryAddress)) {
            customer.setAddress(deliveryAddress);
        }
    }

    private void removeDisposablePreviousMatch(Optional<Customer> currentMatch, Optional<Customer> previousMatch) {
        if (currentMatch.isEmpty() || previousMatch.isEmpty()) {
            return;
        }

        Customer currentCustomer = currentMatch.get();
        Customer previousCustomer = previousMatch.get();

        if (currentCustomer.getId().equals(previousCustomer.getId()) || !isDisposableCustomer(previousCustomer)) {
            return;
        }

        customerRepository.delete(previousCustomer);
        log.info("Removed temporary duplicate customer CRM profile: {}", previousCustomer.getCustomerUuid());
    }

    private boolean isDisposableCustomer(Customer customer) {
        boolean hasNoOrders = customer.getTotalOrders() == null || customer.getTotalOrders() == 0;
        boolean hasNoSpend = customer.getTotalSpent() == null || customer.getTotalSpent().compareTo(BigDecimal.ZERO) == 0;
        boolean hasNoAverage = customer.getAverageOrderValue() == null
                || customer.getAverageOrderValue().compareTo(BigDecimal.ZERO) == 0;

        return hasNoOrders
                && hasNoSpend
                && hasNoAverage
                && !StringUtils.hasText(customer.getNotes())
                && !StringUtils.hasText(customer.getTags());
    }

    private String defaultCustomerName(String customerName) {
        return StringUtils.hasText(customerName) ? customerName : "Unknown";
    }

    private String normalize(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String normalizeEmail(String email) {
        return StringUtils.hasText(email) ? email.trim().toLowerCase() : null;
    }
}
