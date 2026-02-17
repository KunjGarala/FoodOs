package org.foodos.product.service;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.common.exceptionhandling.exception.ResourceNotFoundException;
import org.foodos.product.dto.request.CreateCategoryRequest;
import org.foodos.product.dto.request.UpdateCategoryRequest;
import org.foodos.product.dto.response.CategoryResponseDto;
import org.foodos.product.entity.Category;
import org.foodos.product.mapper.CategoryMapper;
import org.foodos.product.repository.CategoryRepo;
import org.foodos.restaurant.entity.Restaurant;
import org.foodos.restaurant.repository.RestaurantRepo;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryService {

    private final CategoryRepo categoryRepo;
    private final RestaurantRepo restaurantRepo;
    private final CategoryMapper categoryMapper;


    public CategoryResponseDto createCategory(String restaurantUuid, CreateCategoryRequest dto) {
        Restaurant restaurant = restaurantRepo.findByRestaurantUuidAndIsDeletedFalse(restaurantUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id" ));

        Category category = categoryMapper.toEntity(dto);
        category.setRestaurant(restaurant);

        if(dto.getParentCategoryUuid() != null){
            Category parentCategory = categoryRepo.findByCategoryUuidAndIsDeletedFalse(dto.getParentCategoryUuid())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent Category not found with id" ));

            if (!parentCategory.getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
                throw new IllegalArgumentException("Parent category belongs to another restaurant");
            }

            parentCategory.addSubCategory(category);
        }

        Category savedCategory = categoryRepo.save(category);

        log.info("Created new category with id: {} for restaurant id: {}", savedCategory.getId(), restaurantUuid);
        return categoryMapper.toResponseDto(savedCategory);
    }


    public List<CategoryResponseDto> getAllCategories(String restaurantUuid){
        List<Category> categories = categoryRepo.findByRestaurant_RestaurantUuidAndParentCategoryIsNullAndIsDeletedFalseOrderBySortOrderAsc(
                restaurantUuid
        );

        return categories.stream()
                .map(categoryMapper::toResponseDto)
                .toList();
    }

    public CategoryResponseDto getCategoryById(String restaurantUuid, String categoryUuid) {
        Category category = categoryRepo.findByCategoryUuidAndIsDeletedFalse(categoryUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + categoryUuid));

        if (!category.getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new IllegalArgumentException("Category does not belong to this restaurant");
        }

        return categoryMapper.toResponseDto(category);
    }

    public CategoryResponseDto updateCategory(String restaurantUuid, String categoryUuid, UpdateCategoryRequest dto) {
        Category category = categoryRepo.findByCategoryUuidAndIsDeletedFalse(categoryUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + categoryUuid));

        if (!category.getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new IllegalArgumentException("Category does not belong to this restaurant");
        }

        if (dto.getParentCategoryUuid() != null && !dto.getParentCategoryUuid().isEmpty()) {
            Category parentCategory = categoryRepo.findByCategoryUuidAndIsDeletedFalse(dto.getParentCategoryUuid())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent Category not found with id: " + dto.getParentCategoryUuid()));

            if (!parentCategory.getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
                throw new IllegalArgumentException("Parent category belongs to another restaurant");
            }

            if (parentCategory.getCategoryUuid().equals(categoryUuid)) {
                throw new IllegalArgumentException("A category cannot be its own parent");
            }

            category.setParentCategory(parentCategory);
        }


        categoryMapper.updateEntity(dto, category);

        Category updatedCategory = categoryRepo.save(category);
        log.info("Updated category with id: {} for restaurant id: {}", categoryUuid, restaurantUuid);
        return categoryMapper.toResponseDto(updatedCategory);
    }

    public void deleteCategory(String restaurantUuid, String categoryUuid) {
        Category category = categoryRepo.findByCategoryUuidAndIsDeletedFalse(categoryUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + categoryUuid));

        if (!category.getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new IllegalArgumentException("Category does not belong to this restaurant");
        }

        // Manually set soft delete fields to ensure they are updated
        category.setIsDeleted(true);
        category.setDeletedAt(java.time.LocalDateTime.now());
        categoryRepo.save(category);

        log.info("Deleted (soft) category with id: {} for restaurant id: {}", categoryUuid, restaurantUuid);
    }

}