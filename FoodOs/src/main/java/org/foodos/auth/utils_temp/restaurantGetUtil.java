package org.foodos.auth.utils_temp;

import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.restaurant.entity.Restaurant;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class RestaurantGetUtil {

    public List<String> getRestaurantUuids(UserAuthEntity user) {
        List<String> restaurantUuids = new ArrayList<>();

        if (user.getPrimaryRestaurant() != null && user.getPrimaryRestaurant().getIsActive()) {
            restaurantUuids.add(user.getPrimaryRestaurant().getRestaurantUuid());
        }else{
            return restaurantUuids;
        }

        restaurantUuids.addAll(
                user.getRestaurants().stream()
                        .filter(Restaurant::getIsActive)
                        .filter(r ->
                                user.getPrimaryRestaurant() == null ||
                                        !r.getRestaurantUuid()
                                                .equals(user.getPrimaryRestaurant().getRestaurantUuid())
                        )
                        .map(Restaurant::getRestaurantUuid)
                        .toList()
        );


        return restaurantUuids;
    }
}
