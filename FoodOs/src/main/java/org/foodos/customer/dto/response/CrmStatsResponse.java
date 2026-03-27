package org.foodos.customer.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.math.BigDecimal;

/**
 * CRM dashboard stats
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "CRM statistics overview")
public class CrmStatsResponse {

    @Schema(description = "Total unique customers")
    private Long totalCustomers;

    @Schema(description = "Returning customers (more than 1 order)")
    private Long returningCustomers;

    @Schema(description = "New customers (only 1 order)")
    private Long newCustomers;

    @Schema(description = "Return rate percentage")
    private BigDecimal returnRate;
}
