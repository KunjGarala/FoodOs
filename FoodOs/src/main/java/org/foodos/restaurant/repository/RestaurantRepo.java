package org.foodos.restaurant.repository;

import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.restaurant.entity.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RestaurantRepo extends JpaRepository<Restaurant , Long> {

    boolean existsByOwner(UserAuthEntity owner);

    Optional<Restaurant> findByRestaurantUuid(String restaurantUuid);
}
