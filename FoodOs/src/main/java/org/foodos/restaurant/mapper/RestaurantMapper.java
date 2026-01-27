package org.foodos.restaurant.mapper;

import org.foodos.restaurant.dto.request.UpdateRestaurantRequestDto;
import org.foodos.restaurant.dto.request.CreateRestaurantRequestDto;
import org.foodos.restaurant.dto.response.RestaurantHierarchyResponseDto;
import org.foodos.restaurant.dto.response.RestaurantResponseDto;
import org.foodos.restaurant.entity.Restaurant;
import org.mapstruct.*;

import java.util.Collections;

@Mapper(componentModel = "spring" , nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
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

    void updateRestaurantFromDto(
            UpdateRestaurantRequestDto dto,
            @MappingTarget Restaurant entity
    );

    default RestaurantHierarchyResponseDto toHierarchyResponseDto(Restaurant restaurant) {
        if (restaurant == null) {
            throw new IllegalArgumentException("Restaurant cannot be null");
        }


        RestaurantHierarchyResponseDto dto = new RestaurantHierarchyResponseDto();
        dto.setMainRestaurant(toResponseDto(restaurant));



        dto.setChildRestaurants(
                restaurant.getAllActiveChildRestaurants() != null ?

                restaurant.getAllActiveChildRestaurants()
                        .stream()
                        .map(this::toResponseDto)
                        .toList() : Collections.emptyList()
        );

        return dto;
    }

}
