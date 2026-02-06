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

    @NotNull(message = "Source table ID is required")
    @Schema(description = "Source table ID", example = "10", required = true)
    private Long fromTableId;

    @NotNull(message = "Destination table ID is required")
    @Schema(description = "Destination table ID", example = "15", required = true)
    private Long toTableId;
}
