package org.foodos.restaurant.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to assign or reassign a waiter to a table")
public class AssignWaiterRequestDto {

    @NotBlank(message = "Waiter UUID is required")
    @Schema(description = "UUID of the waiter to assign", example = "550e8400-e29b-41d4-a716-446655440000", required = true)
    private String waiterUuid;
}
