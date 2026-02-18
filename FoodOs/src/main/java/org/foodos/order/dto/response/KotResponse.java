package org.foodos.order.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import org.foodos.order.entity.enums.KotTicketStatus;
import org.foodos.order.entity.enums.KotType;
import org.foodos.order.entity.enums.SpicyLevel;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Response DTO for Kitchen Order Ticket
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Kitchen Order Ticket response")
public class KotResponse {

    @Schema(description = "KOT UUID", example = "550e8400-e29b-41d4-a716-446655440000")
    private String kotUuid;

    @Schema(description = "KOT number", example = "KOT-001")
    private String kotNumber;

    @Schema(description = "Order number", example = "ORD-001")
    private String orderNumber;

    @Schema(description = "Table number", example = "T12")
    private String tableNumber;

    @Schema(description = "Waiter name", example = "John Doe")
    private String waiterName;

    @Schema(description = "KOT date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate kotDate;

    @Schema(description = "KOT time")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime kotTime;

    @Schema(description = "KOT type", example = "NEW")
    private KotType kotType;

    @Schema(description = "KOT status", example = "SENT")
    private KotTicketStatus status;

    @Schema(description = "Printer target", example = "KITCHEN_MAIN")
    private String printerTarget;

    @Schema(description = "Kitchen station", example = "HOT_KITCHEN")
    private String kitchenStation;

    @Schema(description = "Spicy level", example = "MEDIUM")
    private SpicyLevel spicyLevel;

    @Schema(description = "Total quantity", example = "5.0")
    private BigDecimal totalQuantity;

    @Schema(description = "Kitchen notes")
    private String kitchenNotes;

    @Schema(description = "Order notes")
    private String orderNotes;

    @Schema(description = "KOT items")
    @Builder.Default
    private List<KotItemResponse> kotItems = new ArrayList<>();

    @Schema(description = "Total items count", example = "3")
    private Integer totalItemsCount;

    @Schema(description = "Notes")
    private String notes;

    @Schema(description = "Special instructions")
    private String specialInstructions;

    @Schema(description = "Is urgent", example = "false")
    private Boolean isUrgent;

    @Schema(description = "Priority", example = "0")
    private Integer priority;

    @Schema(description = "Printed at")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime printedAt;

    @Schema(description = "Acknowledged at")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime acknowledgedAt;

    @Schema(description = "Preparation started at")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime preparationStartedAt;

    @Schema(description = "Ready at")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime readyAt;

    @Schema(description = "Completed at")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime completedAt;

    @Schema(description = "Created at")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
}

