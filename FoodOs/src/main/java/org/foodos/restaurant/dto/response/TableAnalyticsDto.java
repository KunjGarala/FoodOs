package org.foodos.restaurant.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Table analytics data")
public class TableAnalyticsDto {

    @Schema(description = "Average table turn time in minutes", example = "54")
    private Double averageTurnTimeMinutes;

    @Schema(description = "Occupancy rate percentage", example = "72.5")
    private Double occupancyRate;

    @Schema(description = "Most frequently used table number", example = "T5")
    private String mostUsedTable;

    @Schema(description = "Total orders served today", example = "45")
    private Integer totalOrdersToday;

    @Schema(description = "Peak hour (24-hour format)", example = "19")
    private Integer peakHour;

    @Schema(description = "Average guests per table", example = "3.5")
    private Double averageGuestsPerTable;
}
