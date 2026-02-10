package org.foodos.product.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;
import org.foodos.product.entity.enums.SelectionType;

import java.util.List;

@Data
public class CreateModifierGroupRequest {

    @NotBlank(message = "Modifier group name is required")
    @Size(max = 100, message = "Modifier group name must not exceed 100 characters")
    private String name;

    @NotNull(message = "Selection type is required")
    private SelectionType selectionType = SelectionType.SINGLE;

    @Min(value = 0, message = "Minimum selection must be at least 0")
    private Integer minSelection = 0;

    @Min(value = 1, message = "Maximum selection must be at least 1")
    private Integer maxSelection = 1;

    private Boolean isRequired = false;

    private Boolean isActive = true;

    private Integer sortOrder = 0;

    @Valid
    private List<CreateModifierRequest> modifiers;
}
