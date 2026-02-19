package org.foodos.order.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import org.foodos.order.entity.enums.KotStatus;
import org.foodos.order.entity.enums.SpicyLevel;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Response DTO for Order Item
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Order item response")
public class OrderItemResponse {

    @Schema(description = "Order item UUID", example = "550e8400-e29b-41d4-a716-446655440000")
    private String orderItemUuid;

    @Schema(description = "Product UUID", example = "550e8400-e29b-41d4-a716-446655440003")
    private String productUuid;

    @Schema(description = "Product name", example = "Margherita Pizza")
    private String productName;

    @Schema(description = "Variation name", example = "Large")
    private String variationName;

    @Schema(description = "SKU", example = "PIZZA-MARG-L")
    private String sku;

    @Schema(description = "Quantity", example = "2.0")
    private BigDecimal quantity;

    @Schema(description = "Unit price", example = "350.00")
    private BigDecimal unitPrice;

    @Schema(description = "Discount amount", example = "20.00")
    private BigDecimal discountAmount;

    @Schema(description = "Tax amount", example = "33.00")
    private BigDecimal taxAmount;

    @Schema(description = "Line total", example = "693.00")
    private BigDecimal lineTotal;

    @Schema(description = "Modifiers applied")
    @Builder.Default
    private List<OrderItemModifierResponse> modifiers = new ArrayList<>();

    @Schema(description = "Modifiers text", example = "Extra Cheese, No Onions")
    private String modifiersText;

    @Schema(description = "Item notes")
    private String itemNotes;

    @Schema(description = "Special instructions")
    private String specialInstructions;

    @Schema(description = "Spicy level", example = "MEDIUM")
    private SpicyLevel spicyLevel;

    @Schema(description = "Kitchen notes")
    private String kitchenNotes;

    @Schema(description = "Order notes")
    private String orderNotes;

    @Schema(description = "KOT status", example = "COOKING")
    private KotStatus kotStatus;

    @Schema(description = "Is cancelled", example = "false")
    private Boolean isCancelled;

    @Schema(description = "Is complimentary", example = "false")
    private Boolean isComplimentary;

    @Schema(description = "Is half portion", example = "false")
    private Boolean isHalfPortion;

    @Schema(description = "Cancellation reason")
    private String cancellationReason;

    @Schema(description = "Cancelled at")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime cancelledAt;

    @Schema(description = "KOT printed at")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime kotPrintedAt;

    @Schema(description = "Ready at")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime readyAt;

    @Schema(description = "Served at")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime servedAt;

    @Schema(description = "Created at")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
}

