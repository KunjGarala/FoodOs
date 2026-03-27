package org.foodos.coupon.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.foodos.coupon.entity.enums.CouponScopeType;
import org.foodos.coupon.entity.enums.DiscountType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class UpdateCouponRequest {

    @NotBlank(message = "Coupon name is required")
    @Size(max = 120, message = "Name must not exceed 120 characters")
    private String name;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @NotNull(message = "Discount type is required")
    private DiscountType discountType;

    @NotNull(message = "Discount value is required")
    @DecimalMin(value = "0.01", message = "Discount value must be positive")
    private BigDecimal discountValue;

    @DecimalMin(value = "0.01", message = "Max discount amount must be positive if provided")
    private BigDecimal maxDiscountAmount;

    @DecimalMin(value = "0.00", message = "Min order amount must be zero or positive")
    private BigDecimal minOrderAmount;

    @NotNull(message = "Start date is required")
    private LocalDateTime startDate;

    @NotNull(message = "End date is required")
    private LocalDateTime endDate;

    @Min(value = 1, message = "Global usage limit must be at least 1")
    private Integer usageLimitGlobal;

    @Min(value = 1, message = "Per-user usage limit must be at least 1")
    private Integer usageLimitPerUser;

    private Boolean isActive = true;

    private Boolean allowStacking = false;

    @NotNull(message = "Scope type is required")
    private CouponScopeType scopeType;
}
