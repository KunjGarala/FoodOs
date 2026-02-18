package org.foodos.product.repository;

import org.foodos.product.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepo extends JpaRepository<Product, Long> {

    Optional<Product> findByProductUuidAndIsDeletedFalse(String productUuid);

    Optional<Product> findBySkuAndIsDeletedFalse(String sku);

    List<Product> findByRestaurant_RestaurantUuidAndIsActiveTrueAndIsDeletedFalseOrderBySortOrderAsc(String restaurantUuid);

    List<Product> findByRestaurant_RestaurantUuidAndCategory_CategoryUuidAndIsActiveTrueAndIsDeletedFalseOrderBySortOrderAsc(
            String restaurantUuid, String categoryUuid);

    List<Product> findByRestaurant_RestaurantUuidAndIsFeaturedTrueAndIsActiveTrueAndIsDeletedFalseOrderBySortOrderAsc(
            String restaurantUuid);

    List<Product> findByRestaurant_RestaurantUuidAndIsBestsellerTrueAndIsActiveTrueAndIsDeletedFalseOrderBySoldCountDesc(
            String restaurantUuid);

    List<Product> findByRestaurant_RestaurantUuidAndIsDeletedFalseOrderBySortOrderAsc(
            String restaurantUuid);

    @Query("SELECT p FROM Product p WHERE p.restaurant.restaurantUuid = :restaurantUuid " +
           "AND LOWER(p.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "AND p.isActive = true AND p.isDeleted = false " +
           "ORDER BY p.sortOrder ASC")
    List<Product> searchProducts(@Param("restaurantUuid") String restaurantUuid,
                                  @Param("searchTerm") String searchTerm);

    boolean existsBySku(String sku);

    boolean existsBySkuAndProductUuidNot(String sku, String productUuid);
}
