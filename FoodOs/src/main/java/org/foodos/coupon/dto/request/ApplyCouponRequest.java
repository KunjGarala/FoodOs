package org.foodos.coupon.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "Apply a coupon to an order")
public class ApplyCouponRequest {

    @NotBlank
    @Schema(description = "Coupon code to apply", example = "SAVE10")
    private String couponCode;

    @Schema(description = "Customer UUID (optional, for per-user limits and personalization)")
    private String customerUuid;
}
