package org.foodos.order.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.math.BigDecimal;

/**
 * Response DTO for Order Item Modifier
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Order item modifier response")
public class OrderItemModifierResponse {

    @Schema(description = "Modifier UUID", example = "550e8400-e29b-41d4-a716-446655440000")
    private String orderItemModifierUuid;

    @Schema(description = "Modifier UUID", example = "550e8400-e29b-41d4-a716-446655440005")
    private String modifierUuid;

    @Schema(description = "Modifier name", example = "Extra Cheese")
    private String modifierName;

    @Schema(description = "Modifier group name", example = "Add-ons")
    private String modifierGroupName;

    @Schema(description = "Quantity", example = "1.0")
    private BigDecimal quantity;

    @Schema(description = "Unit price", example = "30.00")
    private BigDecimal unitPrice;

    @Schema(description = "Line total", example = "30.00")
    private BigDecimal lineTotal;
}

