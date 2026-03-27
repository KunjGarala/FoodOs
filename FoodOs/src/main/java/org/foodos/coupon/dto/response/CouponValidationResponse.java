package org.foodos.coupon.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Data;
import org.foodos.coupon.entity.enums.DiscountType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class CouponValidationResponse {
    private boolean valid;
    private String reason;
    private String couponCode;
    private String couponName;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal maxDiscountAmount;
    private BigDecimal minOrderAmount;
    private BigDecimal computedDiscount;
    private Integer remainingGlobalUses;
    private Integer remainingUserUses;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime startDate;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime endDate;
}
