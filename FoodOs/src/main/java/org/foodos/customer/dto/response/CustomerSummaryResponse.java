package org.foodos.customer.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Customer summary response for list views
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Customer summary for CRM list view")
public class CustomerSummaryResponse {

    @Schema(description = "Customer UUID")
    private String customerUuid;

    @Schema(description = "Customer name", example = "John Doe")
    private String name;

    @Schema(description = "Customer phone", example = "+919876543210")
    private String phone;

    @Schema(description = "Customer email", example = "john@example.com")
    private String email;

    @Schema(description = "Total number of orders", example = "15")
    private Integer totalOrders;

    @Schema(description = "Total amount spent", example = "12500.00")
    private BigDecimal totalSpent;

    @Schema(description = "Average order value", example = "833.33")
    private BigDecimal averageOrderValue;

    @Schema(description = "Last order date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate lastOrderDate;

    @Schema(description = "First order date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate firstOrderDate;

    @Schema(description = "Last order type", example = "DINE_IN")
    private String lastOrderType;

    @Schema(description = "Tags", example = "VIP,Regular")
    private String tags;

    @Schema(description = "Customer since")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
}
