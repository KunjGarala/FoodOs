package org.foodos.customer.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Detailed customer response including order history
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Detailed customer profile with order history")
public class CustomerDetailResponse {

    @Schema(description = "Customer UUID")
    private String customerUuid;

    @Schema(description = "Customer name")
    private String name;

    @Schema(description = "Customer phone")
    private String phone;

    @Schema(description = "Customer email")
    private String email;

    @Schema(description = "Customer address")
    private String address;

    @Schema(description = "CRM notes")
    private String notes;

    @Schema(description = "Tags")
    private String tags;

    // ===== STATS =====

    @Schema(description = "Total number of orders")
    private Integer totalOrders;

    @Schema(description = "Total amount spent")
    private BigDecimal totalSpent;

    @Schema(description = "Average order value")
    private BigDecimal averageOrderValue;

    @Schema(description = "Last order date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate lastOrderDate;

    @Schema(description = "First order date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate firstOrderDate;

    @Schema(description = "Last order type")
    private String lastOrderType;

    @Schema(description = "Customer since")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    // ===== ORDER HISTORY =====

    @Schema(description = "Recent order history")
    private List<CustomerOrderResponse> recentOrders;

    // ===== TOP ITEMS =====

    @Schema(description = "Most frequently ordered items")
    private List<FavoriteItemResponse> favoriteItems;
}
