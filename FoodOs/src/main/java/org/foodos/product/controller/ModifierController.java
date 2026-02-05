package org.foodos.product.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.product.dto.request.BulkCreateModifiersRequest;
import org.foodos.product.dto.request.CreateModifierRequest;
import org.foodos.product.dto.request.UpdateModifierRequest;
import org.foodos.product.dto.response.ModifierResponseDto;
import org.foodos.product.service.ModifierService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/restaurants/{restaurantUuid}/modifier-groups/{modifierGroupUuid}/modifiers")
@RequiredArgsConstructor
@Slf4j
public class ModifierController {

    private final ModifierService modifierService;

    @PostMapping
    public ResponseEntity<ModifierResponseDto> createModifier(
            @PathVariable String restaurantUuid,
            @PathVariable String modifierGroupUuid,
            @Valid @RequestBody CreateModifierRequest request) {
        log.info("REST request to create modifier for modifier group: {}", modifierGroupUuid);
        ModifierResponseDto response = modifierService.createModifier(restaurantUuid, modifierGroupUuid, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<ModifierResponseDto>> createModifiersBulk(
            @PathVariable String restaurantUuid,
            @PathVariable String modifierGroupUuid,
            @Valid @RequestBody BulkCreateModifiersRequest request) {
        log.info("REST request to create modifiers in bulk for modifier group: {}", modifierGroupUuid);
        List<ModifierResponseDto> response = modifierService.createModifiersBulk(
                restaurantUuid, modifierGroupUuid, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<ModifierResponseDto>> getModifiersByGroup(
            @PathVariable String restaurantUuid,
            @PathVariable String modifierGroupUuid,
            @RequestParam(defaultValue = "false") boolean includeInactive) {
        log.info("REST request to get modifiers for modifier group: {}", modifierGroupUuid);
        List<ModifierResponseDto> response = modifierService.getModifiersByGroup(
                restaurantUuid, modifierGroupUuid, includeInactive);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{modifierUuid}")
    public ResponseEntity<ModifierResponseDto> getModifierById(
            @PathVariable String restaurantUuid,
            @PathVariable String modifierGroupUuid,
            @PathVariable String modifierUuid) {
        log.info("REST request to get modifier: {}", modifierUuid);
        ModifierResponseDto response = modifierService.getModifierById(restaurantUuid, modifierUuid);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{modifierUuid}")
    public ResponseEntity<ModifierResponseDto> updateModifier(
            @PathVariable String restaurantUuid,
            @PathVariable String modifierGroupUuid,
            @PathVariable String modifierUuid,
            @Valid @RequestBody UpdateModifierRequest request) {
        log.info("REST request to update modifier: {}", modifierUuid);
        ModifierResponseDto response = modifierService.updateModifier(restaurantUuid, modifierUuid, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{modifierUuid}")
    public ResponseEntity<Void> deleteModifier(
            @PathVariable String restaurantUuid,
            @PathVariable String modifierGroupUuid,
            @PathVariable String modifierUuid) {
        log.info("REST request to delete modifier: {}", modifierUuid);
        modifierService.deleteModifier(restaurantUuid, modifierUuid);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{modifierUuid}/toggle-status")
    public ResponseEntity<Void> toggleModifierStatus(
            @PathVariable String restaurantUuid,
            @PathVariable String modifierGroupUuid,
            @PathVariable String modifierUuid,
            @RequestParam boolean isActive) {
        log.info("REST request to toggle modifier status: {} to {}", modifierUuid, isActive);
        modifierService.toggleModifierStatus(restaurantUuid, modifierUuid, isActive);
        return ResponseEntity.ok().build();
    }
}
