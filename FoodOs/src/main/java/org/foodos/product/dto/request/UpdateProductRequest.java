package org.foodos.product.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import org.foodos.product.entity.enums.DietaryType;

import java.math.BigDecimal;
import java.time.LocalTime;

@Data
public class UpdateProductRequest {

    @Size(max = 200, message = "Product name must not exceed 200 characters")
    private String name;

    private String description;

    @Size(max = 50, message = "SKU must not exceed 50 characters")
    private String sku;

    @Size(max = 20, message = "Food code must not exceed 20 characters")
    private String foodCode;

    @DecimalMin(value = "0.0", inclusive = false, message = "Base price must be greater than 0")
    private BigDecimal basePrice;

    @DecimalMin(value = "0.0", inclusive = false, message = "Cost price must be greater than 0")
    private BigDecimal costPrice;

    @DecimalMin(value = "0.0", inclusive = false, message = "Takeaway price must be greater than 0")
    private BigDecimal takeawayPrice;

    @DecimalMin(value = "0.0", inclusive = false, message = "Delivery price must be greater than 0")
    private BigDecimal deliveryPrice;

    private DietaryType dietaryType;

    private String categoryUuid;

    @Min(value = 0, message = "Preparation time must be non-negative")
    private Integer preparationTime;

    @Min(value = 1, message = "Spice level must be between 1 and 5")
    @Max(value = 5, message = "Spice level must be between 1 and 5")
    private Integer spiceLevel;

    private Boolean isActive;
    private Boolean isFeatured;
    private Boolean hasVariations;
    private Boolean hasModifiers;
    private Boolean isBestseller;
    private Boolean isOpenPrice;
    private Boolean trackInventory;

    // Stock fields - commented out for now
//    @DecimalMin(value = "0.0", message = "Current stock must be non-negative")
//    private BigDecimal currentStock;
//
//    @DecimalMin(value = "0.0", message = "Low stock alert must be non-negative")
//    private BigDecimal lowStockAlert;

    @Min(value = 0, message = "Sort order must be non-negative")
    private Integer sortOrder;

    private LocalTime availableFrom;
    private LocalTime availableTo;

    @Pattern(regexp = "^(MON|TUE|WED|THU|FRI|SAT|SUN)(,(MON|TUE|WED|THU|FRI|SAT|SUN))*$",
             message = "Available days must be comma-separated day codes (e.g., MON,TUE,WED)")
    private String availableDays;
}
