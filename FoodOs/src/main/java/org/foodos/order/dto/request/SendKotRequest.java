package org.foodos.order.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.*;

import java.util.List;

/**
 * Request DTO for sending Kitchen Order Ticket
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to send KOT to kitchen")
public class SendKotRequest {

    @NotEmpty(message = "Order item IDs are required")
    @Schema(description = "List of order item UUIDs to include in KOT", required = true)
    private List<String> orderItemUuids;

    @Schema(description = "Printer target/station", example = "KITCHEN_MAIN")
    private String printerTarget;

    @Schema(description = "Kitchen station", example = "HOT_KITCHEN")
    private String kitchenStation;

    @Schema(description = "Special instructions for kitchen")
    @Size(max = 500, message = "Special instructions cannot exceed 500 characters")
    private String specialInstructions;

    @Schema(description = "Mark as urgent", example = "false")
    @Builder.Default
    private Boolean isUrgent = false;

    @Schema(description = "Priority (higher = more urgent)", example = "0")
    @Min(value = 0, message = "Priority cannot be negative")
    @Builder.Default
    private Integer priority = 0;
}

