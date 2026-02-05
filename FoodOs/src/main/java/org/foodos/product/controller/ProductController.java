package org.foodos.product.controller;


import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.product.dto.request.CreateProductRequest;
import org.foodos.product.dto.request.UpdateProductRequest;
import org.foodos.product.dto.response.ProductResponseDto;
import org.foodos.product.service.ProductService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/restaurants/{restaurantUuid}/products")
@RequiredArgsConstructor
@Tag(name = "Product APIs", description = "APIs for managing restaurant products/menu items")
public class ProductController {

    private final ProductService productService;

    @Operation(
            summary = "Create a new product",
            description = "Create a new product/menu item for a restaurant with optional image upload"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Product created successfully"),
            @ApiResponse(responseCode = "404", description = "Restaurant or category not found"),
            @ApiResponse(responseCode = "400", description = "Invalid request data or SKU already exists"),
            @ApiResponse(responseCode = "403", description = "Access denied")
    })
    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProductResponseDto> createProduct(
            @Parameter(description = "Restaurant UUID", required = true)
            @PathVariable String restaurantUuid,

            @Valid @RequestPart("product") CreateProductRequest request,

            @RequestPart(value = "image", required = false) MultipartFile image,

            @Parameter(hidden = true) @AuthenticationPrincipal UserAuthEntity currentUser
    ) {
        ProductResponseDto product = productService.createProduct(restaurantUuid, request, image);
        return ResponseEntity.status(HttpStatus.CREATED).body(product);
    }

    @Operation(
            summary = "Get all products",
            description = "Retrieve all products for a restaurant. Can optionally include inactive products."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Products retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Restaurant not found")
    })
    @GetMapping
    public ResponseEntity<List<ProductResponseDto>> getAllProducts(
            @Parameter(description = "Restaurant UUID", required = true)
            @PathVariable String restaurantUuid,

            @Parameter(description = "Include inactive products")
            @RequestParam(value = "includeInactive", defaultValue = "false") boolean includeInactive
    ) {
        List<ProductResponseDto> products = productService.getAllProducts(restaurantUuid, includeInactive);
        return ResponseEntity.ok(products);
    }

    @Operation(
            summary = "Get products by category",
            description = "Retrieve all active products for a specific category"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Products retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Restaurant or category not found"),
            @ApiResponse(responseCode = "400", description = "Category does not belong to this restaurant")
    })
    @GetMapping("/category/{categoryUuid}")
    public ResponseEntity<List<ProductResponseDto>> getProductsByCategory(
            @Parameter(description = "Restaurant UUID", required = true)
            @PathVariable String restaurantUuid,

            @Parameter(description = "Category UUID", required = true)
            @PathVariable String categoryUuid
    ) {
        List<ProductResponseDto> products = productService.getProductsByCategory(restaurantUuid, categoryUuid);
        return ResponseEntity.ok(products);
    }

    @Operation(
            summary = "Get featured products",
            description = "Retrieve all featured products for a restaurant"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Featured products retrieved successfully")
    })
    @GetMapping("/featured")
    public ResponseEntity<List<ProductResponseDto>> getFeaturedProducts(
            @Parameter(description = "Restaurant UUID", required = true)
            @PathVariable String restaurantUuid
    ) {
        List<ProductResponseDto> products = productService.getFeaturedProducts(restaurantUuid);
        return ResponseEntity.ok(products);
    }

    @Operation(
            summary = "Get bestseller products",
            description = "Retrieve all bestseller products for a restaurant, sorted by sold count"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Bestseller products retrieved successfully")
    })
    @GetMapping("/bestsellers")
    public ResponseEntity<List<ProductResponseDto>> getBestsellerProducts(
            @Parameter(description = "Restaurant UUID", required = true)
            @PathVariable String restaurantUuid
    ) {
        List<ProductResponseDto> products = productService.getBestsellerProducts(restaurantUuid);
        return ResponseEntity.ok(products);
    }

    @Operation(
            summary = "Search products",
            description = "Search for products by name"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Search results retrieved successfully")
    })
    @GetMapping("/search")
    public ResponseEntity<List<ProductResponseDto>> searchProducts(
            @Parameter(description = "Restaurant UUID", required = true)
            @PathVariable String restaurantUuid,

            @Parameter(description = "Search term", required = true)
            @RequestParam(value = "q") String searchTerm
    ) {
        List<ProductResponseDto> products = productService.searchProducts(restaurantUuid, searchTerm);
        return ResponseEntity.ok(products);
    }

    @Operation(
            summary = "Get product by UUID",
            description = "Retrieve a specific product by its UUID"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Product retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Product not found"),
            @ApiResponse(responseCode = "400", description = "Product does not belong to this restaurant")
    })
    @GetMapping("/{productUuid}")
    public ResponseEntity<ProductResponseDto> getProductById(
            @Parameter(description = "Restaurant UUID", required = true)
            @PathVariable String restaurantUuid,

            @Parameter(description = "Product UUID", required = true)
            @PathVariable String productUuid
    ) {
        ProductResponseDto product = productService.getProductById(restaurantUuid, productUuid);
        return ResponseEntity.ok(product);
    }

    @Operation(
            summary = "Update a product",
            description = "Update an existing product. All fields are optional - only provided fields will be updated."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Product updated successfully"),
            @ApiResponse(responseCode = "404", description = "Product not found"),
            @ApiResponse(responseCode = "400", description = "Invalid request data or product does not belong to this restaurant"),
            @ApiResponse(responseCode = "403", description = "Access denied")
    })
    @PutMapping(value = "/{productUuid}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProductResponseDto> updateProduct(
            @Parameter(description = "Restaurant UUID", required = true)
            @PathVariable String restaurantUuid,

            @Parameter(description = "Product UUID", required = true)
            @PathVariable String productUuid,

            @Valid @RequestPart("product") UpdateProductRequest request,

            @RequestPart(value = "image", required = false) MultipartFile image,

            @Parameter(hidden = true) @AuthenticationPrincipal UserAuthEntity currentUser
    ) {
        ProductResponseDto product = productService.updateProduct(restaurantUuid, productUuid, request, image);
        return ResponseEntity.ok(product);
    }

    @Operation(
            summary = "Delete a product",
            description = "Soft delete a product. The product data is preserved in the database."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Product deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Product not found"),
            @ApiResponse(responseCode = "400", description = "Product does not belong to this restaurant"),
            @ApiResponse(responseCode = "403", description = "Access denied")
    })
    @DeleteMapping("/{productUuid}")
    public ResponseEntity<Void> deleteProduct(
            @Parameter(description = "Restaurant UUID", required = true)
            @PathVariable String restaurantUuid,

            @Parameter(description = "Product UUID", required = true)
            @PathVariable String productUuid,

            @Parameter(hidden = true) @AuthenticationPrincipal UserAuthEntity currentUser
    ) {
        productService.deleteProduct(restaurantUuid, productUuid);
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Toggle product status",
            description = "Enable or disable a product"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Product status updated successfully"),
            @ApiResponse(responseCode = "404", description = "Product not found"),
            @ApiResponse(responseCode = "400", description = "Product does not belong to this restaurant"),
            @ApiResponse(responseCode = "403", description = "Access denied")
    })
    @PatchMapping("/{productUuid}/status")
    public ResponseEntity<Void> toggleProductStatus(
            @Parameter(description = "Restaurant UUID", required = true)
            @PathVariable String restaurantUuid,

            @Parameter(description = "Product UUID", required = true)
            @PathVariable String productUuid,

            @Parameter(description = "Product active status", required = true)
            @RequestParam(value = "isActive") boolean isActive,

            @Parameter(hidden = true) @AuthenticationPrincipal UserAuthEntity currentUser
    ) {
        productService.toggleProductStatus(restaurantUuid, productUuid, isActive);
        return ResponseEntity.noContent().build();
    }

    // Stock management endpoint - commented out for now as stock fields are not needed
//    @Operation(
//            summary = "Update product stock",
//            description = "Update the current stock quantity for a product (only for products with inventory tracking enabled)"
//    )
//    @ApiResponses({
//            @ApiResponse(responseCode = "204", description = "Product stock updated successfully"),
//            @ApiResponse(responseCode = "404", description = "Product not found"),
//            @ApiResponse(responseCode = "400", description = "Product does not track inventory or invalid quantity"),
//            @ApiResponse(responseCode = "403", description = "Access denied")
//    })
//    @PatchMapping("/{productUuid}/stock")
//    public ResponseEntity<Void> updateProductStock(
//            @Parameter(description = "Restaurant UUID", required = true)
//            @PathVariable String restaurantUuid,
//
//            @Parameter(description = "Product UUID", required = true)
//            @PathVariable String productUuid,
//
//            @Parameter(description = "Stock quantity", required = true)
//            @RequestParam(value = "quantity") BigDecimal quantity,
//
//            @Parameter(hidden = true) @AuthenticationPrincipal UserAuthEntity currentUser
//    ) {
//        productService.updateProductStock(restaurantUuid, productUuid, quantity);
//        return ResponseEntity.noContent().build();
//    }
}


