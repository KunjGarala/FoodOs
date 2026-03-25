package org.foodos.customer.controller;

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
import org.foodos.customer.dto.request.UpdateCustomerRequest;
import org.foodos.customer.dto.response.*;
import org.foodos.customer.service.CustomerCrmService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Customer CRM Controller
 * REST API for customer relationship management
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/customers")
@RequiredArgsConstructor
@Tag(name = "Customer CRM", description = "APIs for customer relationship management")
public class CustomerCrmController {

    private final CustomerCrmService customerCrmService;

    // ===== LIST CUSTOMERS =====

    @Operation(summary = "Get all customers for a restaurant", description = "Returns paginated list of customers")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Customers retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @GetMapping("/restaurant/{restaurantUuid}")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'WAITER')")
    public ResponseEntity<Page<CustomerSummaryResponse>> getCustomers(
            @Parameter(description = "Restaurant UUID") @PathVariable String restaurantUuid,
            @PageableDefault(size = 20, sort = "lastOrderDate", direction = Sort.Direction.DESC) Pageable pageable) {

        log.info("REST: Fetching customers for restaurant: {}", restaurantUuid);
        Page<CustomerSummaryResponse> customers = customerCrmService.getCustomersByRestaurant(restaurantUuid, pageable);
        return ResponseEntity.ok(customers);
    }

    // ===== SEARCH CUSTOMERS =====

    @Operation(summary = "Search customers", description = "Search customers by name, phone, or email")
    @GetMapping("/restaurant/{restaurantUuid}/search")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'WAITER')")
    public ResponseEntity<Page<CustomerSummaryResponse>> searchCustomers(
            @PathVariable String restaurantUuid,
            @RequestParam String q,
            @PageableDefault(size = 20) Pageable pageable) {

        log.info("REST: Searching customers for restaurant: {} with term: {}", restaurantUuid, q);
        Page<CustomerSummaryResponse> customers = customerCrmService.searchCustomers(restaurantUuid, q, pageable);
        return ResponseEntity.ok(customers);
    }

    // ===== GET CUSTOMER DETAIL =====

    @Operation(summary = "Get customer detail", description = "Get detailed customer profile with order history")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Customer detail retrieved"),
        @ApiResponse(responseCode = "404", description = "Customer not found")
    })
    @GetMapping("/{customerUuid}")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'WAITER')")
    public ResponseEntity<CustomerDetailResponse> getCustomerDetail(
            @Parameter(description = "Customer UUID") @PathVariable String customerUuid) {

        log.info("REST: Fetching customer detail: {}", customerUuid);
        CustomerDetailResponse detail = customerCrmService.getCustomerDetail(customerUuid);
        return ResponseEntity.ok(detail);
    }

    // ===== UPDATE CUSTOMER =====

    @Operation(summary = "Update customer CRM data", description = "Update notes, tags, and other CRM fields")
    @PutMapping("/{customerUuid}")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
    public ResponseEntity<CustomerSummaryResponse> updateCustomer(
            @PathVariable String customerUuid,
            @Valid @RequestBody UpdateCustomerRequest request) {

        log.info("REST: Updating customer: {}", customerUuid);
        CustomerSummaryResponse updated = customerCrmService.updateCustomer(customerUuid, request);
        return ResponseEntity.ok(updated);
    }

    // ===== CRM STATS =====

    @Operation(summary = "Get CRM statistics", description = "Overview stats: total customers, returning, new, return rate")
    @GetMapping("/restaurant/{restaurantUuid}/stats")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
    public ResponseEntity<CrmStatsResponse> getCrmStats(
            @PathVariable String restaurantUuid) {

        log.info("REST: Fetching CRM stats for restaurant: {}", restaurantUuid);
        CrmStatsResponse stats = customerCrmService.getCrmStats(restaurantUuid);
        return ResponseEntity.ok(stats);
    }

    // ===== TOP CUSTOMERS =====

    @Operation(summary = "Get top customers by spending")
    @GetMapping("/restaurant/{restaurantUuid}/top-spenders")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
    public ResponseEntity<Page<CustomerSummaryResponse>> getTopSpenders(
            @PathVariable String restaurantUuid,
            @PageableDefault(size = 10) Pageable pageable) {

        return ResponseEntity.ok(customerCrmService.getTopCustomersBySpending(restaurantUuid, pageable));
    }

    @Operation(summary = "Get top customers by visit count")
    @GetMapping("/restaurant/{restaurantUuid}/top-visitors")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
    public ResponseEntity<Page<CustomerSummaryResponse>> getTopVisitors(
            @PathVariable String restaurantUuid,
            @PageableDefault(size = 10) Pageable pageable) {

        return ResponseEntity.ok(customerCrmService.getTopCustomersByVisits(restaurantUuid, pageable));
    }
}
