package org.foodos.restaurant.mapper;

import org.foodos.restaurant.dto.request.CreateRestaurantRequestDto;
import org.foodos.restaurant.dto.response.RestaurantResponseDto;
import org.foodos.restaurant.entity.Restaurant;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface RestaurantMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "restaurantUuid", ignore = true)
    @Mapping(target = "parentRestaurant", ignore = true)
    @Mapping(target = "childRestaurants", ignore = true)
    @Mapping(target = "employees", ignore = true)
    @Mapping(target = "tables", ignore = true)
    @Mapping(target = "categories", ignore = true)
    @Mapping(target = "modifierGroups", ignore = true)
    @Mapping(target = "isActive", constant = "true")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "logoUrl", ignore = true)
    Restaurant toEntity(CreateRestaurantRequestDto dto);

    @Mapping(target = "parentRestaurantUuid",
            expression = "java( restaurant.getParentRestaurant() != null ? restaurant.getParentRestaurant().getRestaurantUuid() : null )")
    @Mapping(target = "childRestaurantUuids",
            expression = "java( restaurant.getChildRestaurants().stream().map(Restaurant::getRestaurantUuid).toList() )")
    RestaurantResponseDto toResponseDto(Restaurant restaurant);

}
