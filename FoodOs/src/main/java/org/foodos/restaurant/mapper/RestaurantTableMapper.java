package org.foodos.restaurant.mapper;

import org.foodos.restaurant.dto.request.CreateTableRequestDto;
import org.foodos.restaurant.dto.request.UpdateTableRequestDto;
import org.foodos.restaurant.dto.response.*;
import org.foodos.restaurant.entity.RestaurantTable;
import org.mapstruct.*;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface RestaurantTableMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tableUuid", ignore = true)
    @Mapping(target = "restaurant", ignore = true)
    @Mapping(target = "status", constant = "VACANT")
    @Mapping(target = "currentWaiter", ignore = true)
    @Mapping(target = "reservations", ignore = true)
    @Mapping(target = "currentPax", ignore = true)
    @Mapping(target = "seatedAt", ignore = true)
    @Mapping(target = "positionX", source = "posX")
    @Mapping(target = "positionY", source = "posY")
    @Mapping(target = "tableShape", source = "shape")
    @Mapping(target = "isDeleted", constant = "false")
    @Mapping(target = "isMerged", constant = "false")
    @Mapping(target = "mergedWithTableIds", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    RestaurantTable toEntity(CreateTableRequestDto dto);

    @Mapping(target = "tableUuid", source = "tableUuid")
    @Mapping(target = "restaurantUuid", source = "restaurant.restaurantUuid")
    @Mapping(target = "restaurantName", source = "restaurant.name")
    @Mapping(target = "currentWaiterUuid", expression = "java(table.getCurrentWaiter() != null ? table.getCurrentWaiter().getUserUuid() : null)")
    @Mapping(target = "currentWaiterName", expression = "java(table.getCurrentWaiter() != null ? table.getCurrentWaiter().getFullName() : null)")
    @Mapping(target = "currentPax", source = "currentPax")
    @Mapping(target = "seatedAt", source = "seatedAt")
    @Mapping(target = "posX", source = "positionX")
    @Mapping(target = "posY", source = "positionY")
    @Mapping(target = "shape", source = "tableShape")
    @Mapping(target = "currentOrder", ignore = true)
    TableResponseDto toResponseDto(RestaurantTable table);

    @Mapping(target = "tableUuid", source = "tableUuid")
    @Mapping(target = "posX", source = "positionX")
    @Mapping(target = "posY", source = "positionY")
    @Mapping(target = "shape", source = "tableShape")
    @Mapping(target = "currentPax", source = "currentPax")
    @Mapping(target = "seatedAt", source = "seatedAt")
    @Mapping(target = "currentWaiterName", expression = "java(table.getCurrentWaiter() != null ? table.getCurrentWaiter().getFullName() : null)")
    @Mapping(target = "currentOrderId", expression = "java(table.getCurrentOrder() != null ? table.getCurrentOrder().getOrderUuid() : null)")
    TableFloorPlanDto toFloorPlanDto(RestaurantTable table);

    @Mapping(target = "positionX", source = "posX")
    @Mapping(target = "positionY", source = "posY")
    @Mapping(target = "tableShape", source = "shape")
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tableUuid", ignore = true)
    @Mapping(target = "restaurant", ignore = true)
    @Mapping(target = "tableNumber", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "currentWaiter", ignore = true)
    @Mapping(target = "reservations", ignore = true)
    @Mapping(target = "currentPax", ignore = true)
    @Mapping(target = "seatedAt", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    @Mapping(target = "isMerged", ignore = true)
    @Mapping(target = "mergedWithTableIds", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateTableFromDto(UpdateTableRequestDto dto, @MappingTarget RestaurantTable table);
}
