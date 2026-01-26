package org.foodos.restaurant.dto.response;


import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestaurantHierarchyResponseDto {
    private RestaurantResponseDto mainRestaurant;

    private List<RestaurantResponseDto> childRestaurants;
}
