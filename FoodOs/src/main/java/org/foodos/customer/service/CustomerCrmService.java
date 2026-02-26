package org.foodos.customer.service;

import org.foodos.customer.dto.request.UpdateCustomerRequest;
import org.foodos.customer.dto.response.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Customer CRM Service Interface
 */
public interface CustomerCrmService {

    /**
     * Get all customers for a restaurant (paginated)
     */
    Page<CustomerSummaryResponse> getCustomersByRestaurant(String restaurantUuid, Pageable pageable);

    /**
     * Search customers by name, phone, or email
     */
    Page<CustomerSummaryResponse> searchCustomers(String restaurantUuid, String searchTerm, Pageable pageable);

    /**
     * Get detailed customer profile with order history
     */
    CustomerDetailResponse getCustomerDetail(String customerUuid);

    /**
     * Update CRM-specific customer fields (notes, tags, etc.)
     */
    CustomerSummaryResponse updateCustomer(String customerUuid, UpdateCustomerRequest request);

    /**
     * Get CRM statistics overview for a restaurant
     */
    CrmStatsResponse getCrmStats(String restaurantUuid);

    /**
     * Get top customers by spending
     */
    Page<CustomerSummaryResponse> getTopCustomersBySpending(String restaurantUuid, Pageable pageable);

    /**
     * Get top customers by visit count
     */
    Page<CustomerSummaryResponse> getTopCustomersByVisits(String restaurantUuid, Pageable pageable);

    /**
     * Sync/create customer record from an order.
     * Called internally when an order is created or completed.
     */
    void syncCustomerFromOrder(Long restaurantId, String customerName, String customerPhone,
                                String customerEmail, String deliveryAddress,
                                java.math.BigDecimal orderTotal, java.time.LocalDate orderDate, String orderType);
}
