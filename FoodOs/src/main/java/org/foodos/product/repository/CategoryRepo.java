package org.foodos.product.repository;

import org.foodos.product.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CategoryRepo extends JpaRepository<Category, Long> {
    Optional<Category> findByCategoryUuidAndIsDeletedFalse(String categoryUuid);

    List<Category> findByRestaurant_RestaurantUuidAndParentCategoryIsNullAndIsDeletedFalseOrderBySortOrderAsc(String restaurantUuid);

    @Query("""
    SELECT DISTINCT c FROM Category c
    JOIN FETCH c.products p
    LEFT JOIN c.parentCategory pc
    WHERE c.restaurant.restaurantUuid = :restaurantUuid
    AND c.isDeleted = false
    AND c.isActive = true
    AND (pc IS NULL OR pc.isActive = true)
    AND p.isActive = true
    AND p.isDeleted = false
    ORDER BY c.sortOrder ASC
""")
    List<Category> findActiveMenuCategories(String restaurantUuid);
}
