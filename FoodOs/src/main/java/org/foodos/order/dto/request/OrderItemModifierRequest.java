package org.foodos.order.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Request DTO for order item modifier
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Modifier details for an order item")
public class OrderItemModifierRequest {

    @NotNull(message = "Modifier UUID is required")
    @Schema(description = "Modifier UUID", example = "550e8400-e29b-41d4-a716-446655440005", required = true)
    private String modifierUuid;

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.001", message = "Quantity must be greater than 0")
    @Schema(description = "Quantity", example = "1.0", required = true)
    @Builder.Default
    private BigDecimal quantity = BigDecimal.ONE;
}

