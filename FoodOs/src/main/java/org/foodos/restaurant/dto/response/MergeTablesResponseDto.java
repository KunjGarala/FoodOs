package org.foodos.restaurant.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.foodos.restaurant.entity.enums.TableStatus;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Merge tables response")
public class MergeTablesResponseDto {

    @Schema(description = "Merged table ID (parent)", example = "10")
    private Long mergedTableId;

    @Schema(description = "Merged table number", example = "T10")
    private String mergedTableNumber;

    @Schema(description = "List of merged table numbers", example = "[\"T11\", \"T12\"]")
    private List<String> mergedTables;

    @Schema(description = "Total combined capacity", example = "12")
    private Integer totalCapacity;

    @Schema(description = "Current status after merge", example = "OCCUPIED")
    private TableStatus status;

    @Schema(description = "Timestamp of merge operation")
    private LocalDateTime mergedAt;
}
