package org.foodos.order.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.*;
import org.foodos.order.entity.enums.PaymentMethod;

import java.math.BigDecimal;

/**
 * Request DTO for adding payment to an order
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to add payment to an order")
public class AddPaymentRequest {

    @NotNull(message = "Payment method is required")
    @Schema(description = "Payment method", example = "CASH", required = true)
    private PaymentMethod paymentMethod;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    @Schema(description = "Payment amount", example = "500.00", required = true)
    private BigDecimal amount;

    @Schema(description = "Transaction ID (for digital payments)", example = "TXN123456")
    private String transactionId;

    @Schema(description = "Reference number", example = "REF789")
    private String referenceNumber;

    @Schema(description = "Last 4 digits of card (for card payments)", example = "1234")
    @Pattern(regexp = "^[0-9]{4}$", message = "Card last four must be exactly 4 digits")
    private String cardLastFour;

    @Schema(description = "Card type", example = "VISA")
    private String cardType;

    @Schema(description = "UPI ID (for UPI payments)", example = "user@paytm")
    private String upiId;

    @Schema(description = "Bank name", example = "HDFC Bank")
    private String bankName;

    @Schema(description = "Payment notes")
    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;
}

