package org.foodos.coupon.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Data;
import org.foodos.coupon.entity.enums.CouponScopeType;
import org.foodos.coupon.entity.enums.DiscountType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class CouponResponse {
    private String couponUuid;
    private String code;
    private String name;
    private String description;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal maxDiscountAmount;
    private BigDecimal minOrderAmount;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime startDate;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime endDate;
    private Integer usageLimitGlobal;
    private Integer usageLimitPerUser;
    private Boolean active;
    private Boolean allowStacking;
    private CouponScopeType scopeType;
    private String ownerRestaurantUuid;
    private List<String> restaurantUuids;
}
