package org.foodos.product.repository;

import org.foodos.product.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepo extends JpaRepository<Category, Long> {
    Optional<Category> findByCategoryUuidAndIsDeletedFalse(String categoryUuid);

    List<Category> findByRestaurant_RestaurantUuidAndParentCategoryIsNullAndIsDeletedFalseOrderBySortOrderAsc(String restaurantUuid);
}
