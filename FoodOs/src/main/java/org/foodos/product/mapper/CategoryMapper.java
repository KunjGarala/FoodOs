package org.foodos.product.mapper;

import org.foodos.product.dto.request.CreateCategoryRequest;
import org.foodos.product.dto.request.UpdateCategoryRequest;
import org.foodos.product.dto.response.CategoryResponseDto;
import org.foodos.product.entity.Category;
import org.mapstruct.*;

import java.util.List;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface CategoryMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "restaurant", ignore = true)
    @Mapping(target = "parentCategory", ignore = true)
    @Mapping(target = "subCategories", ignore = true)
    @Mapping(target = "products", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    Category toEntity(CreateCategoryRequest dto);

    @Mapping(target = "restaurantUuid", source = "restaurant.restaurantUuid")
    @Mapping(target = "restaurantName", source = "restaurant.name")
    @Mapping(target = "parentCategoryUuid", source = "parentCategory.categoryUuid")
    @Mapping(target = "parentCategoryName", source = "parentCategory.name")
    @Mapping(target = "subCategories", source = "subCategories", qualifiedByName = "mapSubCategories")
    @Mapping(target = "productCount", expression = "java(category.getProducts() != null ? category.getProducts().size() : 0)")
    CategoryResponseDto toResponseDto(Category category);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "categoryUuid", ignore = true)
    @Mapping(target = "restaurant", ignore = true)
    @Mapping(target = "parentCategory", ignore = true)
    @Mapping(target = "subCategories", ignore = true)
    @Mapping(target = "products", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    void updateEntity(UpdateCategoryRequest dto, @MappingTarget Category category);

    @Named("mapSubCategories")
    default List<CategoryResponseDto.CategorySummaryDto> mapSubCategories(List<Category> subCategories) {
        if (subCategories == null || subCategories.isEmpty()) {
            return null;
        }
        return subCategories.stream()
                .map(this::toCategorySummaryDto)
                .collect(Collectors.toList());
    }

    @Named("toCategorySummaryDto")
    default CategoryResponseDto.CategorySummaryDto toCategorySummaryDto(Category category) {
        if (category == null) {
            return null;
        }

        return CategoryResponseDto.CategorySummaryDto.builder()
                .categoryUuid(category.getCategoryUuid())
                .name(category.getName())
                .description(category.getDescription())
                .sortOrder(category.getSortOrder())
                .imageUrl(category.getImageUrl())
                .iconName(category.getIconName())
                .colorCode(category.getColorCode())
                .isActive(category.getIsActive())
                .productCount(
                        category.getProducts() != null ? category.getProducts().size() : 0
                )
                .build();
    }

}
