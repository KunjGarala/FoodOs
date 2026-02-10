package org.foodos.product.mapper;

import org.foodos.product.dto.request.CreateModifierRequest;
import org.foodos.product.dto.request.UpdateModifierRequest;
import org.foodos.product.dto.response.ModifierResponseDto;
import org.foodos.product.entity.Modifier;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface ModifierMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "modifierUuid", ignore = true)
    @Mapping(target = "modifierGroup", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    Modifier toEntity(CreateModifierRequest dto);

    @Mapping(target = "modifierGroupUuid", source = "modifierGroup.modifierGroupUuid")
    @Mapping(target = "modifierGroupName", source = "modifierGroup.name")
    ModifierResponseDto toResponseDto(Modifier modifier);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "modifierUuid", ignore = true)
    @Mapping(target = "modifierGroup", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntity(UpdateModifierRequest dto, @MappingTarget Modifier modifier);
}
