package org.foodos.product.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.common.exceptionhandling.exception.BusinessException;
import org.foodos.common.exceptionhandling.exception.ResourceNotFoundException;
import org.foodos.product.dto.request.BulkCreateVariationsRequest;
import org.foodos.product.dto.request.CreateVariationRequest;
import org.foodos.product.dto.request.UpdateVariationRequest;
import org.foodos.product.dto.response.ProductVariationResponseDto;
import org.foodos.product.entity.Product;
import org.foodos.product.entity.ProductVariation;
import org.foodos.product.mapper.ProductVariationMapper;
import org.foodos.product.repository.ProductRepo;
import org.foodos.product.repository.ProductVariationRepo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductVariationService {

    private final ProductVariationRepo variationRepo;
    private final ProductRepo productRepo;
    private final ProductVariationMapper variationMapper;

    @Transactional
    public ProductVariationResponseDto createVariation(String restaurantUuid, String productUuid,
                                                       CreateVariationRequest dto) {
        log.info("Creating variation for product: {}", productUuid);

        // Validate product
        Product product = productRepo.findByProductUuidAndIsDeletedFalse(productUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with UUID: " + productUuid));

        // Validate product belongs to restaurant
        if (!product.getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new BusinessException("Product does not belong to this restaurant");
        }

        // Validate SKU uniqueness if provided
        if (dto.getSku() != null && !dto.getSku().isEmpty() && variationRepo.existsBySku(dto.getSku())) {
            throw new BusinessException("Variation with SKU '" + dto.getSku() + "' already exists");
        }

        // Check if this is the first variation
        long existingCount = variationRepo.countByProductUuid(productUuid);
        boolean isFirstVariation = existingCount == 0;

        // Determine if this variation should be default
        boolean shouldBeDefault = Boolean.TRUE.equals(dto.getIsDefault()) || isFirstVariation;

        // If this should be default, unset any existing default
        if (shouldBeDefault) {
            unsetExistingDefaultVariation(productUuid);
        }

        // Map DTO to entity
        ProductVariation variation = variationMapper.toEntity(dto);
        variation.setProduct(product);

        // Explicitly set as default if needed
        if (shouldBeDefault) {
            variation.setIsDefault(true);
        }

        // Save variation
        ProductVariation savedVariation = variationRepo.save(variation);

        // Update product hasVariations flag
        product.setHasVariations(true);
        productRepo.save(product);

        log.info("Created variation with UUID: {} for product: {}", savedVariation.getVariationUuid(), productUuid);

        return variationMapper.toResponseDto(savedVariation);
    }

    @Transactional
    public List<ProductVariationResponseDto> createVariationsBulk(String restaurantUuid, String productUuid,
                                                                  BulkCreateVariationsRequest request) {
        log.info("Creating {} variations in bulk for product: {}", request.getVariations().size(), productUuid);

        // Validate product
        Product product = productRepo.findByProductUuidAndIsDeletedFalse(productUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with UUID: " + productUuid));

        // Validate product belongs to restaurant
        if (!product.getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new BusinessException("Product does not belong to this restaurant");
        }

        List<ProductVariation> variations = new ArrayList<>();
        int defaultIndex = -1;

        // First pass: validate and create variations
        for (int i = 0; i < request.getVariations().size(); i++) {
            CreateVariationRequest dto = request.getVariations().get(i);

            // Validate SKU uniqueness if provided
            if (dto.getSku() != null && !dto.getSku().isEmpty() && variationRepo.existsBySku(dto.getSku())) {
                throw new BusinessException("Variation with SKU '" + dto.getSku() + "' already exists");
            }

            // Track if we have a default
            if (Boolean.TRUE.equals(dto.getIsDefault())) {
                if (defaultIndex != -1) {
                    throw new BusinessException("Only one variation can be set as default");
                }
                defaultIndex = i;
            }

            ProductVariation variation = variationMapper.toEntity(dto);
            variation.setProduct(product);
            variations.add(variation);
        }

        // Check if this is the first batch of variations
        long existingCount = variationRepo.countByProductUuid(productUuid);
        boolean isFirstBatch = existingCount == 0;

        // If no default specified and this is the first batch, make the first variation default
        if (defaultIndex == -1 && isFirstBatch && !variations.isEmpty()) {
            defaultIndex = 0;
            log.info("Automatically setting first variation as default");
        }

        // If we have a default to set, unset any existing default and set the new one
        if (defaultIndex != -1) {
            unsetExistingDefaultVariation(productUuid);
            variations.get(defaultIndex).setIsDefault(true);
        }

        // Save all variations
        List<ProductVariation> savedVariations = variationRepo.saveAll(variations);

        // Update product hasVariations flag
        product.setHasVariations(true);
        productRepo.save(product);

        log.info("Created {} variations for product: {}", savedVariations.size(), productUuid);

        return savedVariations.stream()
                .map(variationMapper::toResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductVariationResponseDto> getVariationsByProduct(String restaurantUuid, String productUuid,
                                                                    boolean includeInactive) {
        log.info("Fetching variations for product: {}", productUuid);

        // Validate product exists and belongs to restaurant
        Product product = productRepo.findByProductUuidAndIsDeletedFalse(productUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with UUID: " + productUuid));

        if (!product.getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new BusinessException("Product does not belong to this restaurant");
        }

        List<ProductVariation> variations;
        if (includeInactive) {
            variations = variationRepo.findByProduct_ProductUuidAndIsDeletedFalseOrderBySortOrderAsc(productUuid);
        } else {
            variations = variationRepo.findByProduct_ProductUuidAndIsActiveTrueAndIsDeletedFalseOrderBySortOrderAsc(productUuid);
        }

        return variations.stream()
                .map(variationMapper::toResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductVariationResponseDto getVariationById(String restaurantUuid, String variationUuid) {
        log.info("Fetching variation: {}", variationUuid);

        ProductVariation variation = variationRepo.findByVariationUuidAndIsDeletedFalse(variationUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Variation not found with UUID: " + variationUuid));

        // Validate variation belongs to restaurant
        if (!variation.getProduct().getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new BusinessException("Variation does not belong to this restaurant");
        }

        return variationMapper.toResponseDto(variation);
    }

    @Transactional
    public ProductVariationResponseDto updateVariation(String restaurantUuid, String variationUuid,
                                                       UpdateVariationRequest dto) {
        log.info("Updating variation: {}", variationUuid);

        // Find variation
        ProductVariation variation = variationRepo.findByVariationUuidAndIsDeletedFalse(variationUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Variation not found with UUID: " + variationUuid));

        // Validate variation belongs to restaurant
        if (!variation.getProduct().getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new BusinessException("Variation does not belong to this restaurant");
        }

        // Validate SKU uniqueness if changed
        if (dto.getSku() != null && !dto.getSku().isEmpty() &&
            !dto.getSku().equals(variation.getSku()) &&
            variationRepo.existsBySkuAndVariationUuidNot(dto.getSku(), variationUuid)) {
            throw new BusinessException("Variation with SKU '" + dto.getSku() + "' already exists");
        }

        // If this is set as default, unset any existing default
        if (Boolean.TRUE.equals(dto.getIsDefault()) && !variation.getIsDefault()) {
            unsetExistingDefaultVariation(variation.getProduct().getProductUuid());
        }

        // Update variation fields
        variationMapper.updateEntity(dto, variation);

        ProductVariation updatedVariation = variationRepo.save(variation);
        log.info("Updated variation: {}", variationUuid);

        return variationMapper.toResponseDto(updatedVariation);
    }

    @Transactional
    public void deleteVariation(String restaurantUuid, String variationUuid) {
        log.info("Deleting variation: {}", variationUuid);

        ProductVariation variation = variationRepo.findByVariationUuidAndIsDeletedFalse(variationUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Variation not found with UUID: " + variationUuid));

        // Validate variation belongs to restaurant
        if (!variation.getProduct().getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new BusinessException("Variation does not belong to this restaurant");
        }

        // Check if this is the last variation
        long count = variationRepo.countByProductUuid(variation.getProduct().getProductUuid());
        if (count == 1) {
            // Update product hasVariations flag
            Product product = variation.getProduct();
            product.setHasVariations(false);
            productRepo.save(product);
        }

        // If this was the default, set another as default
        if (Boolean.TRUE.equals(variation.getIsDefault())) {
            List<ProductVariation> otherVariations = variationRepo
                    .findByProduct_ProductUuidAndIsActiveTrueAndIsDeletedFalseOrderBySortOrderAsc(
                            variation.getProduct().getProductUuid());

            otherVariations.stream()
                    .filter(v -> !v.getVariationUuid().equals(variationUuid))
                    .findFirst()
                    .ifPresent(v -> {
                        v.setIsDefault(true);
                        variationRepo.save(v);
                    });
        }

        // Soft delete
        variationRepo.delete(variation);
        log.info("Deleted variation: {}", variationUuid);
    }

    @Transactional
    public void toggleVariationStatus(String restaurantUuid, String variationUuid, boolean isActive) {
        log.info("Toggling variation status: {} to {}", variationUuid, isActive);

        ProductVariation variation = variationRepo.findByVariationUuidAndIsDeletedFalse(variationUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Variation not found with UUID: " + variationUuid));

        // Validate variation belongs to restaurant
        if (!variation.getProduct().getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new BusinessException("Variation does not belong to this restaurant");
        }

        variation.setIsActive(isActive);
        variationRepo.save(variation);
        log.info("Toggled variation status: {} to {}", variationUuid, isActive);
    }

    @Transactional
    public ProductVariationResponseDto setDefaultVariation(String restaurantUuid, String productUuid, String variationUuid) {
        log.info("Setting variation {} as default for product: {}", variationUuid, productUuid);

        // Validate variation
        ProductVariation variation = variationRepo.findByVariationUuidAndIsDeletedFalse(variationUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Variation not found with UUID: " + variationUuid));

        // Validate variation belongs to restaurant
        if (!variation.getProduct().getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new BusinessException("Variation does not belong to this restaurant");
        }

        // Validate variation belongs to the specified product
        if (!variation.getProduct().getProductUuid().equals(productUuid)) {
            throw new BusinessException("Variation does not belong to this product");
        }

        // If already default, nothing to do
        if (Boolean.TRUE.equals(variation.getIsDefault())) {
            log.info("Variation {} is already the default", variationUuid);
            return variationMapper.toResponseDto(variation);
        }

        // Unset any existing default variation
        unsetExistingDefaultVariation(productUuid);

        // Set this variation as default
        variation.setIsDefault(true);
        ProductVariation savedVariation = variationRepo.save(variation);

        log.info("Set variation {} as default for product: {}", variationUuid, productUuid);
        return variationMapper.toResponseDto(savedVariation);
    }

    /**
     * Helper method to unset existing default variation for a product
     */
    private void unsetExistingDefaultVariation(String productUuid) {
        variationRepo.findDefaultVariation(productUuid)
                .ifPresent(existingDefault -> {
                    existingDefault.setIsDefault(false);
                    variationRepo.save(existingDefault);
                    log.debug("Unset existing default variation: {}", existingDefault.getVariationUuid());
                });
    }
}
