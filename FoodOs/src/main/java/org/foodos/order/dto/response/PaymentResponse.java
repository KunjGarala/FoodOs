package org.foodos.order.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import org.foodos.order.entity.enums.PaymentMethod;
import org.foodos.order.entity.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO for Payment
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Payment response")
public class PaymentResponse {

    @Schema(description = "Payment UUID", example = "550e8400-e29b-41d4-a716-446655440000")
    private String paymentUuid;

    @Schema(description = "Payment method", example = "CASH")
    private PaymentMethod paymentMethod;

    @Schema(description = "Amount", example = "500.00")
    private BigDecimal amount;

    @Schema(description = "Payment status", example = "COMPLETED")
    private PaymentStatus status;

    @Schema(description = "Transaction ID", example = "TXN123456")
    private String transactionId;

    @Schema(description = "Reference number", example = "REF789")
    private String referenceNumber;

    @Schema(description = "Card last four digits", example = "1234")
    private String cardLastFour;

    @Schema(description = "Card type", example = "VISA")
    private String cardType;

    @Schema(description = "UPI ID", example = "user@paytm")
    private String upiId;

    @Schema(description = "Bank name", example = "HDFC Bank")
    private String bankName;

    @Schema(description = "Notes")
    private String notes;

    @Schema(description = "Collected by", example = "Cashier Name")
    private String collectedBy;

    @Schema(description = "Is refunded", example = "false")
    private Boolean isRefunded;

    @Schema(description = "Refund amount", example = "0.00")
    private BigDecimal refundAmount;

    @Schema(description = "Net amount after refund", example = "500.00")
    private BigDecimal netAmount;

    @Schema(description = "Payment date")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime paymentDate;

    @Schema(description = "Refund date")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime refundDate;

    @Schema(description = "Created at")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
}

