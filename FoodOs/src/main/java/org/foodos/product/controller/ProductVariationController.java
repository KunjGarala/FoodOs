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
import org.foodos.product.dto.request.BulkCreateVariationsRequest;
import org.foodos.product.dto.request.CreateVariationRequest;
import org.foodos.product.dto.request.UpdateVariationRequest;
import org.foodos.product.dto.response.ProductVariationResponseDto;
import org.foodos.product.service.ProductVariationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/restaurants/{restaurantUuid}/products/{productUuid}/variations")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Product Variation Management", description = "APIs for managing product variations (sizes, options, etc.)")
public class ProductVariationController {

    private final ProductVariationService variationService;

    @Operation(summary = "Create a new product variation",
               description = "Creates a new variation for a specific product (e.g., Small, Medium, Large)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Variation created successfully",
                    content = @Content(schema = @Schema(implementation = ProductVariationResponseDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data",
                    content = @Content),
            @ApiResponse(responseCode = "404", description = "Restaurant or product not found",
                    content = @Content)
    })
    @PostMapping
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
    public ResponseEntity<ProductVariationResponseDto> createVariation(
            @Parameter(description = "UUID of the restaurant", required = true)
            @PathVariable String restaurantUuid,
            @Parameter(description = "UUID of the product", required = true)
            @PathVariable String productUuid,
            @Parameter(description = "Variation creation request", required = true)
            @Valid @RequestBody CreateVariationRequest request) {
        log.info("REST request to create variation for product: {}", productUuid);
        ProductVariationResponseDto response = variationService.createVariation(restaurantUuid, productUuid, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Create multiple product variations in bulk",
               description = "Creates multiple variations at once for a specific product")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Variations created successfully",
                    content = @Content(schema = @Schema(implementation = ProductVariationResponseDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data",
                    content = @Content),
            @ApiResponse(responseCode = "404", description = "Restaurant or product not found",
                    content = @Content)
    })
    @PostMapping("/bulk")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
    public ResponseEntity<List<ProductVariationResponseDto>> createVariationsBulk(
            @Parameter(description = "UUID of the restaurant", required = true)
            @PathVariable String restaurantUuid,
            @Parameter(description = "UUID of the product", required = true)
            @PathVariable String productUuid,
            @Parameter(description = "Bulk variation creation request", required = true)
            @Valid @RequestBody BulkCreateVariationsRequest request) {
        log.info("REST request to create variations in bulk for product: {}", productUuid);
        List<ProductVariationResponseDto> response = variationService.createVariationsBulk(
                restaurantUuid, productUuid, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Get all product variations",
               description = "Retrieves all variations for a specific product")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Variations retrieved successfully",
                    content = @Content(schema = @Schema(implementation = ProductVariationResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "Restaurant or product not found",
                    content = @Content)
    })
    @GetMapping
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'GUEST')")
    public ResponseEntity<List<ProductVariationResponseDto>> getVariationsByProduct(
            @Parameter(description = "UUID of the restaurant", required = true)
            @PathVariable String restaurantUuid,
            @Parameter(description = "UUID of the product", required = true)
            @PathVariable String productUuid,
            @Parameter(description = "Include inactive variations")
            @RequestParam(defaultValue = "false") boolean includeInactive) {
        log.info("REST request to get variations for product: {}", productUuid);
        List<ProductVariationResponseDto> response = variationService.getVariationsByProduct(
                restaurantUuid, productUuid, includeInactive);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get product variation by ID",
               description = "Retrieves a specific product variation by its UUID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Variation retrieved successfully",
                    content = @Content(schema = @Schema(implementation = ProductVariationResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "Restaurant, product, or variation not found",
                    content = @Content)
    })
    @GetMapping("/{variationUuid}")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'GUEST')")
    public ResponseEntity<ProductVariationResponseDto> getVariationById(
            @Parameter(description = "UUID of the restaurant", required = true)
            @PathVariable String restaurantUuid,
            @Parameter(description = "UUID of the product", required = true)
            @PathVariable String productUuid,
            @Parameter(description = "UUID of the variation", required = true)
            @PathVariable String variationUuid) {
        log.info("REST request to get variation: {}", variationUuid);
        ProductVariationResponseDto response = variationService.getVariationById(restaurantUuid, variationUuid);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Update product variation",
               description = "Updates an existing product variation with new information")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Variation updated successfully",
                    content = @Content(schema = @Schema(implementation = ProductVariationResponseDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data",
                    content = @Content),
            @ApiResponse(responseCode = "404", description = "Restaurant, product, or variation not found",
                    content = @Content)
    })
    @PutMapping("/{variationUuid}")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
    public ResponseEntity<ProductVariationResponseDto> updateVariation(
            @Parameter(description = "UUID of the restaurant", required = true)
            @PathVariable String restaurantUuid,
            @Parameter(description = "UUID of the product", required = true)
            @PathVariable String productUuid,
            @Parameter(description = "UUID of the variation to update", required = true)
            @PathVariable String variationUuid,
            @Parameter(description = "Variation update request", required = true)
            @Valid @RequestBody UpdateVariationRequest request) {
        log.info("REST request to update variation: {}", variationUuid);
        ProductVariationResponseDto response = variationService.updateVariation(
                restaurantUuid, variationUuid, request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Delete product variation",
               description = "Permanently deletes a product variation")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Variation deleted successfully",
                    content = @Content),
            @ApiResponse(responseCode = "404", description = "Restaurant, product, or variation not found",
                    content = @Content)
    })
    @DeleteMapping("/{variationUuid}")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
    public ResponseEntity<Void> deleteVariation(
            @Parameter(description = "UUID of the restaurant", required = true)
            @PathVariable String restaurantUuid,
            @Parameter(description = "UUID of the product", required = true)
            @PathVariable String productUuid,
            @Parameter(description = "UUID of the variation to delete", required = true)
            @PathVariable String variationUuid) {
        log.info("REST request to delete variation: {}", variationUuid);
        variationService.deleteVariation(restaurantUuid, variationUuid);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Toggle product variation status",
               description = "Activates or deactivates a product variation")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Variation status toggled successfully",
                    content = @Content),
            @ApiResponse(responseCode = "404", description = "Restaurant, product, or variation not found",
                    content = @Content)
    })
    @PatchMapping("/{variationUuid}/toggle-status")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
    public ResponseEntity<Void> toggleVariationStatus(
            @Parameter(description = "UUID of the restaurant", required = true)
            @PathVariable String restaurantUuid,
            @Parameter(description = "UUID of the product", required = true)
            @PathVariable String productUuid,
            @Parameter(description = "UUID of the variation", required = true)
            @PathVariable String variationUuid,
            @Parameter(description = "Desired active status (true for active, false for inactive)", required = true)
            @RequestParam boolean isActive) {
        log.info("REST request to toggle variation status: {} to {}", variationUuid, isActive);
        variationService.toggleVariationStatus(restaurantUuid, variationUuid, isActive);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Set default product variation",
               description = "Sets a specific variation as the default for the product")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Default variation set successfully",
                    content = @Content(schema = @Schema(implementation = ProductVariationResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "Restaurant, product, or variation not found",
                    content = @Content)
    })
    @PatchMapping("/{variationUuid}/set-default")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')") 
    public ResponseEntity<ProductVariationResponseDto> setDefaultVariation(
            @Parameter(description = "UUID of the restaurant", required = true)
            @PathVariable String restaurantUuid,
            @Parameter(description = "UUID of the product", required = true)
            @PathVariable String productUuid,
            @Parameter(description = "UUID of the variation to set as default", required = true)
            @PathVariable String variationUuid) {
        log.info("REST request to set variation {} as default for product: {}", variationUuid, productUuid);
        ProductVariationResponseDto response = variationService.setDefaultVariation(
                restaurantUuid, productUuid, variationUuid);
        return ResponseEntity.ok(response);
    }
}
