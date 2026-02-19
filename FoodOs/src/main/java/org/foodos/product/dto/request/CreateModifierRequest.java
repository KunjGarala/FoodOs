package org.foodos.product.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateModifierRequest {

    @NotBlank(message = "Modifier name is required")
    @Size(max = 100, message = "Modifier name must not exceed 100 characters")
    private String name;

    @NotNull(message = "Price add is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Price add must be greater than or equal to 0")
    @Digits(integer = 8, fraction = 2, message = "Price add must have at most 8 integer digits and 2 decimal places")
    private BigDecimal priceAdd;

    @DecimalMin(value = "0.0", inclusive = true, message = "Cost add must be greater than or equal to 0")
    @Digits(integer = 8, fraction = 2, message = "Cost add must have at most 8 integer digits and 2 decimal places")
    private BigDecimal costAdd;

    @Size(max = 50, message = "SKU must not exceed 50 characters")
    private String sku;

    private Boolean isDefault = false;

    private Boolean isActive = true;

    private Integer sortOrder = 0;
}
