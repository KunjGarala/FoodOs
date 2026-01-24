package org.foodos.restaurant.repository;

import org.foodos.restaurant.entity.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface RestaurantRepo extends JpaRepository<Restaurant , Long> {

    Optional<Restaurant> findByRestaurantUuidAndIsActiveTrue(String parentRestaurantUuid);
}
