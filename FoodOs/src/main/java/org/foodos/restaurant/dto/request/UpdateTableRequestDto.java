package org.foodos.restaurant.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to update table details (not status)")
public class UpdateTableRequestDto {

    @Schema(description = "Section name where table is located", example = "VIP Area")
    private String sectionName;

    @Min(value = 1, message = "Capacity must be greater than 0")
    @Schema(description = "Table seating capacity", example = "8")
    private Integer capacity;

    @Schema(description = "Minimum capacity", example = "2")
    private Integer minCapacity;

    @Schema(description = "X-coordinate for floor plan", example = "460")
    private Integer posX;

    @Schema(description = "Y-coordinate for floor plan", example = "220")
    private Integer posY;

    @Schema(description = "Table shape", example = "RECTANGLE")
    private String shape;

    @Schema(description = "Is table active", example = "true")
    private Boolean isActive;
}
