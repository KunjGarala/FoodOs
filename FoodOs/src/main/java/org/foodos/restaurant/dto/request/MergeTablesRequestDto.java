package org.foodos.restaurant.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to merge multiple tables")
public class MergeTablesRequestDto {

    @NotNull(message = "Parent table ID is required")
    @Schema(description = "Parent table ID (main table)", example = "10", required = true)
    private Long parentTableId;

    @NotEmpty(message = "Child table IDs are required")
    @Schema(description = "List of child table IDs to merge", example = "[11, 12]", required = true)
    private List<Long> childTableIds;
}
