package org.foodos.restaurant.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.auth.repository.UserAuthRepository;
import org.foodos.restaurant.dto.response.RestaurantResponseDto;
import org.foodos.restaurant.entity.Restaurant;
import org.foodos.restaurant.mapper.RestaurantMapper;
import org.foodos.restaurant.repository.RestaurantRepo;
import org.foodos.restaurant.dto.request.CreateRestaurantRequestDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
public class RestaurantService {

    private final RestaurantRepo restaurantRepo;

    private final RestaurantMapper restaurantMapper;

    private final UserAuthRepository userRepository;

    @Transactional
    public RestaurantResponseDto createParentRestaurant(UserAuthEntity currentUser, CreateRestaurantRequestDto requestDto) {

        UserAuthEntity owner = userRepository.findById(currentUser.getId()).orElseThrow(() -> new RuntimeException("User not found"));

        if (!owner.isOwner()) {
            throw new IllegalArgumentException("Only owners can create restaurants");
        }

        Restaurant restaurant = restaurantMapper.toEntity(requestDto);
        restaurant.setOwnerName(owner.getFullName());
        restaurant.setOwner(owner);


        Restaurant savedRestaurant = restaurantRepo.save(restaurant);
        owner.addRestaurant(savedRestaurant);
        userRepository.save(owner);

        log.info("Restaurant created with ID: {}", savedRestaurant.getId());
        return restaurantMapper.toResponseDto(savedRestaurant);

    }
}
