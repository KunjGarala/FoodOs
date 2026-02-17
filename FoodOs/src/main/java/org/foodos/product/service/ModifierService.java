package org.foodos.product.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.common.exceptionhandling.exception.BusinessException;
import org.foodos.common.exceptionhandling.exception.ResourceNotFoundException;
import org.foodos.product.dto.request.BulkCreateModifiersRequest;
import org.foodos.product.dto.request.CreateModifierRequest;
import org.foodos.product.dto.request.UpdateModifierRequest;
import org.foodos.product.dto.response.ModifierResponseDto;
import org.foodos.product.entity.Modifier;
import org.foodos.product.entity.ModifierGroup;
import org.foodos.product.mapper.ModifierMapper;
import org.foodos.product.repository.ModifierGroupRepo;
import org.foodos.product.repository.ModifierRepo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ModifierService {

    private final ModifierRepo modifierRepo;
    private final ModifierGroupRepo modifierGroupRepo;
    private final ModifierMapper modifierMapper;

    @Transactional
    public ModifierResponseDto createModifier(String restaurantUuid, String modifierGroupUuid,
                                             CreateModifierRequest dto) {
        log.info("Creating modifier for modifier group: {}", modifierGroupUuid);

        // Validate modifier group
        ModifierGroup modifierGroup = modifierGroupRepo.findByModifierGroupUuidAndIsDeletedFalse(modifierGroupUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Modifier group not found with UUID: " + modifierGroupUuid));

        // Validate modifier group belongs to restaurant
        if (!modifierGroup.getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new BusinessException("Modifier group does not belong to this restaurant");
        }

        // Validate SKU uniqueness if provided
        if (dto.getSku() != null && !dto.getSku().isEmpty() && modifierRepo.existsBySku(dto.getSku())) {
            throw new BusinessException("Modifier with SKU '" + dto.getSku() + "' already exists");
        }

        // Map DTO to entity
        Modifier modifier = modifierMapper.toEntity(dto);
        modifier.setModifierGroup(modifierGroup);

        // Save modifier
        Modifier savedModifier = modifierRepo.save(modifier);

        log.info("Created modifier with UUID: {} for modifier group: {}", savedModifier.getModifierUuid(), modifierGroupUuid);

        return modifierMapper.toResponseDto(savedModifier);
    }

    @Transactional
    public List<ModifierResponseDto> createModifiersBulk(String restaurantUuid, String modifierGroupUuid,
                                                        BulkCreateModifiersRequest request) {
        log.info("Creating {} modifiers in bulk for modifier group: {}", request.getModifiers().size(), modifierGroupUuid);

        // Validate modifier group
        ModifierGroup modifierGroup = modifierGroupRepo.findByModifierGroupUuidAndIsDeletedFalse(modifierGroupUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Modifier group not found with UUID: " + modifierGroupUuid));

        // Validate modifier group belongs to restaurant
        if (!modifierGroup.getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new BusinessException("Modifier group does not belong to this restaurant");
        }

        List<Modifier> modifiers = new ArrayList<>();

        for (CreateModifierRequest dto : request.getModifiers()) {
            // Validate SKU uniqueness if provided
            if (dto.getSku() != null && !dto.getSku().isEmpty() && modifierRepo.existsBySku(dto.getSku())) {
                throw new BusinessException("Modifier with SKU '" + dto.getSku() + "' already exists");
            }

            Modifier modifier = modifierMapper.toEntity(dto);
            modifier.setModifierGroup(modifierGroup);
            modifiers.add(modifier);
        }

        // Save all modifiers
        List<Modifier> savedModifiers = modifierRepo.saveAll(modifiers);

        log.info("Created {} modifiers for modifier group: {}", savedModifiers.size(), modifierGroupUuid);

        return savedModifiers.stream()
                .map(modifierMapper::toResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ModifierResponseDto> getModifiersByGroup(String restaurantUuid, String modifierGroupUuid,
                                                        boolean includeInactive) {
        log.info("Fetching modifiers for modifier group: {}", modifierGroupUuid);

        // Validate modifier group exists and belongs to restaurant
        ModifierGroup modifierGroup = modifierGroupRepo.findByModifierGroupUuidAndIsDeletedFalse(modifierGroupUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Modifier group not found with UUID: " + modifierGroupUuid));

        if (!modifierGroup.getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new BusinessException("Modifier group does not belong to this restaurant");
        }

        List<Modifier> modifiers;
        if (includeInactive) {
            modifiers = modifierRepo.findByModifierGroup_ModifierGroupUuidAndIsDeletedFalseOrderBySortOrderAsc(modifierGroupUuid);
        } else {
            modifiers = modifierRepo.findByModifierGroup_ModifierGroupUuidAndIsActiveTrueAndIsDeletedFalseOrderBySortOrderAsc(modifierGroupUuid);
        }

        return modifiers.stream()
                .map(modifierMapper::toResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ModifierResponseDto getModifierById(String restaurantUuid, String modifierUuid) {
        log.info("Fetching modifier: {}", modifierUuid);

        Modifier modifier = modifierRepo.findByModifierUuidAndIsDeletedFalse(modifierUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Modifier not found with UUID: " + modifierUuid));

        // Validate modifier belongs to restaurant
        if (!modifier.getModifierGroup().getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new BusinessException("Modifier does not belong to this restaurant");
        }

        return modifierMapper.toResponseDto(modifier);
    }

    @Transactional
    public ModifierResponseDto updateModifier(String restaurantUuid, String modifierUuid,
                                             UpdateModifierRequest dto) {
        log.info("Updating modifier: {}", modifierUuid);

        // Find modifier
        Modifier modifier = modifierRepo.findByModifierUuidAndIsDeletedFalse(modifierUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Modifier not found with UUID: " + modifierUuid));

        // Validate modifier belongs to restaurant
        if (!modifier.getModifierGroup().getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new BusinessException("Modifier does not belong to this restaurant");
        }

        // Validate SKU uniqueness if changed
        if (dto.getSku() != null && !dto.getSku().isEmpty() &&
            !dto.getSku().equals(modifier.getSku()) &&
            modifierRepo.existsBySkuAndModifierUuidNot(dto.getSku(), modifierUuid)) {
            throw new BusinessException("Modifier with SKU '" + dto.getSku() + "' already exists");
        }

        // Update modifier fields
        modifierMapper.updateEntity(dto, modifier);

        Modifier updatedModifier = modifierRepo.save(modifier);
        log.info("Updated modifier: {}", modifierUuid);

        return modifierMapper.toResponseDto(updatedModifier);
    }

    @Transactional
    public void deleteModifier(String restaurantUuid, String modifierUuid) {
        log.info("Deleting modifier: {}", modifierUuid);

        Modifier modifier = modifierRepo.findByModifierUuidAndIsDeletedFalse(modifierUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Modifier not found with UUID: " + modifierUuid));

        // Validate modifier belongs to restaurant
        if (!modifier.getModifierGroup().getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new BusinessException("Modifier does not belong to this restaurant");
        }

        // Soft delete
        modifierRepo.delete(modifier);
        log.info("Deleted modifier: {}", modifierUuid);
    }

    @Transactional
    public void toggleModifierStatus(String restaurantUuid, String modifierUuid, boolean isActive) {
        log.info("Toggling modifier status: {} to {}", modifierUuid, isActive);

        Modifier modifier = modifierRepo.findByModifierUuidAndIsDeletedFalse(modifierUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Modifier not found with UUID: " + modifierUuid));

        // Validate modifier belongs to restaurant
        if (!modifier.getModifierGroup().getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new BusinessException("Modifier does not belong to this restaurant");
        }

        modifier.setIsActive(isActive);
        modifierRepo.save(modifier);
        log.info("Toggled modifier status: {} to {}", modifierUuid, isActive);
    }
}
