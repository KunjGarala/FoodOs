package org.foodos.order.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Request DTO for order item
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Order item details")
public class OrderItemRequest {

    @NotNull(message = "Product UUID is required")
    @Schema(description = "Product UUID", example = "550e8400-e29b-41d4-a716-446655440003", required = true)
    private String productUuid;

    @Schema(description = "Product variation UUID", example = "550e8400-e29b-41d4-a716-446655440004")
    private String variationUuid;

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.001", message = "Quantity must be greater than 0")
    @Schema(description = "Quantity", example = "2.0", required = true)
    private BigDecimal quantity;

    @Schema(description = "Unit price (optional, will use product price if not provided)", example = "150.00")
    @DecimalMin(value = "0.00", message = "Unit price cannot be negative")
    private BigDecimal unitPrice;

    @Schema(description = "Item-level discount percentage", example = "5.00")
    @DecimalMin(value = "0.00", message = "Discount percentage cannot be negative")
    @DecimalMax(value = "100.00", message = "Discount percentage cannot exceed 100")
    private BigDecimal discountPercentage;

    @Schema(description = "Item-level discount amount", example = "10.00")
    @DecimalMin(value = "0.00", message = "Discount amount cannot be negative")
    private BigDecimal discountAmount;

    @Valid
    @Schema(description = "List of modifiers for this item")
    @Builder.Default
    private List<OrderItemModifierRequest> modifiers = new ArrayList<>();

    @Schema(description = "Special instructions for this item", example = "Extra spicy")
    @Size(max = 500, message = "Item notes cannot exceed 500 characters")
    private String itemNotes;

    @Schema(description = "Is this a complimentary item", example = "false")
    @Builder.Default
    private Boolean isComplimentary = false;

    @Schema(description = "Is this a half portion", example = "false")
    @Builder.Default
    private Boolean isHalfPortion = false;
}

