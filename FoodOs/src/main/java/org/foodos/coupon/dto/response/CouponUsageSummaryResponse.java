package org.foodos.coupon.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class CouponUsageSummaryResponse {
    private String couponUuid;
    private String couponCode;
    private Long totalUses;
    private BigDecimal totalDiscountGiven;
}
