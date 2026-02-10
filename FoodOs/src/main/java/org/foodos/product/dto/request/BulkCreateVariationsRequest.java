package org.foodos.product.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class BulkCreateVariationsRequest {

    @NotEmpty(message = "At least one variation is required")
    @Valid
    private List<CreateVariationRequest> variations;
}
