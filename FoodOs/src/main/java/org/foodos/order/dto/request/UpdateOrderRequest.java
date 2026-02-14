package org.foodos.order.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Request DTO for updating an order
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to update an existing order")
public class UpdateOrderRequest {

    @Schema(description = "Waiter UUID", example = "550e8400-e29b-41d4-a716-446655440002")
    private String waiterUuid;

    @Schema(description = "Number of guests", example = "5")
    @Min(value = 1, message = "Number of guests must be at least 1")
    private Integer numberOfGuests;

    @Schema(description = "Customer name", example = "Jane Smith")
    @Size(max = 100, message = "Customer name cannot exceed 100 characters")
    private String customerName;

    @Schema(description = "Customer phone", example = "+919876543210")
    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Invalid phone number format")
    private String customerPhone;

    @Schema(description = "Customer email", example = "jane@example.com")
    @Email(message = "Invalid email format")
    private String customerEmail;

    @Schema(description = "Delivery address")
    private String deliveryAddress;

    @Valid
    @Schema(description = "Items to add to the order")
    @Builder.Default
    private List<OrderItemRequest> itemsToAdd = new ArrayList<>();

    @Schema(description = "Order item UUIDs to remove")
    @Builder.Default
    private List<String> itemUuidsToRemove = new ArrayList<>();

    @Schema(description = "Discount percentage", example = "15.00")
    @DecimalMin(value = "0.00", message = "Discount percentage cannot be negative")
    @DecimalMax(value = "100.00", message = "Discount percentage cannot exceed 100")
    private BigDecimal discountPercentage;

    @Schema(description = "Discount amount", example = "75.00")
    @DecimalMin(value = "0.00", message = "Discount amount cannot be negative")
    private BigDecimal discountAmount;

    @Schema(description = "Reason for discount")
    private String discountReason;

    @Schema(description = "Tip amount", example = "50.00")
    @DecimalMin(value = "0.00", message = "Tip amount cannot be negative")
    private BigDecimal tipAmount;

    @Schema(description = "Order notes")
    @Size(max = 1000, message = "Order notes cannot exceed 1000 characters")
    private String orderNotes;

    @Schema(description = "Kitchen notes")
    @Size(max = 1000, message = "Kitchen notes cannot exceed 1000 characters")
    private String kitchenNotes;
}

