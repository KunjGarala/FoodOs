package org.foodos.product.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/restaurants/{restaurantUuid}/modifier-groups/{modifierGroupUuid}/modifiers")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Modifier Management", description = "APIs for managing individual modifiers within modifier groups")
public class ModifierController {

    private final ModifierService modifierService;

    @Operation(summary = "Create a new modifier",
               description = "Creates a new modifier within a specific modifier group")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Modifier created successfully",
                    content = @Content(schema = @Schema(implementation = ModifierResponseDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data",
                    content = @Content),
            @ApiResponse(responseCode = "404", description = "Restaurant or modifier group not found",
                    content = @Content)
    })
    @PostMapping
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
    public ResponseEntity<ModifierResponseDto> createModifier(
            @Parameter(description = "UUID of the restaurant", required = true)
            @PathVariable String restaurantUuid,
            @Parameter(description = "UUID of the modifier group", required = true)
            @PathVariable String modifierGroupUuid,
            @Parameter(description = "Modifier creation request", required = true)
            @Valid @RequestBody CreateModifierRequest request) {
        log.info("REST request to create modifier for modifier group: {}", modifierGroupUuid);
        ModifierResponseDto response = modifierService.createModifier(restaurantUuid, modifierGroupUuid, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Create multiple modifiers in bulk",
               description = "Creates multiple modifiers at once within a specific modifier group")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Modifiers created successfully",
                    content = @Content(schema = @Schema(implementation = ModifierResponseDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data",
                    content = @Content),
            @ApiResponse(responseCode = "404", description = "Restaurant or modifier group not found",
                    content = @Content)
    })
    @PostMapping("/bulk")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
    public ResponseEntity<List<ModifierResponseDto>> createModifiersBulk(
            @Parameter(description = "UUID of the restaurant", required = true)
            @PathVariable String restaurantUuid,
            @Parameter(description = "UUID of the modifier group", required = true)
            @PathVariable String modifierGroupUuid,
            @Parameter(description = "Bulk modifier creation request", required = true)
            @Valid @RequestBody BulkCreateModifiersRequest request) {
        log.info("REST request to create modifiers in bulk for modifier group: {}", modifierGroupUuid);
        List<ModifierResponseDto> response = modifierService.createModifiersBulk(
                restaurantUuid, modifierGroupUuid, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Get all modifiers in a group",
               description = "Retrieves all modifiers within a specific modifier group")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Modifiers retrieved successfully",
                    content = @Content(schema = @Schema(implementation = ModifierResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "Restaurant or modifier group not found",
                    content = @Content)
    })
    @GetMapping
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'GUEST')")
    public ResponseEntity<List<ModifierResponseDto>> getModifiersByGroup(
            @Parameter(description = "UUID of the restaurant", required = true)
            @PathVariable String restaurantUuid,
            @Parameter(description = "UUID of the modifier group", required = true)
            @PathVariable String modifierGroupUuid,
            @Parameter(description = "Include inactive modifiers")
            @RequestParam(defaultValue = "false") boolean includeInactive) {
        log.info("REST request to get modifiers for modifier group: {}", modifierGroupUuid);
        List<ModifierResponseDto> response = modifierService.getModifiersByGroup(
                restaurantUuid, modifierGroupUuid, includeInactive);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get modifier by ID",
               description = "Retrieves a specific modifier by its UUID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Modifier retrieved successfully",
                    content = @Content(schema = @Schema(implementation = ModifierResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "Restaurant or modifier not found",
                    content = @Content)
    })
    @GetMapping("/{modifierUuid}")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'GUEST')")
    public ResponseEntity<ModifierResponseDto> getModifierById(
            @Parameter(description = "UUID of the restaurant", required = true)
            @PathVariable String restaurantUuid,
            @Parameter(description = "UUID of the modifier group", required = true)
            @PathVariable String modifierGroupUuid,
            @Parameter(description = "UUID of the modifier", required = true)
            @PathVariable String modifierUuid) {
        log.info("REST request to get modifier: {}", modifierUuid);
        ModifierResponseDto response = modifierService.getModifierById(restaurantUuid, modifierUuid);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Update modifier",
               description = "Updates an existing modifier with new information")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Modifier updated successfully",
                    content = @Content(schema = @Schema(implementation = ModifierResponseDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data",
                    content = @Content),
            @ApiResponse(responseCode = "404", description = "Restaurant or modifier not found",
                    content = @Content)
    })
    @PutMapping("/{modifierUuid}")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
    public ResponseEntity<ModifierResponseDto> updateModifier(
            @Parameter(description = "UUID of the restaurant", required = true)
            @PathVariable String restaurantUuid,
            @Parameter(description = "UUID of the modifier group", required = true)
            @PathVariable String modifierGroupUuid,
            @Parameter(description = "UUID of the modifier to update", required = true)
            @PathVariable String modifierUuid,
            @Parameter(description = "Modifier update request", required = true)
            @Valid @RequestBody UpdateModifierRequest request) {
        log.info("REST request to update modifier: {}", modifierUuid);
        ModifierResponseDto response = modifierService.updateModifier(restaurantUuid, modifierUuid, request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Delete modifier",
               description = "Permanently deletes a modifier from the modifier group")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Modifier deleted successfully",
                    content = @Content),
            @ApiResponse(responseCode = "404", description = "Restaurant or modifier not found",
                    content = @Content)
    })
    @DeleteMapping("/{modifierUuid}")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
    public ResponseEntity<Void> deleteModifier(
            @Parameter(description = "UUID of the restaurant", required = true)
            @PathVariable String restaurantUuid,
            @Parameter(description = "UUID of the modifier group", required = true)
            @PathVariable String modifierGroupUuid,
            @Parameter(description = "UUID of the modifier to delete", required = true)
            @PathVariable String modifierUuid) {
        log.info("REST request to delete modifier: {}", modifierUuid);
        modifierService.deleteModifier(restaurantUuid, modifierUuid);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Toggle modifier status",
               description = "Activates or deactivates a modifier")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Modifier status toggled successfully",
                    content = @Content),
            @ApiResponse(responseCode = "404", description = "Restaurant or modifier not found",
                    content = @Content)
    })
    @PatchMapping("/{modifierUuid}/toggle-status")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
    public ResponseEntity<Void> toggleModifierStatus(
            @Parameter(description = "UUID of the restaurant", required = true)
            @PathVariable String restaurantUuid,
            @Parameter(description = "UUID of the modifier group", required = true)
            @PathVariable String modifierGroupUuid,
            @Parameter(description = "UUID of the modifier", required = true)
            @PathVariable String modifierUuid,
            @Parameter(description = "Desired active status (true for active, false for inactive)", required = true)
            @RequestParam boolean isActive) {
        log.info("REST request to toggle modifier status: {} to {}", modifierUuid, isActive);
        modifierService.toggleModifierStatus(restaurantUuid, modifierUuid, isActive);
        return ResponseEntity.ok().build();
    }
}
