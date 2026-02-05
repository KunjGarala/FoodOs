package org.foodos.product.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import org.foodos.product.entity.enums.SelectionType;

@Data
public class UpdateModifierGroupRequest {

    @Size(max = 100, message = "Modifier group name must not exceed 100 characters")
    private String name;

    private SelectionType selectionType;

    @Min(value = 0, message = "Minimum selection must be at least 0")
    private Integer minSelection;

    @Min(value = 1, message = "Maximum selection must be at least 1")
    private Integer maxSelection;

    private Boolean isRequired;

    private Boolean isActive;

    private Integer sortOrder;
}
