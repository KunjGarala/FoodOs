package org.foodos.product.service;


import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.common.exceptionhandling.exception.BusinessException;
import org.foodos.common.exceptionhandling.exception.ResourceNotFoundException;
import org.foodos.common.utils.S3Service;
import org.foodos.product.dto.request.CreateProductRequest;
import org.foodos.product.dto.request.UpdateProductRequest;
import org.foodos.product.dto.response.ProductResponseDto;
import org.foodos.product.dto.response.ModifierGroupResponseDto;
import org.foodos.product.entity.Category;
import org.foodos.product.entity.Product;
import org.foodos.product.entity.ModifierGroup;
import org.foodos.product.mapper.ProductMapper;
import org.foodos.product.mapper.ModifierGroupMapper;
import org.foodos.product.repository.CategoryRepo;
import org.foodos.product.repository.ProductRepo;
import org.foodos.product.repository.ModifierGroupRepo;
import org.foodos.restaurant.entity.Restaurant;
import org.foodos.restaurant.repository.RestaurantRepo;
import org.hibernate.Filter;
import org.springframework.web.multipart.MultipartFile;
import org.hibernate.Session;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepo productRepo;
    private final CategoryRepo categoryRepo;
    private final RestaurantRepo restaurantRepo;
    private final ModifierGroupRepo modifierGroupRepo;
    private final ProductMapper productMapper;
    private final ModifierGroupMapper modifierGroupMapper;
    private final EntityManager entityManager;

    @Transactional
    public ProductResponseDto createProduct(String restaurantUuid, CreateProductRequest dto, MultipartFile image) {
        log.info("Creating product for restaurant: {}", restaurantUuid);

        // Validate restaurant
        Restaurant restaurant = restaurantRepo.findByRestaurantUuidAndIsDeletedFalse(restaurantUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with UUID: " + restaurantUuid));

        // Validate category
        Category category = categoryRepo.findByCategoryUuidAndIsDeletedFalse(dto.getCategoryUuid())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with UUID: " + dto.getCategoryUuid()));

        // Validate category belongs to restaurant
        if (!category.getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new BusinessException("Category does not belong to this restaurant");
        }

        // Validate SKU uniqueness if provided
        if (dto.getSku() != null && !dto.getSku().isEmpty() && productRepo.existsBySku(dto.getSku())) {
            throw new BusinessException("Product with SKU '" + dto.getSku() + "' already exists");
        }

        // Map DTO to entity
        Product product = productMapper.toEntity(dto);
        product.setRestaurant(restaurant);
        product.setCategory(category);

//         Upload image if provided
//        if (image != null && !image.isEmpty()) {
//            String imageUrl = s3Service.uploadImage(image, "products");
//            product.setImageUrl(imageUrl);
//        }

        // Save product
        Product savedProduct = productRepo.save(product);
        log.info("Created product with UUID: {} for restaurant: {}", savedProduct.getProductUuid(), restaurantUuid);

        return productMapper.toResponseDto(savedProduct);
    }

    @Transactional(readOnly = true)
    public List<ProductResponseDto> getAllProducts(String restaurantUuid, boolean includeInactive) {
        log.info("Fetching all products for restaurant: {}, includeInactive: {}", restaurantUuid, includeInactive);

        // Enable filter to show only non-deleted products
        Session session = entityManager.unwrap(Session.class);
        Filter filter = session.enableFilter("deletedFilter");
        filter.setParameter("isDeleted", false);

        List<Product> products;
        if (includeInactive) {
            products = productRepo.findByRestaurant_RestaurantUuidAndIsDeletedFalseOrderBySortOrderAsc(restaurantUuid);
        } else {
            products = productRepo.findByRestaurant_RestaurantUuidAndIsActiveTrueAndIsDeletedFalseOrderBySortOrderAsc(restaurantUuid);
        }

        return products.stream()
                .map(productMapper::toResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductResponseDto> getProductsByCategory(String restaurantUuid, String categoryUuid) {
        log.info("Fetching products for restaurant: {}, category: {}", restaurantUuid, categoryUuid);

        // Validate category exists and belongs to restaurant
        Category category = categoryRepo.findByCategoryUuidAndIsDeletedFalse(categoryUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with UUID: " + categoryUuid));

        if (!category.getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new BusinessException("Category does not belong to this restaurant");
        }

        List<Product> products = productRepo
                .findByRestaurant_RestaurantUuidAndCategory_CategoryUuidAndIsActiveTrueAndIsDeletedFalseOrderBySortOrderAsc(
                        restaurantUuid, categoryUuid);

        return products.stream()
                .map(productMapper::toResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductResponseDto> getFeaturedProducts(String restaurantUuid) {
        log.info("Fetching featured products for restaurant: {}", restaurantUuid);

        List<Product> products = productRepo
                .findByRestaurant_RestaurantUuidAndIsFeaturedTrueAndIsActiveTrueAndIsDeletedFalseOrderBySortOrderAsc(restaurantUuid);

        return products.stream()
                .map(productMapper::toResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductResponseDto> getBestsellerProducts(String restaurantUuid) {
        log.info("Fetching bestseller products for restaurant: {}", restaurantUuid);

        List<Product> products = productRepo
                .findByRestaurant_RestaurantUuidAndIsBestsellerTrueAndIsActiveTrueAndIsDeletedFalseOrderBySoldCountDesc(restaurantUuid);

        return products.stream()
                .map(productMapper::toResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductResponseDto> searchProducts(String restaurantUuid, String searchTerm) {
        log.info("Searching products for restaurant: {}, searchTerm: {}", restaurantUuid, searchTerm);

        List<Product> products = productRepo.searchProducts(restaurantUuid, searchTerm);

        return products.stream()
                .map(productMapper::toResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductResponseDto getProductById(String restaurantUuid, String productUuid) {
        log.info("Fetching product: {} for restaurant: {}", productUuid, restaurantUuid);

        Product product = productRepo.findByProductUuidAndIsDeletedFalse(productUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with UUID: " + productUuid));

        // Validate product belongs to restaurant
        if (!product.getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new BusinessException("Product does not belong to this restaurant");
        }

        return productMapper.toResponseDto(product);
    }

    @Transactional
    public ProductResponseDto updateProduct(String restaurantUuid, String productUuid,
                                           UpdateProductRequest dto, MultipartFile image) {
        log.info("Updating product: {} for restaurant: {}", productUuid, restaurantUuid);

        // Find product
        Product product = productRepo.findByProductUuidAndIsDeletedFalse(productUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with UUID: " + productUuid));

        // Validate product belongs to restaurant
        if (!product.getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new BusinessException("Product does not belong to this restaurant");
        }

        // Update category if provided
        if (dto.getCategoryUuid() != null && !dto.getCategoryUuid().isEmpty()) {
            Category category = categoryRepo.findByCategoryUuidAndIsDeletedFalse(dto.getCategoryUuid())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with UUID: " + dto.getCategoryUuid()));

            if (!category.getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
                throw new BusinessException("Category does not belong to this restaurant");
            }

            product.setCategory(category);
        }

        // Validate SKU uniqueness if changed
        if (dto.getSku() != null && !dto.getSku().isEmpty() &&
            !dto.getSku().equals(product.getSku()) &&
            productRepo.existsBySkuAndProductUuidNot(dto.getSku(), productUuid)) {
            throw new BusinessException("Product with SKU '" + dto.getSku() + "' already exists");
        }

        // Update image if provided
//        if (image != null && !image.isEmpty()) {
//            // Delete old image if exists
//            if (product.getImageUrl() != null && !product.getImageUrl().isEmpty()) {
//                try {
//                    s3Service.deleteImage(product.getImageUrl());
//                } catch (Exception e) {
//                    log.warn("Failed to delete old product image: {}", e.getMessage());
//                }
//            }
//            // Upload new image
//            String imageUrl = s3Service.uploadImage(image, "products");
//            product.setImageUrl(imageUrl);
//        }

        // Update product fields
        productMapper.updateEntity(dto, product);

        // Note: hasVariations and hasModifiers are now set from the DTO by the mapper
        // They are user-controlled flags, not auto-calculated

        Product updatedProduct = productRepo.save(product);
        log.info("Updated product: {} for restaurant: {}", productUuid, restaurantUuid);

        return productMapper.toResponseDto(updatedProduct);
    }

    @Transactional
    public void deleteProduct(String restaurantUuid, String productUuid) {
        log.info("Deleting product: {} for restaurant: {}", productUuid, restaurantUuid);

        Product product = productRepo.findByProductUuidAndIsDeletedFalse(productUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with UUID: " + productUuid));

        // Validate product belongs to restaurant
        if (!product.getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new BusinessException("Product does not belong to this restaurant");
        }

        // Soft delete
        productRepo.delete(product);
        log.info("Soft deleted product: {} for restaurant: {}", productUuid, restaurantUuid);
    }

    @Transactional
    public void toggleProductStatus(String restaurantUuid, String productUuid) {

        Product product = productRepo.findByProductUuidAndIsDeletedFalse(productUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with UUID: " + productUuid));

        // Validate product belongs to restaurant
        if (!product.getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new BusinessException("Product does not belong to this restaurant");
        }

        product.setIsActive(!product.getIsActive());
        productRepo.save(product);
        log.info("Toggled product status: {} to {} for restaurant: {}", productUuid, product.getIsActive(), restaurantUuid);
    }


    @Transactional
    public void updateProductStock(String restaurantUuid, String productUuid, java.math.BigDecimal stockQuantity) {
        log.info("Updating product stock: {} to {} for restaurant: {}", productUuid, stockQuantity, restaurantUuid);

        Product product = productRepo.findByProductUuidAndIsDeletedFalse(productUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with UUID: " + productUuid));

        // Validate product belongs to restaurant
        if (!product.getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new BusinessException("Product does not belong to this restaurant");
        }

        if (!product.getTrackInventory()) {
            throw new BusinessException("Product does not track inventory");
        }

//        product.setCurrentStock(stockQuantity);
        productRepo.save(product);
        log.info("Updated product stock: {} to {} for restaurant: {}", productUuid, stockQuantity, restaurantUuid);
    }

    public void toggleFeaturedStatus(String restaurantUuid, String productUuid) {
        Restaurant restaurant = restaurantRepo.findByRestaurantUuidAndIsDeletedFalse(restaurantUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with UUID: " + restaurantUuid));

        Product product = productRepo.findByProductUuidAndIsDeletedFalse(productUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with UUID:" + productUuid));

        if (!product.getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new BusinessException("Product does not belong to this restaurant");
        }


        product.setIsFeatured(!product.getIsFeatured());
        productRepo.save(product);
        log.info("Toggled featured status for product: {} to {} for restaurant: {}", product
                .getProductUuid(), product.getIsFeatured(), restaurantUuid);

    }

    @Transactional
    public void assignModifierGroupToProduct(String restaurantUuid, String productUuid, String modifierGroupUuid) {
        log.info("Assigning modifier group: {} to product: {} for restaurant: {}",
                modifierGroupUuid, productUuid, restaurantUuid);

        // Validate and fetch product
        Product product = productRepo.findByProductUuidAndIsDeletedFalse(productUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with UUID: " + productUuid));

        if (!product.getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new BusinessException("Product does not belong to this restaurant");
        }

        // Validate and fetch modifier group
        ModifierGroup modifierGroup = modifierGroupRepo.findByModifierGroupUuidAndIsDeletedFalse(modifierGroupUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Modifier group not found with UUID: " + modifierGroupUuid));

        if (!modifierGroup.getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new BusinessException("Modifier group does not belong to this restaurant");
        }

        // Check if already assigned
        if (product.getModifierGroups().contains(modifierGroup)) {
            throw new BusinessException("Modifier group is already assigned to this product");
        }

        // Assign modifier group to product
        product.addModifierGroup(modifierGroup);
        productRepo.save(product);

        log.info("Successfully assigned modifier group: {} to product: {}", modifierGroupUuid, productUuid);
    }

    @Transactional
    public void removeModifierGroupFromProduct(String restaurantUuid, String productUuid, String modifierGroupUuid) {
        log.info("Removing modifier group: {} from product: {} for restaurant: {}",
                modifierGroupUuid, productUuid, restaurantUuid);

        // Validate and fetch product
        Product product = productRepo.findByProductUuidAndIsDeletedFalse(productUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with UUID: " + productUuid));

        if (!product.getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new BusinessException("Product does not belong to this restaurant");
        }

        // Validate and fetch modifier group
        ModifierGroup modifierGroup = modifierGroupRepo.findByModifierGroupUuidAndIsDeletedFalse(modifierGroupUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Modifier group not found with UUID: " + modifierGroupUuid));

        if (!modifierGroup.getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new BusinessException("Modifier group does not belong to this restaurant");
        }

        // Check if assigned
        if (!product.getModifierGroups().contains(modifierGroup)) {
            throw new BusinessException("Modifier group is not assigned to this product");
        }

        // Remove modifier group from product
        product.removeModifierGroup(modifierGroup);
        productRepo.save(product);

        log.info("Successfully removed modifier group: {} from product: {}", modifierGroupUuid, productUuid);
    }

    @Transactional(readOnly = true)
    public List<ModifierGroupResponseDto> getProductModifierGroups(String restaurantUuid, String productUuid) {
        log.info("Fetching modifier groups for product: {} in restaurant: {}", productUuid, restaurantUuid);

        // Validate and fetch product
        Product product = productRepo.findByProductUuidAndIsDeletedFalse(productUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with UUID: " + productUuid));

        if (!product.getRestaurant().getRestaurantUuid().equals(restaurantUuid)) {
            throw new BusinessException("Product does not belong to this restaurant");
        }

        // Return modifier groups associated with the product
        return product.getModifierGroups().stream()
                .filter(mg -> !mg.getIsDeleted() && mg.getIsActive())
                .map(modifierGroupMapper::toResponseDto)
                .collect(Collectors.toList());
    }
}
