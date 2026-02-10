package org.foodos.product.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class BulkCreateModifiersRequest {

    @NotEmpty(message = "At least one modifier is required")
    @Valid
    private List<CreateModifierRequest> modifiers;
}
