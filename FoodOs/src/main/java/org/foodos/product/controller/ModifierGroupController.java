package org.foodos.product.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.product.dto.request.CreateModifierGroupRequest;
import org.foodos.product.dto.request.UpdateModifierGroupRequest;
import org.foodos.product.dto.response.ModifierGroupResponseDto;
import org.foodos.product.service.ModifierGroupService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/restaurants/{restaurantUuid}/modifier-groups")
@RequiredArgsConstructor
@Slf4j
public class ModifierGroupController {

    private final ModifierGroupService modifierGroupService;

    @PostMapping
    public ResponseEntity<ModifierGroupResponseDto> createModifierGroup(
            @PathVariable String restaurantUuid,
            @Valid @RequestBody CreateModifierGroupRequest request) {
        log.info("REST request to create modifier group for restaurant: {}", restaurantUuid);
        ModifierGroupResponseDto response = modifierGroupService.createModifierGroup(restaurantUuid, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<ModifierGroupResponseDto>> getAllModifierGroups(
            @PathVariable String restaurantUuid,
            @RequestParam(defaultValue = "false") boolean includeInactive) {
        log.info("REST request to get all modifier groups for restaurant: {}", restaurantUuid);
        List<ModifierGroupResponseDto> response = modifierGroupService.getAllModifierGroups(
                restaurantUuid, includeInactive);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{modifierGroupUuid}")
    public ResponseEntity<ModifierGroupResponseDto> getModifierGroupById(
            @PathVariable String restaurantUuid,
            @PathVariable String modifierGroupUuid) {
        log.info("REST request to get modifier group: {}", modifierGroupUuid);
        ModifierGroupResponseDto response = modifierGroupService.getModifierGroupById(
                restaurantUuid, modifierGroupUuid);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    public ResponseEntity<List<ModifierGroupResponseDto>> searchModifierGroups(
            @PathVariable String restaurantUuid,
            @RequestParam String searchTerm) {
        log.info("REST request to search modifier groups with term: {}", searchTerm);
        List<ModifierGroupResponseDto> response = modifierGroupService.searchModifierGroups(
                restaurantUuid, searchTerm);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{modifierGroupUuid}")
    public ResponseEntity<ModifierGroupResponseDto> updateModifierGroup(
            @PathVariable String restaurantUuid,
            @PathVariable String modifierGroupUuid,
            @Valid @RequestBody UpdateModifierGroupRequest request) {
        log.info("REST request to update modifier group: {}", modifierGroupUuid);
        ModifierGroupResponseDto response = modifierGroupService.updateModifierGroup(
                restaurantUuid, modifierGroupUuid, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{modifierGroupUuid}")
    public ResponseEntity<Void> deleteModifierGroup(
            @PathVariable String restaurantUuid,
            @PathVariable String modifierGroupUuid) {
        log.info("REST request to delete modifier group: {}", modifierGroupUuid);
        modifierGroupService.deleteModifierGroup(restaurantUuid, modifierGroupUuid);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{modifierGroupUuid}/toggle-status")
    public ResponseEntity<Void> toggleModifierGroupStatus(
            @PathVariable String restaurantUuid,
            @PathVariable String modifierGroupUuid,
            @RequestParam boolean isActive) {
        log.info("REST request to toggle modifier group status: {} to {}", modifierGroupUuid, isActive);
        modifierGroupService.toggleModifierGroupStatus(restaurantUuid, modifierGroupUuid, isActive);
        return ResponseEntity.ok().build();
    }
}
