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
@Schema(description = "Live pressure-band summary for the floor view")
public class TableLiveSummaryDto {

    @Schema(description = "Total guests currently seated (sum of currentPax across OCCUPIED tables)", example = "132")
    private Integer coversSeated;

    @Schema(description = "Tables in BILLING status (about to turn over)", example = "5")
    private Integer tablesTurning;

    @Schema(description = "Average dwell time in minutes across occupied tables", example = "48")
    private Double avgDwellMinutes;

    @Schema(description = "KOTs older than 20 minutes still in SENT/ACKNOWLEDGED/IN_PROGRESS", example = "2")
    private Long kotsLate;
}
