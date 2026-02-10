package org.foodos.product.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ProductVariationResponseDto {

    private String variationUuid;
    private String productUuid;
    private String productName;
    private String name;
    private String shortCode;
    private BigDecimal price;
    private BigDecimal costPrice;
    private String sku;
    private Boolean isDefault;
    private Boolean isActive;
    private Integer sortOrder;
    private LocalDateTime createdAt;
}
