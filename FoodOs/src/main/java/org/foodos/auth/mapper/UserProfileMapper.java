package org.foodos.auth.mapper;

import org.foodos.auth.DTO.Response.ProfileResponseDTO;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.restaurant.dto.response.RestaurantBasicDTO;
import org.foodos.restaurant.entity.Restaurant;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

import java.util.ArrayList;
import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface UserProfileMapper {

    UserProfileMapper INSTANCE = Mappers.getMapper(UserProfileMapper.class);

    @Mapping(target = "hasPin" , expression = "java(user.hasPin())")
    @Mapping(target = "primaryRestaurantId", source = "primaryRestaurant.id")
    @Mapping(target = "restaurants", expression = "java(mapRestaurants(user))")
    @Mapping(target = "primaryRestaurant", expression = "java(mapPrimaryRestaurant(user))")
    ProfileResponseDTO toProfileDTO(UserAuthEntity user);

    default Set<RestaurantBasicDTO> mapRestaurants(UserAuthEntity user) {
        if (user.getRestaurants() == null) {
            return null;
        }
        return user.getRestaurants().stream()
                .map(this::toRestaurantBasicDTO)
                .collect(Collectors.toSet());
    }

    default RestaurantBasicDTO mapPrimaryRestaurant(UserAuthEntity user) {
        if (user.getPrimaryRestaurant() == null) {
            return null;
        }
        return toRestaurantBasicDTO(user.getPrimaryRestaurant());
    }

    @Mapping(target = "id", source = "id")
    @Mapping(target = "name", source = "name")
    RestaurantBasicDTO toRestaurantBasicDTO(Restaurant restaurant);
}