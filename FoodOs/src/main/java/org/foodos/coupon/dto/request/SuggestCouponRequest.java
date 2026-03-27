package org.foodos.coupon.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Schema(description = "Request for best coupon suggestion")
public class SuggestCouponRequest {

    @NotBlank
    @Schema(description = "Restaurant UUID where coupon would be used")
    private String restaurantUuid;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    @Schema(description = "Current order subtotal", example = "1200.00")
    private BigDecimal orderAmount;

    @Schema(description = "Customer UUID (optional for personalized limits)")
    private String customerUuid;

    @Schema(description = "Order UUID (optional)")
    private String orderUuid;
}
