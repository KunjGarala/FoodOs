package org.foodos.coupon.service;

import org.foodos.coupon.dto.request.ApplyCouponRequest;
import org.foodos.coupon.dto.request.CreateCouponRequest;
import org.foodos.coupon.dto.request.SuggestCouponRequest;
import org.foodos.coupon.dto.request.ValidateCouponRequest;
import org.foodos.coupon.dto.response.CouponResponse;
import org.foodos.coupon.dto.response.CouponValidationResponse;
import org.foodos.coupon.dto.response.CouponUsageSummaryResponse;
import org.foodos.order.dto.response.OrderResponse;
import org.foodos.order.entity.Order;
import org.foodos.coupon.dto.request.UpdateCouponRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CouponService {

    CouponResponse createCoupon(CreateCouponRequest request, Long creatorUserId);

    CouponValidationResponse validateCoupon(ValidateCouponRequest request);

    OrderResponse applyCoupon(String orderUuid, ApplyCouponRequest request, Long currentUserId);

    OrderResponse removeCoupon(String orderUuid, Long currentUserId);

    /**
     * Re-validates the coupon already attached to the order after cart/billing changes.
     * Removes the coupon (and usage entry) if it is no longer valid.
     */
    void revalidateAppliedCoupon(Order order);

    CouponUsageSummaryResponse getUsageSummary(String couponUuid);

    CouponValidationResponse suggestBestCoupon(SuggestCouponRequest request);

    Page<CouponResponse> getAllCoupons(String restaurantUuid, Pageable pageable);

    CouponResponse getCouponByUuid(String couponUuid);

    CouponResponse updateCoupon(String couponUuid, UpdateCouponRequest request);

    void deleteCoupon(String couponUuid);

    CouponResponse toggleCouponStatus(String couponUuid, boolean isActive);
}
