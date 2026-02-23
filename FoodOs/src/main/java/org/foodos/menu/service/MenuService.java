package org.foodos.menu.service;


import lombok.AllArgsConstructor;
import org.foodos.common.exceptionhandling.exception.ResourceNotFoundException;
import org.foodos.menu.dto.MenuResponseDto;
import org.foodos.menu.mapper.MenuMapper;
import org.foodos.product.entity.Category;
import org.foodos.product.repository.CategoryRepo;
import org.foodos.restaurant.entity.Restaurant;
import org.foodos.restaurant.repository.RestaurantRepo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;

@Service
@AllArgsConstructor
public class MenuService {

    private final RestaurantRepo restaurantRepo;
    private final CategoryRepo categoryRepo;
    private final MenuMapper menuMapper;

    @Transactional(readOnly = true)
    public MenuResponseDto getMenu(String restaurantUuid) {

        Restaurant restaurant = restaurantRepo
                .findByRestaurantUuidAndIsDeletedFalse(restaurantUuid)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Restaurant not found with UUID: " + restaurantUuid)
                );

        List<Category> categories =
                categoryRepo.findActiveMenuCategories(restaurantUuid);

        List<Category> filteredCategories = categories.stream()
                .peek(category -> {

                    // Filter active variations & modifiers per product
                    category.getProducts().forEach(product -> {

                        // Filter variations
                        product.setVariations(
                                product.getVariations().stream()
                                        .filter(v -> v.getIsActive() && !v.getIsDeleted())
                                        .toList()
                        );

                        // Filter modifier groups
                        product.setModifierGroups(
                                new HashSet<>(product.getModifierGroups().stream()
                                        .filter(mg -> mg.getIsActive() && !mg.getIsDeleted())
                                        .toList())
                        );

                    });

                })
                .toList();

        return menuMapper.toResponseDto(restaurant, filteredCategories);
    }

}
