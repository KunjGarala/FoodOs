package org.foodos.restaurant.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to create a new table")
public class CreateTableRequestDto {

    @NotNull(message = "Restaurant ID is required")
    @Schema(description = "Restaurant ID", example = "1", required = true)
    private Long restaurantId;

    @NotBlank(message = "Section name is required")
    @Schema(description = "Section name where table is located", example = "AC Hall", required = true)
    private String sectionName;

    @NotBlank(message = "Table number is required")
    @Schema(description = "Table number (must be unique per restaurant)", example = "T12", required = true)
    private String tableNumber;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be greater than 0")
    @Schema(description = "Table seating capacity", example = "6", required = true)
    private Integer capacity;

    @Schema(description = "Minimum capacity", example = "1")
    private Integer minCapacity;

    @Schema(description = "Table shape", example = "RECTANGLE", allowableValues = {"RECTANGLE", "CIRCLE", "SQUARE", "OVAL"})
    private String shape;

    @Schema(description = "X-coordinate for floor plan", example = "420")
    private Integer posX;

    @Schema(description = "Y-coordinate for floor plan", example = "180")
    private Integer posY;

    @Schema(description = "Is table active", example = "true")
    @Builder.Default
    private Boolean isActive = true;
}
