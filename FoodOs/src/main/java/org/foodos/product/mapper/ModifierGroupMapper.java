package org.foodos.product.mapper;

import org.foodos.product.dto.request.CreateModifierGroupRequest;
import org.foodos.product.dto.request.UpdateModifierGroupRequest;
import org.foodos.product.dto.response.ModifierGroupResponseDto;
import org.foodos.product.dto.response.ModifierResponseDto;
import org.foodos.product.entity.Modifier;
import org.foodos.product.entity.ModifierGroup;
import org.mapstruct.*;

import java.util.List;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring", uses = {ModifierMapper.class})
public interface ModifierGroupMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "modifierGroupUuid", ignore = true)
    @Mapping(target = "restaurant", ignore = true)
    @Mapping(target = "modifiers", ignore = true)
    @Mapping(target = "products", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    ModifierGroup toEntity(CreateModifierGroupRequest dto);

    @Mapping(target = "restaurantUuid", source = "restaurant.restaurantUuid")
    @Mapping(target = "restaurantName", source = "restaurant.name")
    @Mapping(target = "modifiers", source = "modifiers", qualifiedByName = "mapModifiers")
    ModifierGroupResponseDto toResponseDto(ModifierGroup modifierGroup);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "modifierGroupUuid", ignore = true)
    @Mapping(target = "restaurant", ignore = true)
    @Mapping(target = "modifiers", ignore = true)
    @Mapping(target = "products", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntity(UpdateModifierGroupRequest dto, @MappingTarget ModifierGroup modifierGroup);

    @Named("mapModifiers")
    default List<ModifierResponseDto> mapModifiers(List<Modifier> modifiers) {
        if (modifiers == null || modifiers.isEmpty()) {
            return null;
        }
        return modifiers.stream()
                .filter(m -> !m.getIsDeleted() && m.getIsActive())
                .map(modifier -> {
                    ModifierResponseDto dto = new ModifierResponseDto();
                    dto.setId(modifier.getId());
                    dto.setModifierUuid(modifier.getModifierUuid());
                    dto.setModifierGroupUuid(modifier.getModifierGroup().getModifierGroupUuid());
                    dto.setModifierGroupName(modifier.getModifierGroup().getName());
                    dto.setName(modifier.getName());
                    dto.setPriceAdd(modifier.getPriceAdd());
                    dto.setCostAdd(modifier.getCostAdd());
                    dto.setSku(modifier.getSku());
                    dto.setIsDefault(modifier.getIsDefault());
                    dto.setIsActive(modifier.getIsActive());
                    dto.setSortOrder(modifier.getSortOrder());
                    dto.setCreatedAt(modifier.getCreatedAt());
                    return dto;
                })
                .sorted((a, b) -> Integer.compare(a.getSortOrder(), b.getSortOrder()))
                .collect(Collectors.toList());
    }
}
