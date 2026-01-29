package org.foodos.auth.mapper;

import org.foodos.auth.DTO.Request.ProfileUpdateDTO;
import org.foodos.auth.DTO.Response.ProfileResponseDTO;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.restaurant.dto.response.RestaurantBasicDTO;
import org.foodos.restaurant.entity.Restaurant;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
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

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "userUuid", ignore = true)
    @Mapping(target = "restaurants", ignore = true)
    @Mapping(target = "primaryRestaurant", ignore = true) // Handled separately in service
    @Mapping(target = "username", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "pin", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "profilePictureUrl", ignore = true) // Handled via S3
    @Mapping(target = "emailVerificationCode", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    @Mapping(target = "isLocked", ignore = true)
    @Mapping(target = "failedLoginAttempts", ignore = true)
    @Mapping(target = "lockedUntil", ignore = true)
    @Mapping(target = "forcePasswordChange", ignore = true)
    @Mapping(target = "currentSessionToken", ignore = true)
    @Mapping(target = "lastLoginAt", ignore = true)
    @Mapping(target = "lastLoginIp", ignore = true)
    @Mapping(target = "passwordChangedAt", ignore = true)
    @Mapping(target = "createdByUser", ignore = true)
    void updateUserFromDto(ProfileUpdateDTO dto, @MappingTarget UserAuthEntity user);

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