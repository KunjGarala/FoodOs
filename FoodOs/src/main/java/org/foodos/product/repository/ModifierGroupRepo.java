package org.foodos.product.repository;

import org.foodos.product.entity.ModifierGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ModifierGroupRepo extends JpaRepository<ModifierGroup, Long> {

    Optional<ModifierGroup> findByModifierGroupUuidAndIsDeletedFalse(String modifierGroupUuid);

    List<ModifierGroup> findByRestaurant_RestaurantUuidAndIsActiveTrueAndIsDeletedFalseOrderBySortOrderAsc(String restaurantUuid);

    List<ModifierGroup> findByRestaurant_RestaurantUuidAndIsDeletedFalseOrderBySortOrderAsc(String restaurantUuid);

    @Query("SELECT mg FROM ModifierGroup mg WHERE mg.restaurant.restaurantUuid = :restaurantUuid " +
           "AND LOWER(mg.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "AND mg.isDeleted = false")
    List<ModifierGroup> searchModifierGroups(@Param("restaurantUuid") String restaurantUuid,
                                              @Param("searchTerm") String searchTerm);

    boolean existsByRestaurant_RestaurantUuidAndNameAndIsDeletedFalse(String restaurantUuid, String name);

    boolean existsByRestaurant_RestaurantUuidAndNameAndModifierGroupUuidNotAndIsDeletedFalse(
            String restaurantUuid, String name, String modifierGroupUuid);
}
