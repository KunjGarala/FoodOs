package org.foodos.coupon.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.foodos.coupon.entity.enums.CouponScopeType;
import org.foodos.coupon.entity.enums.DiscountType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Schema(description = "Create a coupon")
public class CreateCouponRequest {

    @NotBlank
    @Schema(description = "Unique coupon code", example = "SAVE10")
    private String code;

    @NotBlank
    @Size(max = 120)
    @Schema(description = "Display name", example = "Flat 10% off")
    private String name;

    @Size(max = 500)
    @Schema(description = "Description for admins", example = "Applicable on dine-in orders")
    private String description;

    @NotNull
    @Schema(description = "Discount type", example = "PERCENTAGE")
    private DiscountType discountType;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    @Schema(description = "Discount value (percentage or amount)", example = "10.0")
    private BigDecimal discountValue;

    @DecimalMin(value = "0.0", inclusive = false)
    @Schema(description = "Max discount amount cap", example = "250.0")
    private BigDecimal maxDiscountAmount;

    @DecimalMin(value = "0.0")
    @Schema(description = "Minimum order amount required", example = "399.0")
    private BigDecimal minOrderAmount;

    @NotNull
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Schema(description = "Start datetime", example = "2025-01-01T00:00:00")
    private LocalDateTime startDate;

    @NotNull
    @Future
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Schema(description = "End datetime", example = "2025-12-31T23:59:59")
    private LocalDateTime endDate;

    @Schema(description = "Global usage limit (null = unlimited)", example = "1000")
    private Integer usageLimitGlobal;

    @Schema(description = "Usage limit per customer (null = unlimited)", example = "3")
    private Integer usageLimitPerUser;

    @Schema(description = "Whether coupon is active", defaultValue = "true")
    private Boolean active;

    @NotNull
    @Schema(description = "Scope type", example = "GLOBAL_CHAIN")
    private CouponScopeType scopeType;

    @Schema(description = "Owner/chain restaurant UUID for global coupons", example = "root-rest-uuid")
    private String ownerRestaurantUuid;

    @Schema(description = "Restaurant UUIDs allowed for RESTAURANT_SPECIFIC scope")
    private List<String> restaurantUuids;

    @Schema(description = "Allow stacking more than one coupon", defaultValue = "false")
    private Boolean allowStacking;
}
