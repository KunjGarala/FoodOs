package org.foodos.restaurant.repository;

import org.foodos.restaurant.entity.Restaurant;
import org.foodos.restaurant.entity.RestaurantTable;
import org.foodos.restaurant.entity.enums.TableStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Long> {

    Optional<RestaurantTable> findByIdAndIsDeletedFalse(Long id);

    Optional<RestaurantTable> findByTableUuidAndIsDeletedFalse(String tableUuid);

    boolean existsByRestaurantAndTableNumberAndIsDeletedFalse(Restaurant restaurant, String tableNumber);

    List<RestaurantTable> findAllByRestaurantAndIsDeletedFalse(Restaurant restaurant);

    List<RestaurantTable> findAllByRestaurant_IdAndIsDeletedFalse(Long restaurantId);

    Page<RestaurantTable> findAllByIsDeletedFalse(Pageable pageable);

    Page<RestaurantTable> findAllByStatusAndIsDeletedFalse(TableStatus status, Pageable pageable);

    @Query("SELECT t FROM RestaurantTable t WHERE t.restaurant.restaurantUuid = :restaurantUuid AND t.isDeleted = false")
    List<RestaurantTable> findByRestaurantUuidForFloorPlan(@Param("restaurantUuid") String restaurantUuid);

    @Query("SELECT t FROM RestaurantTable t WHERE t.restaurant.parentRestaurant.restaurantUuid = :parentRestaurantUuid AND t.isDeleted = false")
    List<RestaurantTable> findByParentRestaurantUuid(@Param("parentRestaurantUuid") String parentRestaurantUuid);

    @Query("SELECT COUNT(t) FROM RestaurantTable t WHERE t.restaurant.restaurantUuid = :restaurantUuid AND t.status = :status AND t.isDeleted = false")
    Integer countByRestaurantUuidAndStatus(@Param("restaurantUuid") String restaurantUuid, @Param("status") TableStatus status);

    @Query("SELECT COUNT(t) FROM RestaurantTable t WHERE t.restaurant.restaurantUuid = :restaurantUuid AND t.isDeleted = false")
    Integer countByRestaurantUuid(@Param("restaurantUuid") String restaurantUuid);

    @Query("SELECT t FROM RestaurantTable t WHERE t.restaurant.id = :restaurantId AND t.isDeleted = false")
    List<RestaurantTable> findByRestaurantIdForFloorPlan(@Param("restaurantId") Long restaurantId);

    @Query("SELECT t FROM RestaurantTable t WHERE t.restaurant.parentRestaurant.id = :parentRestaurantId AND t.isDeleted = false")
    List<RestaurantTable> findByParentRestaurantId(@Param("parentRestaurantId") Long parentRestaurantId);

    @Query("SELECT COUNT(t) FROM RestaurantTable t WHERE t.restaurant.id = :restaurantId AND t.status = :status AND t.isDeleted = false")
    Integer countByRestaurantIdAndStatus(@Param("restaurantId") Long restaurantId, @Param("status") TableStatus status);

    @Query("SELECT COUNT(t) FROM RestaurantTable t WHERE t.restaurant.id = :restaurantId AND t.isDeleted = false")
    Integer countByRestaurantId(@Param("restaurantId") Long restaurantId);

    List<RestaurantTable> findAllByIdInAndIsDeletedFalse(List<Long> ids);

    List<RestaurantTable> findAllByTableUuidInAndIsDeletedFalse(List<String> tableUuids);

    @Query("SELECT t FROM RestaurantTable t WHERE t.restaurant.restaurantUuid = :restaurantUuid AND t.status = 'OCCUPIED' AND t.isDeleted = false")
    List<RestaurantTable> findOccupiedTablesByRestaurantUuid(@Param("restaurantUuid") String restaurantUuid);
}
