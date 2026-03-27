package org.foodos.customer.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Simplified order response for customer CRM views
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Customer order history entry")
public class CustomerOrderResponse {

    @Schema(description = "Order UUID")
    private String orderUuid;

    @Schema(description = "Order number")
    private String orderNumber;

    @Schema(description = "Order date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate orderDate;

    @Schema(description = "Order time")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime orderTime;

    @Schema(description = "Order type", example = "DINE_IN")
    private String orderType;

    @Schema(description = "Order status", example = "COMPLETED")
    private String status;

    @Schema(description = "Total amount", example = "1250.00")
    private BigDecimal totalAmount;

    @Schema(description = "Number of items")
    private Integer itemCount;

    @Schema(description = "Table number")
    private String tableNumber;
}
