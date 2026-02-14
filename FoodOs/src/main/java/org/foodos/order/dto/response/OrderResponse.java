package org.foodos.order.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import org.foodos.order.entity.enums.OrderStatus;
import org.foodos.order.entity.enums.OrderType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Response DTO for Order
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Order response with full details")
public class OrderResponse {

    @Schema(description = "Order UUID", example = "550e8400-e29b-41d4-a716-446655440000")
    private String orderUuid;

    @Schema(description = "Order number", example = "ORD-001")
    private String orderNumber;

    @Schema(description = "Restaurant UUID", example = "550e8400-e29b-41d4-a716-446655440000")
    private String restaurantUuid;

    @Schema(description = "Restaurant name", example = "The Food Plaza")
    private String restaurantName;

    @Schema(description = "Table number", example = "T12")
    private String tableNumber;

    @Schema(description = "Waiter name", example = "John Doe")
    private String waiterName;

    @Schema(description = "Order date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate orderDate;

    @Schema(description = "Order time")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime orderTime;

    @Schema(description = "Order type", example = "DINE_IN")
    private OrderType orderType;

    @Schema(description = "Number of guests", example = "4")
    private Integer numberOfGuests;

    @Schema(description = "Order status", example = "OPEN")
    private OrderStatus status;

    // ===== CUSTOMER DETAILS =====

    @Schema(description = "Customer name", example = "Jane Smith")
    private String customerName;

    @Schema(description = "Customer phone", example = "+919876543210")
    private String customerPhone;

    @Schema(description = "Customer email", example = "jane@example.com")
    private String customerEmail;

    @Schema(description = "Delivery address")
    private String deliveryAddress;

    // ===== ITEMS =====

    @Schema(description = "Order items")
    @Builder.Default
    private List<OrderItemResponse> items = new ArrayList<>();

    @Schema(description = "Total item count", example = "5")
    private Integer itemCount;

    // ===== FINANCIAL DETAILS =====

    @Schema(description = "Subtotal amount", example = "1000.00")
    private BigDecimal subtotal;

    @Schema(description = "Discount amount", example = "100.00")
    private BigDecimal discountAmount;

    @Schema(description = "Discount percentage", example = "10.00")
    private BigDecimal discountPercentage;

    @Schema(description = "Tax amount", example = "45.00")
    private BigDecimal taxAmount;

    @Schema(description = "Tax percentage", example = "5.00")
    private BigDecimal taxPercentage;

    @Schema(description = "Service charge", example = "90.00")
    private BigDecimal serviceCharge;

    @Schema(description = "Service charge percentage", example = "10.00")
    private BigDecimal serviceChargePercentage;

    @Schema(description = "Delivery charge", example = "30.00")
    private BigDecimal deliveryCharge;

    @Schema(description = "Packing charge", example = "20.00")
    private BigDecimal packingCharge;

    @Schema(description = "Tip amount", example = "50.00")
    private BigDecimal tipAmount;

    @Schema(description = "Round off amount", example = "0.50")
    private BigDecimal roundOff;

    @Schema(description = "Total amount", example = "1135.50")
    private BigDecimal totalAmount;

    @Schema(description = "Paid amount", example = "500.00")
    private BigDecimal paidAmount;

    @Schema(description = "Balance amount", example = "635.50")
    private BigDecimal balanceAmount;

    // ===== PAYMENTS =====

    @Schema(description = "Payments made")
    @Builder.Default
    private List<PaymentResponse> payments = new ArrayList<>();

    // ===== KOT INFO =====

    @Schema(description = "KOT sent status", example = "true")
    private Boolean kotSent;

    @Schema(description = "Number of KOTs sent", example = "2")
    private Integer kotCount;

    // ===== NOTES =====

    @Schema(description = "Order notes")
    private String orderNotes;

    @Schema(description = "Kitchen notes")
    private String kitchenNotes;

    @Schema(description = "Discount reason")
    private String discountReason;

    @Schema(description = "Coupon code")
    private String couponCode;

    // ===== CANCELLATION =====

    @Schema(description = "Cancellation reason")
    private String cancellationReason;

    @Schema(description = "Cancelled at")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime cancelledAt;

    @Schema(description = "Cancelled by")
    private String cancelledBy;

    // ===== TIMESTAMPS =====

    @Schema(description = "Billed at")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime billedAt;

    @Schema(description = "Paid at")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime paidAt;

    @Schema(description = "Completed at")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime completedAt;

    @Schema(description = "Created at")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @Schema(description = "Updated at")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
}

