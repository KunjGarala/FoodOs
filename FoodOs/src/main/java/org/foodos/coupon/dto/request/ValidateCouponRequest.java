package org.foodos.coupon.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Schema(description = "Validate coupon against a restaurant/cart")
public class ValidateCouponRequest {

    @NotBlank
    @Schema(description = "Coupon code", example = "SAVE10")
    private String couponCode;

    @NotBlank
    @Schema(description = "Restaurant UUID where coupon is being applied")
    private String restaurantUuid;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    @Schema(description = "Current cart/order subtotal for validation", example = "799.0")
    private BigDecimal orderAmount;

    @Schema(description = "Customer UUID (optional)")
    private String customerUuid;

    @Schema(description = "Order UUID (optional, for idempotent checks)")
    private String orderUuid;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Schema(description = "Explicit evaluation time (defaults to now)")
    private LocalDateTime evaluationTime;
}
