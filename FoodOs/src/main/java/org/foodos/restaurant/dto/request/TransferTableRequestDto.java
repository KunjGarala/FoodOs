package org.foodos.restaurant.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to transfer table order")
public class TransferTableRequestDto {

    @NotNull(message = "Source table UUID is required")
    @Schema(description = "Source table UUID", example = "550e8400-e29b-41d4-a716-446655440000", required = true)
    private String fromTableUuid;

    @NotNull(message = "Destination table UUID is required")
    @Schema(description = "Destination table UUID", example = "550e8400-e29b-41d4-a716-446655440001", required = true)
    private String toTableUuid;
}
