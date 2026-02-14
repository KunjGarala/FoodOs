package org.foodos.order.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;
import org.foodos.order.entity.enums.OrderType;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Request DTO for creating a new order
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to create a new order")
public class CreateOrderRequest {

    @NotNull(message = "Restaurant UUID is required")
    @Schema(description = "Restaurant UUID", example = "550e8400-e29b-41d4-a716-446655440000", required = true)
    private String restaurantUuid;

    @Schema(description = "Table UUID (for dine-in orders)", example = "550e8400-e29b-41d4-a716-446655440001")
    private String tableUuid;

    @Schema(description = "Waiter UUID", example = "550e8400-e29b-41d4-a716-446655440002")
    private String waiterUuid;

    @NotNull(message = "Order type is required")
    @Schema(description = "Type of order", example = "DINE_IN", required = true)
    private OrderType orderType;

    @Schema(description = "Number of guests", example = "4")
    @Min(value = 1, message = "Number of guests must be at least 1")
    private Integer numberOfGuests;

    // ===== CUSTOMER DETAILS =====

    @Schema(description = "Customer name", example = "John Doe")
    @Size(max = 100, message = "Customer name cannot exceed 100 characters")
    private String customerName;

    @Schema(description = "Customer phone", example = "+919876543210")
    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Invalid phone number format")
    private String customerPhone;

    @Schema(description = "Customer email", example = "john@example.com")
    @Email(message = "Invalid email format")
    private String customerEmail;

    @Schema(description = "Delivery address (for delivery orders)")
    private String deliveryAddress;

    // ===== ORDER ITEMS =====

    @NotEmpty(message = "Order must have at least one item")
    @Valid
    @Schema(description = "List of items in the order", required = true)
    @Builder.Default
    private List<OrderItemRequest> items = new ArrayList<>();

    // ===== CHARGES & DISCOUNTS =====

    @Schema(description = "Discount percentage", example = "10.00")
    @DecimalMin(value = "0.00", message = "Discount percentage cannot be negative")
    @DecimalMax(value = "100.00", message = "Discount percentage cannot exceed 100")
    private BigDecimal discountPercentage;

    @Schema(description = "Discount amount", example = "50.00")
    @DecimalMin(value = "0.00", message = "Discount amount cannot be negative")
    private BigDecimal discountAmount;

    @Schema(description = "Reason for discount", example = "Birthday offer")
    private String discountReason;

    @Schema(description = "Coupon code", example = "SAVE20")
    private String couponCode;

    @Schema(description = "Tax percentage", example = "5.00")
    @DecimalMin(value = "0.00", message = "Tax percentage cannot be negative")
    private BigDecimal taxPercentage;

    @Schema(description = "Service charge percentage", example = "10.00")
    @DecimalMin(value = "0.00", message = "Service charge percentage cannot be negative")
    private BigDecimal serviceChargePercentage;

    @Schema(description = "Delivery charge", example = "30.00")
    @DecimalMin(value = "0.00", message = "Delivery charge cannot be negative")
    private BigDecimal deliveryCharge;

    @Schema(description = "Packing charge", example = "20.00")
    @DecimalMin(value = "0.00", message = "Packing charge cannot be negative")
    private BigDecimal packingCharge;

    // ===== NOTES =====

    @Schema(description = "General order notes")
    @Size(max = 1000, message = "Order notes cannot exceed 1000 characters")
    private String orderNotes;

    @Schema(description = "Special instructions for kitchen")
    @Size(max = 1000, message = "Kitchen notes cannot exceed 1000 characters")
    private String kitchenNotes;

    // ===== FLAGS =====

    @Schema(description = "Send KOT immediately after creating order", example = "true")
    @Builder.Default
    private Boolean sendKotImmediately = false;
}

