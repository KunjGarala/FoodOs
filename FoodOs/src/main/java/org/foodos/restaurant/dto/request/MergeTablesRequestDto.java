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

    @NotNull(message = "Parent table UUID is required")
    @Schema(description = "Parent table UUID (main table)", example = "550e8400-e29b-41d4-a716-446655440000", required = true)
    private String parentTableUuid;

    @NotEmpty(message = "Child table UUIDs are required")
    @Schema(description = "List of child table UUIDs to merge", example = "[\"550e8400-e29b-41d4-a716-446655440001\", \"550e8400-e29b-41d4-a716-446655440002\"]", required = true)
    private List<String> childTableUuids;
}
