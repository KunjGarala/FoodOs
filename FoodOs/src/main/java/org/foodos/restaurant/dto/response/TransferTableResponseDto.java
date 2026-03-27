package org.foodos.restaurant.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Transfer table response")
public class TransferTableResponseDto {

    @Schema(description = "Event type for WebSocket identification", example = "TABLE_TRANSFER")
    @Builder.Default
    private String type = "TABLE_TRANSFER";

    @Schema(description = "Order UUID", example = "550e8400-e29b-41d4-a716-446655440000")
    private String orderId;

    @Schema(description = "Source table number", example = "T10")
    private String fromTable;

    @Schema(description = "Destination table number", example = "T15")
    private String toTable;

    @Schema(description = "Source table UUID", example = "550e8400-e29b-41d4-a716-446655440000")
    private String fromTableUuid;

    @Schema(description = "Destination table UUID", example = "550e8400-e29b-41d4-a716-446655440000")
    private String toTableUuid;

    @Schema(description = "Full source table data after transfer")
    private TableFloorPlanDto fromTableData;

    @Schema(description = "Full destination table data after transfer")
    private TableFloorPlanDto toTableData;

    @Schema(description = "Timestamp of transfer")
    private LocalDateTime transferredAt;
}
