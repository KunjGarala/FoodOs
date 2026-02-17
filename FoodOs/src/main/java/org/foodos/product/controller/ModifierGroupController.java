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
import org.foodos.product.dto.request.CreateModifierGroupRequest;
import org.foodos.product.dto.request.UpdateModifierGroupRequest;
import org.foodos.product.dto.response.ModifierGroupResponseDto;
import org.foodos.product.service.ModifierGroupService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/restaurants/{restaurantUuid}/modifier-groups")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Modifier Group Management", description = "APIs for managing modifier groups in a restaurant")
public class ModifierGroupController {

    private final ModifierGroupService modifierGroupService;

    @Operation(summary = "Create a new modifier group",
               description = "Creates a new modifier group for a specific restaurant")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Modifier group created successfully",
                    content = @Content(schema = @Schema(implementation = ModifierGroupResponseDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data",
                    content = @Content),
            @ApiResponse(responseCode = "404", description = "Restaurant not found",
                    content = @Content)
    })
    @PostMapping
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
    public ResponseEntity<ModifierGroupResponseDto> createModifierGroup(
            @Parameter(description = "UUID of the restaurant", required = true)
            @PathVariable String restaurantUuid,
            @Parameter(description = "Modifier group creation request", required = true)
            @Valid @RequestBody CreateModifierGroupRequest request) {
        log.info("REST request to create modifier group for restaurant: {}", restaurantUuid);
        ModifierGroupResponseDto response = modifierGroupService.createModifierGroup(restaurantUuid, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Get all modifier groups",
               description = "Retrieves all modifier groups for a specific restaurant")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Modifier groups retrieved successfully",
                    content = @Content(schema = @Schema(implementation = ModifierGroupResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "Restaurant not found",
                    content = @Content)
    })
    @GetMapping
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'GUEST')")
    public ResponseEntity<List<ModifierGroupResponseDto>> getAllModifierGroups(
            @Parameter(description = "UUID of the restaurant", required = true)
            @PathVariable String restaurantUuid,
            @Parameter(description = "Include inactive modifier groups")
            @RequestParam(defaultValue = "false") boolean includeInactive) {
        log.info("REST request to get all modifier groups for restaurant: {}", restaurantUuid);
        List<ModifierGroupResponseDto> response = modifierGroupService.getAllModifierGroups(
                restaurantUuid, includeInactive);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get modifier group by ID",
               description = "Retrieves a specific modifier group by its UUID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Modifier group retrieved successfully",
                    content = @Content(schema = @Schema(implementation = ModifierGroupResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "Restaurant or modifier group not found",
                    content = @Content)
    })
    @GetMapping("/{modifierGroupUuid}")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'GUEST')")
    public ResponseEntity<ModifierGroupResponseDto> getModifierGroupById(
            @Parameter(description = "UUID of the restaurant", required = true)
            @PathVariable String restaurantUuid,
            @Parameter(description = "UUID of the modifier group", required = true)
            @PathVariable String modifierGroupUuid) {
        log.info("REST request to get modifier group: {}", modifierGroupUuid);
        ModifierGroupResponseDto response = modifierGroupService.getModifierGroupById(
                restaurantUuid, modifierGroupUuid);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Search modifier groups",
               description = "Search for modifier groups by name or other criteria")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Search completed successfully",
                    content = @Content(schema = @Schema(implementation = ModifierGroupResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "Restaurant not found",
                    content = @Content)
    })
    @GetMapping("/search")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'GUEST')")
    public ResponseEntity<List<ModifierGroupResponseDto>> searchModifierGroups(
            @Parameter(description = "UUID of the restaurant", required = true)
            @PathVariable String restaurantUuid,
            @Parameter(description = "Search term to filter modifier groups", required = true)
            @RequestParam String searchTerm) {
        log.info("REST request to search modifier groups with term: {}", searchTerm);
        List<ModifierGroupResponseDto> response = modifierGroupService.searchModifierGroups(
                restaurantUuid, searchTerm);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Update modifier group",
               description = "Updates an existing modifier group with new information")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Modifier group updated successfully",
                    content = @Content(schema = @Schema(implementation = ModifierGroupResponseDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data",
                    content = @Content),
            @ApiResponse(responseCode = "404", description = "Restaurant or modifier group not found",
                    content = @Content)
    })
    @PutMapping("/{modifierGroupUuid}")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
    public ResponseEntity<ModifierGroupResponseDto> updateModifierGroup(
            @Parameter(description = "UUID of the restaurant", required = true)
            @PathVariable String restaurantUuid,
            @Parameter(description = "UUID of the modifier group to update", required = true)
            @PathVariable String modifierGroupUuid,
            @Parameter(description = "Modifier group update request", required = true)
            @Valid @RequestBody UpdateModifierGroupRequest request) {
        log.info("REST request to update modifier group: {}", modifierGroupUuid);
        ModifierGroupResponseDto response = modifierGroupService.updateModifierGroup(
                restaurantUuid, modifierGroupUuid, request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Delete modifier group",
               description = "Permanently deletes a modifier group from the restaurant")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Modifier group deleted successfully",
                    content = @Content),
            @ApiResponse(responseCode = "404", description = "Restaurant or modifier group not found",
                    content = @Content)
    })
    @DeleteMapping("/{modifierGroupUuid}")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
    public ResponseEntity<Void> deleteModifierGroup(
            @Parameter(description = "UUID of the restaurant", required = true)
            @PathVariable String restaurantUuid,
            @Parameter(description = "UUID of the modifier group to delete", required = true)
            @PathVariable String modifierGroupUuid) {
        log.info("REST request to delete modifier group: {}", modifierGroupUuid);
        modifierGroupService.deleteModifierGroup(restaurantUuid, modifierGroupUuid);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Toggle modifier group status",
               description = "Activates or deactivates a modifier group")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Modifier group status toggled successfully",
                    content = @Content),
            @ApiResponse(responseCode = "404", description = "Restaurant or modifier group not found",
                    content = @Content)
    })
    @PatchMapping("/{modifierGroupUuid}/toggle-status")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
    public ResponseEntity<Void> toggleModifierGroupStatus(
            @Parameter(description = "UUID of the restaurant", required = true)
            @PathVariable String restaurantUuid,
            @Parameter(description = "UUID of the modifier group", required = true)
            @PathVariable String modifierGroupUuid,
            @Parameter(description = "Desired active status (true for active, false for inactive)", required = true)
            @RequestParam boolean isActive) {
        log.info("REST request to toggle modifier group status: {} to {}", modifierGroupUuid, isActive);
        modifierGroupService.toggleModifierGroupStatus(restaurantUuid, modifierGroupUuid, isActive);
        return ResponseEntity.ok().build();
    }
}
