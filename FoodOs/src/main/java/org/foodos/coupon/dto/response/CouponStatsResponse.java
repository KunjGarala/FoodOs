package org.foodos.coupon.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Coupon dashboard stats for the Offers header strip")
public class CouponStatsResponse {

    @Schema(description = "Active coupons currently valid for this restaurant", example = "6")
    private Long activeCoupons;

    @Schema(description = "Coupon redemptions this calendar month", example = "1204")
    private Long redemptionsThisMonth;

    @Schema(description = "Average discount per redemption this month", example = "148.50")
    private BigDecimal avgDiscount;

    @Schema(description = "Sum of order totals on which a coupon was used this month", example = "360000.00")
    private BigDecimal revenueInfluenced;
}
