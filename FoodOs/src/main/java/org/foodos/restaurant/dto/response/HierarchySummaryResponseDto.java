package org.foodos.restaurant.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Chain hierarchy summary: per-outlet live KPIs + group totals")
public class HierarchySummaryResponseDto {

    @Schema(description = "Sum of salesToday across all outlets", example = "418000.00")
    private BigDecimal groupSalesToday;

    @Schema(description = "Sum of coversToday across all outlets", example = "612")
    private Long groupCoversToday;

    @Schema(description = "Number of outlets included (includes the parent if it's operational)", example = "4")
    private Integer outletCount;

    @Schema(description = "Per-outlet KPI breakdown")
    private List<OutletKpi> outlets;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class OutletKpi {
        private String     restaurantUuid;
        private String     name;
        private String     city;
        private String     status;
        private BigDecimal salesToday;
        private Long       coversToday;
        private Integer    tableCount;
    }
}
