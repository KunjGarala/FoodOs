package org.foodos.product.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponseDto {

    private String categoryUuid;

    private String name;
    private String description;

    // Restaurant info
    private String restaurantUuid;
    private String restaurantName;

    // Parent category info (for hierarchical structure)
    private Long parentCategoryUuid;
    private String parentCategoryName;

    // Sub-categories (nested structure)
    private List<CategorySummaryDto> subCategories;

    // Display and ordering
    private Integer sortOrder;
    private String imageUrl;
    private String iconName;
    private String colorCode;

    // Status flags
    private Boolean isActive;
    private Boolean isVisibleInMenu;
    private Boolean availableForDineIn;

    // Metadata
    private Integer productCount; // Number of products in this category
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Simplified DTO for nested sub-categories to avoid deep recursion
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategorySummaryDto {
        private Long id;
        private String categoryUuid;
        private String name;
        private String description;
        private Integer sortOrder;
        private String imageUrl;
        private String iconName;
        private String colorCode;
        private Boolean isActive;
        private Integer productCount;
    }
}
