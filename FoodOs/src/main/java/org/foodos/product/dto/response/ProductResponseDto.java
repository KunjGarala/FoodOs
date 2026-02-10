package org.foodos.product.dto.response;

import lombok.Data;
import org.foodos.product.entity.enums.DietaryType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Data
public class ProductResponseDto {

    private String productUuid;
    private String restaurantUuid;
    private String restaurantName;
    private String categoryUuid;
    private String categoryName;
    private String name;
    private String description;
    private String sku;
    private String foodCode;
    private BigDecimal basePrice;
    private BigDecimal costPrice;
    private BigDecimal takeawayPrice;
    private BigDecimal deliveryPrice;
    private DietaryType dietaryType;
    private String imageUrl;
    private Integer preparationTime;
    private Integer spiceLevel;
    private Boolean isActive;
    private Boolean isFeatured;
    private Boolean isBestseller;
    private Boolean hasVariations;
    private Boolean hasModifiers;
    private Boolean isOpenPrice;
    private Boolean trackInventory;
    // Stock fields - commented out for now
//    private BigDecimal currentStock;
//    private BigDecimal lowStockAlert;
    private Integer sortOrder;
    private LocalTime availableFrom;
    private LocalTime availableTo;
    private String availableDays;
    private Long soldCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Summary lists
    private List<ProductVariationSummaryDto> variations;
    private List<ModifierGroupSummaryDto> modifierGroups;

    @Data
    public static class ProductVariationSummaryDto {
        private String variationUuid;
        private String name;
        private String shortCode;
        private BigDecimal price;
        private Boolean isDefault;
        private Boolean isActive;
        private Integer sortOrder;
    }

    @Data
    public static class ModifierGroupSummaryDto {
        private String modifierGroupUuid;
        private String name;
        private Boolean isRequired;
        private Integer minSelection;
        private Integer maxSelection;
    }
}
