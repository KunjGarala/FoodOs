package org.foodos.product.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.product.dto.request.CreateCategoryRequest;
import org.foodos.product.dto.request.UpdateCategoryRequest;
import org.foodos.product.dto.response.CategoryResponseDto;
import org.foodos.product.service.CategoryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/restaurants/{restaurantUuid}/categories")
@RequiredArgsConstructor
@Tag(name = "Category APIs", description = "APIs for managing product categories")
public class CategoryController {

    private final CategoryService categoryService;

    @Operation(
            summary = "Create a new category",
            description = "Create a new product category for a restaurant. Can optionally set a parent category for hierarchical structure."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Category created successfully"),
            @ApiResponse(responseCode = "404", description = "Restaurant or parent category not found"),
            @ApiResponse(responseCode = "400", description = "Invalid request data or parent category belongs to another restaurant"),
            @ApiResponse(responseCode = "403", description = "Access denied")
    })
    @PostMapping("/create")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication , 'MANAGER')")
    public ResponseEntity<CategoryResponseDto> createCategory(
            @Parameter(description = "Restaurant ID", required = true)
            @PathVariable String restaurantUuid,

            @Valid @RequestBody CreateCategoryRequest request,

            @Parameter(hidden = true) @AuthenticationPrincipal UserAuthEntity currentUser
    ) {
        CategoryResponseDto category = categoryService.createCategory(restaurantUuid, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(category);
    }

    @Operation(summary = "Get all categories", description = "Retrieve a list of all categories")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Categories retrieved successfully"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'GUEST')")
    public ResponseEntity<List<CategoryResponseDto>> getAllCategories(
            @Parameter(description = "Restaurant ID", required = true)
            @PathVariable String restaurantUuid
    ) {
        List<CategoryResponseDto> categories = categoryService.getAllCategories(restaurantUuid);
        return ResponseEntity.ok(categories);
    }

    @Operation(summary = "Get category by UUID", description = "Retrieve a specific category by its UUID")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Category retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Category not found"),
        @ApiResponse(responseCode = "400", description = "Category does not belong to this restaurant")
    })
    @GetMapping("/{categoryUuid}")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'GUEST')")
    public ResponseEntity<CategoryResponseDto> getCategoryById(
            @Parameter(description = "Restaurant ID", required = true)
            @PathVariable String restaurantUuid,

            @Parameter(description = "Category UUID", required = true)
            @PathVariable String categoryUuid
    ) {
        CategoryResponseDto category = categoryService.getCategoryById(restaurantUuid, categoryUuid);
        return ResponseEntity.ok(category);
    }

    @Operation(
            summary = "Update a category",
            description = "Update an existing category. All fields are optional - only provided fields will be updated."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Category updated successfully"),
            @ApiResponse(responseCode = "404", description = "Category not found"),
            @ApiResponse(responseCode = "400", description = "Invalid request data or category does not belong to this restaurant"),
            @ApiResponse(responseCode = "403", description = "Access denied")
    })
    @PutMapping("/{categoryUuid}")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
    public ResponseEntity<CategoryResponseDto> updateCategory(
            @Parameter(description = "Restaurant ID", required = true)
            @PathVariable String restaurantUuid,

            @Parameter(description = "Category UUID", required = true)
            @PathVariable String categoryUuid,

            @Valid @RequestBody UpdateCategoryRequest request,

            @Parameter(hidden = true) @AuthenticationPrincipal UserAuthEntity currentUser
    ) {
        CategoryResponseDto category = categoryService.updateCategory(restaurantUuid, categoryUuid, request);
        return ResponseEntity.ok(category);
    }

    @Operation(
            summary = "Delete a category",
            description = "Soft delete a category by setting it as inactive. The category and its data are preserved in the database."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Category deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Category not found"),
            @ApiResponse(responseCode = "400", description = "Category does not belong to this restaurant"),
            @ApiResponse(responseCode = "403", description = "Access denied")
    })
    @DeleteMapping("/{categoryUuid}")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
    public ResponseEntity<Void> deleteCategory(
            @Parameter(description = "Restaurant ID", required = true)
            @PathVariable String restaurantUuid,

            @Parameter(description = "Category UUID", required = true)
            @PathVariable String categoryUuid,

            @Parameter(hidden = true) @AuthenticationPrincipal UserAuthEntity currentUser
    ) {
        categoryService.deleteCategory(restaurantUuid, categoryUuid);
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Toggle category active status",
            description = "Toggle the active status of a category. This will enable or disable the category."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Category active status toggled successfully"),
            @ApiResponse(responseCode = "404", description = "Restaurant or category not found"),
            @ApiResponse(responseCode = "400", description = "Category does not belong to this restaurant"),
            @ApiResponse(responseCode = "403", description = "Access denied")
    })
    @PatchMapping("/{categoryUuid}/toggle-active")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
    public ResponseEntity<Void> toggleActiveStatus(
            @Parameter(description = "Restaurant UUID", required = true)
            @PathVariable String restaurantUuid,

            @Parameter(description = "Category UUID", required = true)
            @PathVariable String categoryUuid,

            @Parameter(hidden = true) @AuthenticationPrincipal UserAuthEntity currentUser
    ) {
        categoryService.toggleActiveStatus(restaurantUuid, categoryUuid);
        return ResponseEntity.ok().build();
    }
}



