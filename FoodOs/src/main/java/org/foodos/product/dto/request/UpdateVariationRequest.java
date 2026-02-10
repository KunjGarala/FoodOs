package org.foodos.product.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateVariationRequest {

    @Size(max = 50, message = "Variation name must not exceed 50 characters")
    private String name;

    @Size(max = 10, message = "Short code must not exceed 10 characters")
    private String shortCode;

    @DecimalMin(value = "0.0", inclusive = true, message = "Price must be greater than or equal to 0")
    @Digits(integer = 8, fraction = 2, message = "Price must have at most 8 integer digits and 2 decimal places")
    private BigDecimal price;

    @DecimalMin(value = "0.0", inclusive = true, message = "Cost price must be greater than or equal to 0")
    @Digits(integer = 8, fraction = 2, message = "Cost price must have at most 8 integer digits and 2 decimal places")
    private BigDecimal costPrice;

    @Size(max = 50, message = "SKU must not exceed 50 characters")
    private String sku;

    private Boolean isDefault;

    private Boolean isActive;

    private Integer sortOrder;
}
