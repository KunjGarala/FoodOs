package org.foodos.product.mapper;

import org.foodos.product.dto.request.CreateVariationRequest;
import org.foodos.product.dto.request.UpdateVariationRequest;
import org.foodos.product.dto.response.ProductVariationResponseDto;
import org.foodos.product.entity.ProductVariation;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface ProductVariationMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "variationUuid", ignore = true)
    @Mapping(target = "product", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    ProductVariation toEntity(CreateVariationRequest dto);

    @Mapping(target = "productUuid", source = "product.productUuid")
    @Mapping(target = "productName", source = "product.name")
    ProductVariationResponseDto toResponseDto(ProductVariation variation);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "variationUuid", ignore = true)
    @Mapping(target = "product", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntity(UpdateVariationRequest dto, @MappingTarget ProductVariation variation);
}
