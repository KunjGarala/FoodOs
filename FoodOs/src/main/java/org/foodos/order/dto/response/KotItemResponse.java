package org.foodos.order.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import org.foodos.order.entity.enums.SpicyLevel;

import java.math.BigDecimal;

/**
 * Response DTO for KOT Item
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "KOT item response")
public class KotItemResponse {

    @Schema(description = "KOT item UUID", example = "550e8400-e29b-41d4-a716-446655440000")
    private String kotItemUuid;

    @Schema(description = "Product name", example = "Margherita Pizza")
    private String productName;

    @Schema(description = "Variation name", example = "Large")
    private String variationName;

    @Schema(description = "Quantity", example = "2.0")
    private BigDecimal quantity;

    @Schema(description = "Modifiers text", example = "Extra Cheese, No Onions")
    private String modifiersText;

    @Schema(description = "Notes")
    private String notes;

    @Schema(description = "Special instructions")
    private String specialInstructions;

    @Schema(description = "Spicy level", example = "MEDIUM")
    private SpicyLevel spicyLevel;

    @Schema(description = "Kitchen notes")
    private String kitchenNotes;

    @Schema(description = "Order notes")
    private String orderNotes;

    @Schema(description = "Is cancelled", example = "false")
    private Boolean isCancelled;

    @Schema(description = "Is ready", example = "false")
    private Boolean isReady;

    @Schema(description = "Is complimentary", example = "false")
    private Boolean isComplimentary;

    @Schema(description = "Is highlighted", example = "false")
    private Boolean isHighlighted;

    @Schema(description = "Sort order", example = "0")
    private Integer sortOrder;
}

