package org.foodos.menu.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.foodos.product.dto.response.ProductResponseDto;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Complete menu response with restaurant details and categories with products")
public class MenuResponseDto {

    @Schema(description = "Restaurant information")
    private RestaurantInfoDto restaurant;

    @Schema(description = "List of categories with products")
    private List<MenuCategoryDto> categories;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Restaurant basic information for menu")
    public static class RestaurantInfoDto {
        @Schema(description = "Restaurant UUID", example = "550e8400-e29b-41d4-a716-446655440000")
        private String restaurantUuid;

        @Schema(description = "Restaurant name", example = "FoodOs - Ahmedabad")
        private String name;

        @Schema(description = "Business name", example = "FoodOs Pvt Ltd")
        private String businessName;

        @Schema(description = "Restaurant description")
        private String description;

        @Schema(description = "Restaurant logo URL")
        private String logoUrl;

        @Schema(description = "Phone number", example = "+919876543210")
        private String phoneNumber;

        @Schema(description = "Email", example = "contact@foodos.com")
        private String email;

        @Schema(description = "Address")
        private String address;

        @Schema(description = "City", example = "Ahmedabad")
        private String city;

        @Schema(description = "State", example = "Gujarat")
        private String state;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Category with products for menu")
    public static class MenuCategoryDto {
        @Schema(description = "Category UUID")
        private String categoryUuid;

        @Schema(description = "Category name", example = "Beverages")
        private String name;

        @Schema(description = "Category description")
        private String description;

        @Schema(description = "Parent category UUID")
        private String parentCategoryUuid;

        @Schema(description = "Parent category name")
        private String parentCategoryName;

        @Schema(description = "Sub-categories")
        private List<CategorySummaryDto> subCategories;

        @Schema(description = "Sort order", example = "1")
        private Integer sortOrder;

        @Schema(description = "Image URL")
        private String imageUrl;

        @Schema(description = "Icon name", example = "coffee")
        private String iconName;

        @Schema(description = "Color code", example = "#FF5733")
        private String colorCode;

        @Schema(description = "List of products in this category")
        private List<MenuProductDto> products;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Category summary for nested subcategories")
    public static class CategorySummaryDto {
        @Schema(description = "Category UUID")
        private String categoryUuid;

        @Schema(description = "Category name")
        private String name;

        @Schema(description = "Category description")
        private String description;

        @Schema(description = "Sort order")
        private Integer sortOrder;

        @Schema(description = "Image URL")
        private String imageUrl;

        @Schema(description = "Icon name")
        private String iconName;

        @Schema(description = "Color code")
        private String colorCode;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Product with variations and modifiers for menu")
    public static class MenuProductDto {
        @Schema(description = "Product UUID")
        private String productUuid;

        @Schema(description = "Product name", example = "Margherita Pizza")
        private String name;

        @Schema(description = "Product description")
        private String description;

        @Schema(description = "Base price", example = "299.00")
        private BigDecimal basePrice;

        @Schema(description = "Takeaway price", example = "279.00")
        private BigDecimal takeawayPrice;

        @Schema(description = "Delivery price", example = "319.00")
        private BigDecimal deliveryPrice;

        @Schema(description = "Dietary type", example = "VEG")
        private String dietaryType;

        @Schema(description = "Image URL")
        private String imageUrl;

        @Schema(description = "Preparation time in minutes", example = "20")
        private Integer preparationTime;

        @Schema(description = "Spice level (1-5)", example = "2")
        private Integer spiceLevel;

        @Schema(description = "Is featured product")
        private Boolean isFeatured;

        @Schema(description = "Is bestseller")
        private Boolean isBestseller;

        @Schema(description = "Has variations")
        private Boolean hasVariations;

        @Schema(description = "Has modifiers")
        private Boolean hasModifiers;

        @Schema(description = "Sort order", example = "1")
        private Integer sortOrder;

        @Schema(description = "Available from time", example = "10:00:00")
        private LocalTime availableFrom;

        @Schema(description = "Available to time", example = "22:00:00")
        private LocalTime availableTo;

        @Schema(description = "Available days (comma separated)", example = "MON,TUE,WED,THU,FRI,SAT,SUN")
        private String availableDays;

        @Schema(description = "Product variations")
        private List<ProductResponseDto.ProductVariationSummaryDto> variations;

        @Schema(description = "Modifier groups")
        private List<ProductResponseDto.ModifierGroupSummaryDto> modifierGroups;
    }
}