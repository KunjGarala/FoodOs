package org.foodos.restaurant.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.restaurant.dto.response.RestaurantResponseDto;
import org.foodos.restaurant.repository.RestaurantRepo;
import org.foodos.restaurant.dto.request.CreateRestaurantRequestDto;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class RestaurantService {

    private final RestaurantRepo restaurantRepo;

//    public RestaurantResponseDto createRestaurant(UserAuthEntity user, CreateRestaurantRequestDto requestDto) {
//
//    }
}
