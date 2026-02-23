package org.foodos.menu.mapper;

import org.foodos.menu.dto.MenuResponseDto;
import org.foodos.product.entity.Category;
import org.foodos.product.entity.ModifierGroup;
import org.foodos.product.entity.Product;
import org.foodos.product.entity.ProductVariation;
import org.foodos.product.dto.response.ProductResponseDto;
import org.foodos.restaurant.entity.Restaurant;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class MenuMapper {

    public MenuResponseDto toResponseDto(Restaurant restaurant, List<Category> categories) {
        return MenuResponseDto.builder()
                .restaurant(toRestaurantInfoDto(restaurant))
                .categories(toMenuCategoryDtoList(categories))
                .build();
    }

    private MenuResponseDto.RestaurantInfoDto toRestaurantInfoDto(Restaurant restaurant) {
        return MenuResponseDto.RestaurantInfoDto.builder()
                .restaurantUuid(restaurant.getRestaurantUuid())
                .name(restaurant.getName())
                .businessName(restaurant.getBusinessName())
                .description(restaurant.getDescription())
                .logoUrl(restaurant.getLogoUrl())
                .phoneNumber(restaurant.getPhoneNumber())
                .email(restaurant.getEmail())
                .address(restaurant.getAddress())
                .city(restaurant.getCity())
                .state(restaurant.getState())
                .build();
    }

    private List<MenuResponseDto.MenuCategoryDto> toMenuCategoryDtoList(List<Category> categories) {
        return categories.stream()
                .map(this::toMenuCategoryDto)
                .collect(Collectors.toList());
    }

    private MenuResponseDto.MenuCategoryDto toMenuCategoryDto(Category category) {
        return MenuResponseDto.MenuCategoryDto.builder()
                .categoryUuid(category.getCategoryUuid())
                .name(category.getName())
                .description(category.getDescription())
                .parentCategoryUuid(category.getParentCategory() != null ? category.getParentCategory().getCategoryUuid() : null)
                .parentCategoryName(category.getParentCategory() != null ? category.getParentCategory().getName() : null)
                .subCategories(toCategorySummaryDtoList(category.getSubCategories()))
                .sortOrder(category.getSortOrder())
                .imageUrl(category.getImageUrl())
                .iconName(category.getIconName())
                .colorCode(category.getColorCode())
                .products(toMenuProductDtoList(category.getProducts()))
                .build();
    }

    private List<MenuResponseDto.CategorySummaryDto> toCategorySummaryDtoList(List<Category> subCategories) {
        if (subCategories == null || subCategories.isEmpty()) {
            return List.of();
        }
        return subCategories.stream()
                .filter(cat -> cat.getIsActive() && !cat.getIsDeleted())
                .map(this::toCategorySummaryDto)
                .collect(Collectors.toList());
    }

    private MenuResponseDto.CategorySummaryDto toCategorySummaryDto(Category category) {
        return MenuResponseDto.CategorySummaryDto.builder()
                .categoryUuid(category.getCategoryUuid())
                .name(category.getName())
                .description(category.getDescription())
                .sortOrder(category.getSortOrder())
                .imageUrl(category.getImageUrl())
                .iconName(category.getIconName())
                .colorCode(category.getColorCode())
                .build();
    }

    private List<MenuResponseDto.MenuProductDto> toMenuProductDtoList(List<Product> products) {
        if (products == null || products.isEmpty()) {
            return List.of();
        }
        return products.stream()
                .filter(product -> product.getIsActive() && !product.getIsDeleted())
                .map(this::toMenuProductDto)
                .collect(Collectors.toList());
    }

    private MenuResponseDto.MenuProductDto toMenuProductDto(Product product) {
        return MenuResponseDto.MenuProductDto.builder()
                .productUuid(product.getProductUuid())
                .name(product.getName())
                .description(product.getDescription())
                .basePrice(product.getBasePrice())
                .takeawayPrice(product.getTakeawayPrice())
                .deliveryPrice(product.getDeliveryPrice())
                .dietaryType(product.getDietaryType() != null ? product.getDietaryType().name() : null)
                .imageUrl(product.getImageUrl())
                .preparationTime(product.getPreparationTime())
                .spiceLevel(product.getSpiceLevel())
                .isFeatured(product.getIsFeatured())
                .isBestseller(product.getIsBestseller())
                .hasVariations(product.getHasVariations())
                .hasModifiers(product.getHasModifiers())
                .sortOrder(product.getSortOrder())
                .availableFrom(product.getAvailableFrom())
                .availableTo(product.getAvailableTo())
                .availableDays(product.getAvailableDays())
                .variations(toVariationSummaryDtoList(product.getVariations()))
                .modifierGroups(toModifierGroupSummaryDtoList(product.getModifierGroups()))
                .build();
    }

    private List<ProductResponseDto.ProductVariationSummaryDto> toVariationSummaryDtoList(List<ProductVariation> variations) {
        if (variations == null || variations.isEmpty()) {
            return List.of();
        }
        return variations.stream()
                .map(this::toVariationSummaryDto)
                .collect(Collectors.toList());
    }

    private ProductResponseDto.ProductVariationSummaryDto toVariationSummaryDto(ProductVariation variation) {
        ProductResponseDto.ProductVariationSummaryDto dto = new ProductResponseDto.ProductVariationSummaryDto();
        dto.setVariationUuid(variation.getVariationUuid());
        dto.setName(variation.getName());
        dto.setShortCode(variation.getShortCode());
        dto.setPrice(variation.getPrice());
        dto.setIsDefault(variation.getIsDefault());
        dto.setIsActive(variation.getIsActive());
        dto.setSortOrder(variation.getSortOrder());
        return dto;
    }

    private List<ProductResponseDto.ModifierGroupSummaryDto> toModifierGroupSummaryDtoList(java.util.Set<ModifierGroup> modifierGroups) {
        if (modifierGroups == null || modifierGroups.isEmpty()) {
            return List.of();
        }
        return modifierGroups.stream()
                .map(this::toModifierGroupSummaryDto)
                .collect(Collectors.toList());
    }

    private ProductResponseDto.ModifierGroupSummaryDto toModifierGroupSummaryDto(ModifierGroup modifierGroup) {
        ProductResponseDto.ModifierGroupSummaryDto dto = new ProductResponseDto.ModifierGroupSummaryDto();
        dto.setModifierGroupUuid(modifierGroup.getModifierGroupUuid());
        dto.setName(modifierGroup.getName());
        dto.setIsRequired(modifierGroup.getIsRequired());
        dto.setMinSelection(modifierGroup.getMinSelection());
        dto.setMaxSelection(modifierGroup.getMaxSelection());
        return dto;
    }
}
