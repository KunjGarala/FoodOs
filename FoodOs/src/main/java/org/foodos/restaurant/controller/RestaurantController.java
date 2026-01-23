package org.foodos.restaurant.controller;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.restaurant.dto.request.CreateRestaurantRequestDto;
import org.foodos.restaurant.dto.response.RestaurantResponseDto;
import org.foodos.restaurant.entity.Restaurant;
import org.foodos.restaurant.service.RestaurantService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/restaurants")
@Slf4j
@RequiredArgsConstructor
public class RestaurantController {

    private final RestaurantService restaurantService;


//    @PreAuthorize("hasRole('OWNER')")
//    @PostMapping("/create")
//    public ResponseEntity<?> createRestaurant(@AuthenticationPrincipal UserAuthEntity user, CreateRestaurantRequestDto requestDto) {
//
//        RestaurantResponseDto restaurant =  restaurantService.createRestaurant(user , requestDto);
//
//        return ResponseEntity
//                .status(HttpStatus.CREATED)
//                .body(restaurant);
//    }

}
