package org.foodos.product.mapper;

import org.foodos.product.dto.request.CreateProductRequest;
import org.foodos.product.dto.request.UpdateProductRequest;
import org.foodos.product.dto.response.ProductResponseDto;
import org.foodos.product.entity.ModifierGroup;
import org.foodos.product.entity.Product;
import org.foodos.product.entity.ProductVariation;
import org.mapstruct.*;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface ProductMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "productUuid", ignore = true)
    @Mapping(target = "restaurant", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "variations", ignore = true)
    @Mapping(target = "modifierGroups", ignore = true)
    @Mapping(target = "imageUrl", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    @Mapping(target = "soldCount", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    Product toEntity(CreateProductRequest dto);

    @Mapping(target = "restaurantUuid", source = "restaurant.restaurantUuid")
    @Mapping(target = "restaurantName", source = "restaurant.name")
    @Mapping(target = "categoryUuid", source = "category.categoryUuid")
    @Mapping(target = "categoryName", source = "category.name")
    @Mapping(target = "variations", source = "variations", qualifiedByName = "mapVariations")
    @Mapping(target = "modifierGroups", source = "modifierGroups", qualifiedByName = "mapModifierGroups")
    ProductResponseDto toResponseDto(Product product);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "productUuid", ignore = true)
    @Mapping(target = "restaurant", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "variations", ignore = true)
    @Mapping(target = "modifierGroups", ignore = true)
    @Mapping(target = "imageUrl", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    @Mapping(target = "soldCount", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntity(UpdateProductRequest dto, @MappingTarget Product product);

    @Named("mapVariations")
    default List<ProductResponseDto.ProductVariationSummaryDto> mapVariations(List<ProductVariation> variations) {
        if (variations == null || variations.isEmpty()) {
            return null;
        }
        return variations.stream()
                .filter(v -> !v.getIsDeleted() && v.getIsActive())
                .map(variation -> {
                    ProductResponseDto.ProductVariationSummaryDto dto = new ProductResponseDto.ProductVariationSummaryDto();
                    dto.setVariationUuid(variation.getVariationUuid());
                    dto.setName(variation.getName());
                    dto.setShortCode(variation.getShortCode());
                    dto.setPrice(variation.getPrice());
                    dto.setIsDefault(variation.getIsDefault());
                    dto.setIsActive(variation.getIsActive());
                    dto.setSortOrder(variation.getSortOrder());
                    return dto;
                })
                .sorted((a, b) -> Integer.compare(a.getSortOrder(), b.getSortOrder()))
                .collect(Collectors.toList());
    }

    @Named("mapModifierGroups")
    default List<ProductResponseDto.ModifierGroupSummaryDto> mapModifierGroups(Set<ModifierGroup> modifierGroups) {
        if (modifierGroups == null || modifierGroups.isEmpty()) {
            return null;
        }
        return modifierGroups.stream()
                .filter(mg -> !mg.getIsDeleted() && mg.getIsActive())
                .map(modifierGroup -> {
                    ProductResponseDto.ModifierGroupSummaryDto dto = new ProductResponseDto.ModifierGroupSummaryDto();
                    dto.setModifierGroupUuid(modifierGroup.getModifierGroupUuid());
                    dto.setName(modifierGroup.getName());
                    dto.setIsRequired(modifierGroup.getIsRequired());
                    dto.setMinSelection(modifierGroup.getMinSelection());
                    dto.setMaxSelection(modifierGroup.getMaxSelection());
                    return dto;
                })
                .collect(Collectors.toList());
    }
}
