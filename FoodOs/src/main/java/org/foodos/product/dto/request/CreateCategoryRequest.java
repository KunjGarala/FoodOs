package org.foodos.product.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateCategoryRequest {

    @NotBlank(message = "Category name is required")
    @Size(max = 100, message = "Category name must not exceed 100 characters")
    private String name;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;

    private String parentCategoryUuid;

    @Min(value = 0, message = "Sort order must be non-negative")
    private Integer sortOrder;

    @Size(max = 500, message = "Image URL must not exceed 500 characters")
    private String imageUrl;

    @Size(max = 50, message = "Icon name must not exceed 50 characters")
    private String iconName;

    @Size(max = 7, message = "Color code must not exceed 7 characters")
    @Pattern(regexp = "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$", message = "Color must be a valid hex code like #RRGGBB or #RGB")
    private String colorCode;

    private Boolean isActive;
    private Boolean isVisibleInMenu;
    private Boolean availableForDineIn;
}