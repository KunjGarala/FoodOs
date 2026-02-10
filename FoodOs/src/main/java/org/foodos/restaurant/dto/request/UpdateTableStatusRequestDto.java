package org.foodos.restaurant.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.foodos.restaurant.entity.enums.TableStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to update table status")
public class UpdateTableStatusRequestDto {

    @NotNull(message = "Status is required")
    @Schema(description = "New table status", example = "OCCUPIED", required = true)
    private TableStatus status;

    @Schema(description = "Current order UUID (required when status is OCCUPIED)", example = "550e8400-e29b-41d4-a716-446655440000")
    private String currentOrderId;

    @Schema(description = "Waiter UUID assigned to this table", example = "550e8400-e29b-41d4-a716-446655440000")
    private String waiterUuid;

    @Schema(description = "Number of guests seated", example = "4")
    private Integer currentPax;
}
