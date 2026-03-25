package org.foodos.coupon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.coupon.dto.request.CreateCouponRequest;
import org.foodos.coupon.dto.request.SuggestCouponRequest;
import org.foodos.coupon.dto.request.ValidateCouponRequest;
import org.foodos.coupon.dto.request.UpdateCouponRequest;
import org.foodos.coupon.dto.response.CouponResponse;
import org.foodos.coupon.dto.response.CouponValidationResponse;
import org.foodos.coupon.dto.response.CouponUsageSummaryResponse;
import org.foodos.coupon.service.CouponService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Slf4j
@RestController
@RequestMapping("/api/v1/coupons")
@RequiredArgsConstructor
@Tag(name = "Coupon Management", description = "Create and validate coupons")
public class CouponController {

    private final CouponService couponService;

    @Operation(summary = "Create coupon", description = "Creates a new coupon with scope and limits")
    @PostMapping
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
    public ResponseEntity<CouponResponse> createCoupon(@Valid @RequestBody CreateCouponRequest request,
                                                       @AuthenticationPrincipal UserAuthEntity currentUser) {
        log.info("REST: Creating coupon {}", request.getCode());
        CouponResponse response = couponService.createCoupon(request, currentUser != null ? currentUser.getId() : null);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Validate coupon", description = "Validates coupon against restaurant and cart amount without applying it")
    @PostMapping("/validate")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'WAITER')")
    public ResponseEntity<CouponValidationResponse> validateCoupon(@Valid @RequestBody ValidateCouponRequest request) {
        log.info("REST: Validating coupon {} for restaurant {}", request.getCouponCode(), request.getRestaurantUuid());
        CouponValidationResponse response = couponService.validateCoupon(request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Suggest best coupon", description = "Returns the highest savings coupon for the cart")
    @PostMapping("/suggest")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'WAITER')")
    public ResponseEntity<CouponValidationResponse> suggestCoupon(@Valid @RequestBody SuggestCouponRequest request) {
        CouponValidationResponse response = couponService.suggestBestCoupon(request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Coupon usage summary", description = "Aggregated usage counts and discount value for reporting")
    @GetMapping("/{couponUuid}/usage-summary")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
    public ResponseEntity<CouponUsageSummaryResponse> usageSummary(@PathVariable String couponUuid) {
        CouponUsageSummaryResponse response = couponService.getUsageSummary(couponUuid);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get all coupons", description = "List all coupons, optionally filtered by restaurant")
    @GetMapping
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
    public ResponseEntity<Page<CouponResponse>> getAllCoupons(
            @RequestParam(required = false) String restaurantUuid,
            Pageable pageable) {
        Page<CouponResponse> response = couponService.getAllCoupons(restaurantUuid, pageable);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get coupon by UUID", description = "Get details of a specific coupon")
    @GetMapping("/{couponUuid}")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
    public ResponseEntity<CouponResponse> getCoupon(@PathVariable String couponUuid) {
        CouponResponse response = couponService.getCouponByUuid(couponUuid);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Update coupon", description = "Update details of an existing coupon")
    @PutMapping("/{couponUuid}")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
    public ResponseEntity<CouponResponse> updateCoupon(
            @PathVariable String couponUuid,
            @Valid @RequestBody UpdateCouponRequest request) {
        CouponResponse response = couponService.updateCoupon(couponUuid, request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Delete coupon", description = "Soft delete a coupon")
    @DeleteMapping("/{couponUuid}")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
    public ResponseEntity<Void> deleteCoupon(@PathVariable String couponUuid) {
        couponService.deleteCoupon(couponUuid);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Toggle coupon status", description = "Activate or deactivate a coupon")
    @PatchMapping("/{couponUuid}/toggle-status")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
    public ResponseEntity<CouponResponse> toggleStatus(
            @PathVariable String couponUuid,
            @RequestParam boolean isActive) {
        CouponResponse response = couponService.toggleCouponStatus(couponUuid, isActive);
        return ResponseEntity.ok(response);
    }
}
