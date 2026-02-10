package org.foodos.product.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.common.exceptionhandling.exception.BusinessException;
import org.foodos.common.exceptionhandling.exception.ResourceNotFoundException;
import org.foodos.product.dto.request.CreateModifierGroupRequest;
import org.foodos.product.dto.request.CreateModifierRequest;
import org.foodos.product.dto.request.UpdateModifierGroupRequest;
import org.foodos.product.dto.response.ModifierGroupResponseDto;
import org.foodos.product.entity.Modifier;
import org.foodos.product.entity.ModifierGroup;
import org.foodos.product.mapper.ModifierGroupMapper;
import org.foodos.product.mapper.ModifierMapper;
import org.foodos.product.repository.ModifierGroupRepo;
import org.foodos.restaurant.entity.Restaurant;
import org.foodos.restaurant.repository.RestaurantRepo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ModifierGroupService {

    private final ModifierGroupRepo modifierGroupRepo;
    private final RestaurantRepo restaurantRepo;
    private final ModifierGroupMapper modifierGroupMapper;
    private final ModifierMapper modifierMapper;

    @Transactional
    public ModifierGroupResponseDto createModifierGroup(String restaurantUuid, CreateModifierGroupRequest dto) {
        log.info("Creating modifier group for restaurant: {}", restaurantUuid);

        // Validate restaurant
        Restaurant restaurant = restaurantRepo.findByRestaurantUuid(restaurantUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with UUID: " + restaurantUuid));

        // Validate name uniqueness
        if (modifierGroupRepo.existsByRestaurant_RestaurantUuidAndNameAndIsDeletedFalse(restaurantUuid, dto.getName())) {
            throw new BusinessException("Modifier group with name '" + dto.getName() + "' already exists");
        }

        // Validate selection constraints
        if (dto.getMinSelection() > dto.getMaxSelection()) {
            throw new BusinessException("Minimum selection cannot be greater than maximum selection");
        }

        // Map DTO to entity
        ModifierGroup modifierGroup = modifierGroupMapper.toEntity(dto);
        modifierGroup.setRestaurant(restaurant);

        // Add modifiers if provided
        if (dto.getModifiers() != null && !dto.getModifiers().isEmpty()) {
            for (CreateModifierRequest modifierDto : dto.getModifiers()) {
                Modifier modifier = modifierMapper.toEntity(modifierDto);
                modifierGroup.addModifier(modifier);
            }
        }

        // Save modifier group
        ModifierGroup savedModifierGroup = modifierGroupRepo.save(modifierGroup);

        log.info("Created modifier group with UUID: {} for restaurant: {}",
                savedModifierGroup.getModifierGroupUuid(), restaurantUuid);

        return modifierGroupMapper.toResponseDto(savedModifierGroup);
    }

    @Transactional(readOnly = true)
    public List<ModifierGroupResponseDto> getAllModifierGroups(String restaurantUuid, boolean includeInactive) {
        log.info("Fetching all modifier groups for restaurant: {}, includeInactive: {}",
                restaurantUuid, includeInactive);

        List<ModifierGroup> modifierGroups;
        if (includeInactive) {
            modifierGroups = modifierGroupRepo
                    .findByRestaurant_RestaurantUuidAndIsDeletedFalseOrderBySortOrderAsc(restaurantUuid);
        } else {
            modifierGroups = modifierGroupRepo
                    .findByRestaurant_RestaurantUuidAndIsActiveTrueAndIsDeletedFalseOrderBySortOrderAsc(restaurantUuid);
        }

        return modifierGroups.stream()
                .map(modifierGroupMapper::toResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ModifierGroupResponseDto getModifierGroupById(String restaurantUuid, String modifierGroupUuid) {
        log.info("Fetching modifier group: {} for restaurant: {}", modifierGroupUuid, restaurantUuid);

        ModifierGroup modifierGroup = modifierGroupRepo.findByModifierGroupUuid(modifierGroupUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Modifier group not found with UUID: " + modifierGroupUuid));

        // Validate modifier group belongs to restaurant
        if (!modifierGroup.getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new BusinessException("Modifier group does not belong to this restaurant");
        }

        return modifierGroupMapper.toResponseDto(modifierGroup);
    }

    @Transactional(readOnly = true)
    public List<ModifierGroupResponseDto> searchModifierGroups(String restaurantUuid, String searchTerm) {
        log.info("Searching modifier groups for restaurant: {}, searchTerm: {}", restaurantUuid, searchTerm);

        List<ModifierGroup> modifierGroups = modifierGroupRepo.searchModifierGroups(restaurantUuid, searchTerm);

        return modifierGroups.stream()
                .map(modifierGroupMapper::toResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ModifierGroupResponseDto updateModifierGroup(String restaurantUuid, String modifierGroupUuid,
                                                       UpdateModifierGroupRequest dto) {
        log.info("Updating modifier group: {} for restaurant: {}", modifierGroupUuid, restaurantUuid);

        // Find modifier group
        ModifierGroup modifierGroup = modifierGroupRepo.findByModifierGroupUuid(modifierGroupUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Modifier group not found with UUID: " + modifierGroupUuid));

        // Validate modifier group belongs to restaurant
        if (!modifierGroup.getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new BusinessException("Modifier group does not belong to this restaurant");
        }

        // Validate name uniqueness if changed
        if (dto.getName() != null && !dto.getName().isEmpty() &&
            !dto.getName().equals(modifierGroup.getName()) &&
            modifierGroupRepo.existsByRestaurant_RestaurantUuidAndNameAndModifierGroupUuidNotAndIsDeletedFalse(
                    restaurantUuid, dto.getName(), modifierGroupUuid)) {
            throw new BusinessException("Modifier group with name '" + dto.getName() + "' already exists");
        }

        // Validate selection constraints if provided
        Integer minSelection = dto.getMinSelection() != null ? dto.getMinSelection() : modifierGroup.getMinSelection();
        Integer maxSelection = dto.getMaxSelection() != null ? dto.getMaxSelection() : modifierGroup.getMaxSelection();

        if (minSelection > maxSelection) {
            throw new BusinessException("Minimum selection cannot be greater than maximum selection");
        }

        // Update modifier group fields
        modifierGroupMapper.updateEntity(dto, modifierGroup);

        ModifierGroup updatedModifierGroup = modifierGroupRepo.save(modifierGroup);
        log.info("Updated modifier group: {} for restaurant: {}", modifierGroupUuid, restaurantUuid);

        return modifierGroupMapper.toResponseDto(updatedModifierGroup);
    }

    @Transactional
    public void deleteModifierGroup(String restaurantUuid, String modifierGroupUuid) {
        log.info("Deleting modifier group: {} for restaurant: {}", modifierGroupUuid, restaurantUuid);

        ModifierGroup modifierGroup = modifierGroupRepo.findByModifierGroupUuid(modifierGroupUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Modifier group not found with UUID: " + modifierGroupUuid));

        // Validate modifier group belongs to restaurant
        if (!modifierGroup.getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new BusinessException("Modifier group does not belong to this restaurant");
        }

        // Check if modifier group is attached to any products
        if (!modifierGroup.getProducts().isEmpty()) {
            throw new BusinessException("Cannot delete modifier group that is attached to products. " +
                    "Please remove it from all products first.");
        }

        // Soft delete
        modifierGroupRepo.delete(modifierGroup);
        log.info("Deleted modifier group: {} for restaurant: {}", modifierGroupUuid, restaurantUuid);
    }

    @Transactional
    public void toggleModifierGroupStatus(String restaurantUuid, String modifierGroupUuid, boolean isActive) {
        log.info("Toggling modifier group status: {} to {} for restaurant: {}",
                modifierGroupUuid, isActive, restaurantUuid);

        ModifierGroup modifierGroup = modifierGroupRepo.findByModifierGroupUuid(modifierGroupUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Modifier group not found with UUID: " + modifierGroupUuid));

        // Validate modifier group belongs to restaurant
        if (!modifierGroup.getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new BusinessException("Modifier group does not belong to this restaurant");
        }

        modifierGroup.setIsActive(isActive);
        modifierGroupRepo.save(modifierGroup);
        log.info("Toggled modifier group status: {} to {} for restaurant: {}",
                modifierGroupUuid, isActive, restaurantUuid);
    }
}
