package org.foodos.product.controller;

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
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/restaurants/{restaurantUuid}/products/{productUuid}/variations")
@RequiredArgsConstructor
@Slf4j
public class ProductVariationController {

    private final ProductVariationService variationService;

    @PostMapping
    public ResponseEntity<ProductVariationResponseDto> createVariation(
            @PathVariable String restaurantUuid,
            @PathVariable String productUuid,
            @Valid @RequestBody CreateVariationRequest request) {
        log.info("REST request to create variation for product: {}", productUuid);
        ProductVariationResponseDto response = variationService.createVariation(restaurantUuid, productUuid, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<ProductVariationResponseDto>> createVariationsBulk(
            @PathVariable String restaurantUuid,
            @PathVariable String productUuid,
            @Valid @RequestBody BulkCreateVariationsRequest request) {
        log.info("REST request to create variations in bulk for product: {}", productUuid);
        List<ProductVariationResponseDto> response = variationService.createVariationsBulk(
                restaurantUuid, productUuid, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<ProductVariationResponseDto>> getVariationsByProduct(
            @PathVariable String restaurantUuid,
            @PathVariable String productUuid,
            @RequestParam(defaultValue = "false") boolean includeInactive) {
        log.info("REST request to get variations for product: {}", productUuid);
        List<ProductVariationResponseDto> response = variationService.getVariationsByProduct(
                restaurantUuid, productUuid, includeInactive);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{variationUuid}")
    public ResponseEntity<ProductVariationResponseDto> getVariationById(
            @PathVariable String restaurantUuid,
            @PathVariable String productUuid,
            @PathVariable String variationUuid) {
        log.info("REST request to get variation: {}", variationUuid);
        ProductVariationResponseDto response = variationService.getVariationById(restaurantUuid, variationUuid);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{variationUuid}")
    public ResponseEntity<ProductVariationResponseDto> updateVariation(
            @PathVariable String restaurantUuid,
            @PathVariable String productUuid,
            @PathVariable String variationUuid,
            @Valid @RequestBody UpdateVariationRequest request) {
        log.info("REST request to update variation: {}", variationUuid);
        ProductVariationResponseDto response = variationService.updateVariation(
                restaurantUuid, variationUuid, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{variationUuid}")
    public ResponseEntity<Void> deleteVariation(
            @PathVariable String restaurantUuid,
            @PathVariable String productUuid,
            @PathVariable String variationUuid) {
        log.info("REST request to delete variation: {}", variationUuid);
        variationService.deleteVariation(restaurantUuid, variationUuid);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{variationUuid}/toggle-status")
    public ResponseEntity<Void> toggleVariationStatus(
            @PathVariable String restaurantUuid,
            @PathVariable String productUuid,
            @PathVariable String variationUuid,
            @RequestParam boolean isActive) {
        log.info("REST request to toggle variation status: {} to {}", variationUuid, isActive);
        variationService.toggleVariationStatus(restaurantUuid, variationUuid, isActive);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{variationUuid}/set-default")
    public ResponseEntity<ProductVariationResponseDto> setDefaultVariation(
            @PathVariable String restaurantUuid,
            @PathVariable String productUuid,
            @PathVariable String variationUuid) {
        log.info("REST request to set variation {} as default for product: {}", variationUuid, productUuid);
        ProductVariationResponseDto response = variationService.setDefaultVariation(
                restaurantUuid, productUuid, variationUuid);
        return ResponseEntity.ok(response);
    }
}
