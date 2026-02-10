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

    @NotNull(message = "Modifier ID is required")
    @Schema(description = "Modifier ID", example = "8", required = true)
    private Long modifierId;

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.001", message = "Quantity must be greater than 0")
    @Schema(description = "Quantity", example = "1.0", required = true)
    @Builder.Default
    private BigDecimal quantity = BigDecimal.ONE;
}

